const crypto = require('crypto');
const { prisma } = require('../lib/prisma');

const AGORA_APP_ID = process.env.AGORA_APP_ID;
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE;

function generateAgoraToken(channelName, uid) {
  if (!AGORA_APP_ID || !AGORA_APP_CERTIFICATE) {
    return `placeholder_token_${Date.now()}`;
  }
  const role = 1;
  const expirationTimeInSeconds = 3600;
  const currentTimestamp = Math.floor(Date.now() / 1000);
  const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
  const tokenVersion = '006';
  const content = Buffer.alloc(32);
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(privilegeExpiredTs, 4);
  content.writeUInt32BE(role, 8);
  content.write(AGORA_APP_ID, 12);
  content.writeUInt32BE(0, 24);
  content.write(channelName, 28);
  const contentBase64 = content.toString('base64');
  const signature = crypto.createHmac('sha256', Buffer.from(AGORA_APP_CERTIFICATE, 'base64')).update(Buffer.from(contentBase64, 'base64')).digest('base64');
  return `${tokenVersion}${signature}${contentBase64}`;
}

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
  const agoraToken = generateAgoraToken(roomId, dto.userId);
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
  const agoraToken = generateAgoraToken(session.roomId, userId);
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

module.exports = { create, getSession, startSession, endSession };
