const { prisma } = require('../lib/prisma');
const { buildRtcToken } = require('../utils/agora');
const walletService = require('./walletService');

async function create(bookingSessionId, dto) {
  const bookingSession = await prisma.bookingSession.findUnique({
    where: { id: bookingSessionId },
    include: { booking: { include: { teacher: true, student: true } } },
  });
  if (!bookingSession) throw Object.assign(new Error('Booking session not found'), { statusCode: 404 });
  const booking = bookingSession.booking;
  if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking must be confirmed before creating session'), { statusCode: 400 });
  const payment = await prisma.payment.findUnique({ where: { bookingId: booking.id } });
  if (!payment || payment.status !== 'COMPLETED') throw Object.assign(new Error('Payment must be completed before creating session'), { statusCode: 400 });
  const existingSession = await prisma.session.findUnique({ where: { bookingSessionId } });
  if (existingSession) return existingSession;
  const roomId = `room_${bookingSessionId}_${Date.now()}`;
  const { token: agoraToken } = buildRtcToken(roomId, dto.userId);
  const session = await prisma.session.create({
    data: {
      bookingSessionId,
      type: dto.type || 'VIDEO',
      roomId,
      agoraToken,
    },
    include: {
      bookingSession: {
        include: {
          booking: {
            include: {
              teacher: { include: { user: true } },
              student: true,
            },
          },
        },
      },
    },
  });
  return session;
}

async function getSession(bookingSessionId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingSessionId },
    include: {
      bookingSession: {
        include: {
          booking: {
            include: {
              teacher: { include: { user: true } },
              student: true,
            },
          },
        },
      },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const booking = session.bookingSession?.booking;
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== userId && booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this session'), { statusCode: 403 });
  }
  const { token: agoraToken } = buildRtcToken(session.roomId, userId);
  return { ...session, agoraToken };
}

async function startSession(bookingSessionId) {
  const session = await prisma.session.findUnique({ where: { bookingSessionId } });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  return prisma.session.update({
    where: { bookingSessionId },
    data: { startedAt: new Date() },
  });
}

async function endSession(bookingSessionId, recordingUrl) {
  const session = await prisma.session.findUnique({
    where: { bookingSessionId },
    include: { bookingSession: { include: { booking: true } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const startedAt = session.startedAt || new Date();
  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);
  const updated = await prisma.session.update({
    where: { bookingSessionId },
    data: { endedAt, recordingUrl, duration },
  });
  await prisma.bookingSession.update({
    where: { id: bookingSessionId },
    data: { status: 'COMPLETED' },
  });

  const allSlots = await prisma.bookingSession.findMany({
    where: { bookingId: session.bookingSession.bookingId },
    select: { status: true },
  });
  const allCompleted = allSlots.length > 0 && allSlots.every((s) => s.status === 'COMPLETED');
  if (allCompleted) {
    await prisma.booking.update({
      where: { id: session.bookingSession.bookingId },
      data: { status: 'COMPLETED' },
    });
  }

  try {
    await walletService.creditFromSession(updated.id);
  } catch (err) {
    console.error(`[session] Failed to credit wallet for session ${updated.id}:`, err.message);
  }

  return updated;
}

/** List sessions for current user (as teacher or student) */
async function getMySessions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
  const where = teacher
    ? { bookingSession: { booking: { teacherId: teacher.id } } }
    : { bookingSession: { booking: { studentId: userId } } };
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      include: {
        bookingSession: {
          include: {
            booking: {
              include: {
                teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true } } } },
                student: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.session.count({ where }),
  ]);
  return { data: sessions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { create, getSession, startSession, endSession, getMySessions };
