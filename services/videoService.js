const crypto = require('crypto');
const { prisma } = require('../lib/prisma');

function getAgoraAppId() {
  return (process.env.AGORA_APP_ID || '').trim();
}
const AGORA_APP_ID = getAgoraAppId();
const AGORA_APP_CERTIFICATE = process.env.AGORA_APP_CERTIFICATE || process.env.AGORA_APP_SECRET;

function getAgoraCertBuffer() {
  const cert = AGORA_APP_CERTIFICATE;
  if (!cert) return null;
  try {
    if (/^[A-Za-z0-9+/=]+$/.test(cert) && cert.length > 24) {
      return Buffer.from(cert, 'base64');
    }
    return Buffer.from(cert, 'utf8');
  } catch {
    return Buffer.from(cert, 'utf8');
  }
}

function generateAgoraToken(channelName, uid) {
  const appId = getAgoraAppId();
  if (!appId || !AGORA_APP_CERTIFICATE) return `placeholder_${Date.now()}`;
  const certBuffer = getAgoraCertBuffer();
  if (!certBuffer) return `placeholder_${Date.now()}`;
  const role = 1;
  const privilegeExpiredTs = Math.floor(Date.now() / 1000) + 3600;
  const name = String(channelName).slice(0, 64);
  const content = Buffer.alloc(28 + Math.max(name.length, 4));
  content.writeUInt32BE(0, 0);
  content.writeUInt32BE(privilegeExpiredTs, 4);
  content.writeUInt32BE(role, 8);
  content.write(appId, 12);
  content.writeUInt32BE(0, 24);
  content.write(name, 28);
  const contentBase64 = content.toString('base64');
  const signature = crypto.createHmac('sha256', certBuffer).update(Buffer.from(contentBase64, 'base64')).digest('base64');
  return `006${signature}${contentBase64}`;
}

/** For dashboard test pages: get appId + token for any channel (no booking required) */
function getTestToken(channelName, uid = 1) {
  const name = String(channelName || `test-${Date.now()}`).replace(/\s/g, '-').slice(0, 64);
  const id = Math.abs(parseInt(uid, 10) || 1);
  const token = generateAgoraToken(name, id);
  const appId = getAgoraAppId();
  if (!appId) throw Object.assign(new Error('AGORA_APP_ID is not set in server .env'), { statusCode: 503 });
  return { appId, token, channelName: name, uid: id };
}

async function createSession(bookingId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { student: true, teacher: { include: { user: true } } },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== userId && booking.teacher.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  let session = await prisma.session.findUnique({ where: { bookingId } });
  const appId = getAgoraAppId();
  if (!appId) throw Object.assign(new Error('AGORA_APP_ID is not set in server .env'), { statusCode: 503 });
  if (session) {
    const token = generateAgoraToken(session.roomId, userId);
    return { ...session, token, appId };
  }
  const roomId = `room_${bookingId}_${Date.now()}`;
  const token = generateAgoraToken(roomId, userId);
  session = await prisma.session.create({
    data: { bookingId, type: 'VIDEO', roomId, agoraToken: token, startedAt: new Date() },
  });
  return { ...session, token, appId };
}

async function getSessionToken(bookingId, userId) {
  const appId = getAgoraAppId();
  if (!appId) throw Object.assign(new Error('AGORA_APP_ID is not set in server .env'), { statusCode: 503 });
  const session = await prisma.session.findUnique({
    where: { bookingId },
    include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const token = generateAgoraToken(session.roomId, userId);
  return { ...session, token, appId };
}

async function endSession(bookingId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingId },
    include: { booking: { include: { teacher: true } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  if (session.booking.teacher.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const startedAt = session.startedAt || new Date();
  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);
  const updated = await prisma.session.update({
    where: { bookingId },
    data: { endedAt, duration },
  });
  await prisma.booking.update({ where: { id: bookingId }, data: { status: 'COMPLETED' } });
  return updated;
}

async function getSessionHistory(bookingId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingId },
    include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  if (session.booking.studentId !== userId && session.booking.teacher.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return session;
}

async function startWatching(videoId, userId, lessonId, courseId) {
  const progress = await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: { status: 'WATCHING', updatedAt: new Date() },
    create: { userId, videoId, lessonId, courseId, status: 'WATCHING', watchProgress: 0 },
  });
  return { success: true, message: 'تم تسجيل بداية المشاهدة بنجاح', data: { video_progress: { id: progress.id, user_id: progress.userId, video_id: progress.videoId, lesson_id: progress.lessonId, course_id: progress.courseId, status: progress.status.toLowerCase(), watch_progress: progress.watchProgress, started_at: progress.startedAt, completed_at: progress.completedAt } } };
}

async function completeVideo(videoId, userId, lessonId, courseId, duration) {
  const progress = await prisma.videoProgress.upsert({
    where: { userId_videoId: { userId, videoId } },
    update: { status: 'COMPLETED', watchProgress: 100, watchDurationSeconds: duration || 0, completedAt: new Date(), updatedAt: new Date() },
    create: { userId, videoId, lessonId, courseId, status: 'COMPLETED', watchProgress: 100, watchDurationSeconds: duration || 0, completedAt: new Date() },
  });
  const enrollment = await prisma.courseEnrollment.findUnique({ where: { courseId_studentId: { courseId, studentId: userId } } });
  if (enrollment) {
    const totalVideos = await prisma.video.count({ where: { lesson: { courseId } } });
    const completedCount = await prisma.videoProgress.count({ where: { userId, courseId, status: 'COMPLETED' } });
    const progressPercent = totalVideos > 0 ? (completedCount / totalVideos) * 100 : 0;
    await prisma.courseEnrollment.update({ where: { id: enrollment.id }, data: { progress: progressPercent } });
  }
  return { success: true, message: 'تم إكمال الفيديو بنجاح', data: { video_progress: { id: progress.id, user_id: progress.userId, video_id: progress.videoId, status: progress.status.toLowerCase(), watch_progress: progress.watchProgress }, course_progress: enrollment?.progress || 0 } };
}

async function getVideoAccess(videoId, userId) {
  const video = await prisma.video.findUnique({ where: { id: videoId }, include: { lesson: { include: { course: true } } } });
  if (!video) throw Object.assign(new Error('Video not found'), { statusCode: 404 });
  const enrollment = await prisma.courseEnrollment.findUnique({ where: { courseId_studentId: { courseId: video.lesson.courseId, studentId: userId } } });
  const lesson = await prisma.lesson.findUnique({ where: { id: video.lessonId } });
  const hasAccess = (lesson && lesson.isFree) || !!enrollment;
  if (!hasAccess) throw Object.assign(new Error('You do not have access to this video'), { statusCode: 403 });
  const format = video.videoUrl && video.videoUrl.includes('.m3u8') ? 'hls' : 'mp4';
  return { success: true, message: 'Access granted', data: { video_url: video.videoUrl, format, drm_token: null } };
}

async function getCourseProgress(courseId, userId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: 'asc' }, include: { videos: { orderBy: { order: 'asc' } } } } },
  });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  const progressList = await prisma.videoProgress.findMany({ where: { userId, courseId }, include: { video: true } });
  const completedVideos = progressList.filter((p) => p.status === 'COMPLETED');
  const allVideos = course.lessons.flatMap((l) => l.videos.map((v) => ({ ...v, lessonId: l.id })));
  const totalVideos = allVideos.length;
  const progressPercent = totalVideos > 0 ? (completedVideos.length / totalVideos) * 100 : 0;
  return { success: true, data: { course_id: courseId, total_videos: totalVideos, completed_videos: completedVideos.length, progress: progressPercent } };
}

module.exports = { createSession, getSessionToken, endSession, getSessionHistory, getTestToken, startWatching, completeVideo, getVideoAccess, getCourseProgress };
