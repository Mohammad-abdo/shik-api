const { prisma } = require('../lib/prisma');
const { buildRtcToken } = require('../utils/agora');

async function create(bookingId, dto) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true, student: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking must be confirmed before creating session'), { statusCode: 400 });
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment || payment.status !== 'COMPLETED') throw Object.assign(new Error('Payment must be completed before creating session'), { statusCode: 400 });
  const existingSession = await prisma.session.findUnique({ where: { bookingId } });
  if (existingSession) return existingSession;
  const roomId = `room_${bookingId}_${Date.now()}`;
  const { token: agoraToken } = buildRtcToken(roomId, dto.userId);
  const session = await prisma.session.create({
    data: {
      bookingId,
      type: dto.type || 'VIDEO',
      roomId,
      agoraToken,
    },
    include: {
      booking: {
        include: {
          teacher: { include: { user: true } },
          student: true,
        },
      },
    },
  });
  return session;
}

async function getSession(bookingId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          teacher: { include: { user: true } },
          student: true,
        },
      },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  if (session.booking.studentId !== userId && session.booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this session'), { statusCode: 403 });
  }
  const { token: agoraToken } = buildRtcToken(session.roomId, userId);
  return { ...session, agoraToken };
}

async function startSession(bookingId) {
  const session = await prisma.session.findUnique({ where: { bookingId } });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  return prisma.session.update({
    where: { bookingId },
    data: { startedAt: new Date() },
  });
}

async function endSession(bookingId, recordingUrl) {
  const session = await prisma.session.findUnique({ where: { bookingId } });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const startedAt = session.startedAt || new Date();
  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);
  const updated = await prisma.session.update({
    where: { bookingId },
    data: { endedAt, recordingUrl, duration },
  });
  await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'COMPLETED' },
  });
  return updated;
}

/** List sessions for current user (as teacher or student) */
async function getMySessions(userId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  const teacher = await prisma.teacher.findUnique({ where: { userId }, select: { id: true } });
  const where = teacher
    ? { booking: { teacherId: teacher.id } }
    : { booking: { studentId: userId } };
  const [sessions, total] = await Promise.all([
    prisma.session.findMany({
      where,
      skip,
      take: limit,
      include: {
        booking: {
          include: {
            teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true } } } },
            student: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true } },
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
