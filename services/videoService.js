const { prisma } = require('../lib/prisma');
const { buildRtcToken, getAgoraConfigOrThrow, sanitizeChannelName, sanitizeUid } = require('../utils/agora');
function getBookingWindowFromSlot(scheduledDate, startTime, endTimeOrDurationMinutes) {
  const date = new Date(scheduledDate);
  const [hour = '0', minute = '0'] = String(startTime || '00:00').split(':');
  const startAt = new Date(date);
  startAt.setHours(parseInt(hour, 10) || 0, parseInt(minute, 10) || 0, 0, 0);
  let durationMinutes = 120;
  if (typeof endTimeOrDurationMinutes === 'number') {
    durationMinutes = endTimeOrDurationMinutes;
  } else if (typeof endTimeOrDurationMinutes === 'string' && endTimeOrDurationMinutes.includes(':')) {
    const [eh, em] = endTimeOrDurationMinutes.split(':').map(Number);
    durationMinutes = (eh - (hour || 0)) * 60 + ((em || 0) - (minute || 0));
    if (durationMinutes <= 0) durationMinutes = 120;
  }
  const endAt = new Date(startAt.getTime() + (durationMinutes * 60 * 1000));
  return { startAt, endAt };
}

function validateStudentJoinWindowOrThrow(bookingSession, booking, userId) {
  if (booking.studentId !== userId) return;
  const now = new Date();
  const { startAt, endAt } = getBookingWindowFromSlot(
    bookingSession.scheduledDate,
    bookingSession.startTime,
    bookingSession.endTime || booking.duration || 120
  );
  if (now < startAt) {
    throw Object.assign(new Error('Student cannot join before the scheduled start time'), { statusCode: 403 });
  }
  if (now > endAt) {
    throw Object.assign(new Error('Session time window has ended (2 hours)'), { statusCode: 403 });
  }
}

/** For dashboard test pages: get appId + token for any channel (no booking required) */
function getTestToken(channelName, uid = 1) {
  const name = sanitizeChannelName(channelName);
  const id = sanitizeUid(uid);
  const { token, appId } = buildRtcToken(name, id);
  return { appId, token, channelName: name, uid: id };
}

async function createSession(bookingSessionId, userId) {
  const bookingSession = await prisma.bookingSession.findUnique({
    where: { id: bookingSessionId },
    include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
  });
  if (!bookingSession) throw Object.assign(new Error('Booking session not found'), { statusCode: 404 });
  const booking = bookingSession.booking;
  if (booking.studentId !== userId && booking.teacher.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking must be confirmed before joining session'), { statusCode: 400 });
  if (bookingSession.status === 'CANCELLED') throw Object.assign(new Error('This session slot was cancelled'), { statusCode: 400 });
  validateStudentJoinWindowOrThrow(bookingSession, booking, userId);
  let session = await prisma.session.findUnique({ where: { bookingSessionId } });
  const { appId } = getAgoraConfigOrThrow();
  if (session) {
    const { token } = buildRtcToken(session.roomId, userId);
    return { ...session, token, appId };
  }
  const roomId = `room_${bookingSessionId}_${Date.now()}`;
  const { token } = buildRtcToken(roomId, userId);
  session = await prisma.session.create({
    data: { bookingSessionId, type: 'VIDEO', roomId, agoraToken: token, startedAt: new Date() },
  });
  return { ...session, token, appId };
}

async function getSessionToken(bookingSessionId, userId) {
  const { appId } = getAgoraConfigOrThrow();
  const session = await prisma.session.findUnique({
    where: { bookingSessionId },
    include: {
      bookingSession: {
        include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
      },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const booking = session.bookingSession?.booking;
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== userId && booking.teacher.userId !== userId) {
    throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  }
  if (booking.status !== 'CONFIRMED') {
    throw Object.assign(new Error('Booking must be confirmed before joining session'), { statusCode: 400 });
  }
  validateStudentJoinWindowOrThrow(session.bookingSession, booking, userId);
  const { token } = buildRtcToken(session.roomId, userId);
  return { ...session, token, appId };
}

async function endSession(bookingSessionId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingSessionId },
    include: { bookingSession: { include: { booking: { include: { teacher: true } } } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  if (session.bookingSession?.booking?.teacher?.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  const startedAt = session.startedAt || new Date();
  const endedAt = new Date();
  const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);
  const updated = await prisma.session.update({
    where: { bookingSessionId },
    data: { endedAt, duration },
  });
  await prisma.bookingSession.update({ where: { id: bookingSessionId }, data: { status: 'COMPLETED' } });
  const allSlots = await prisma.bookingSession.findMany({
    where: { bookingId: session.bookingSession.bookingId },
    select: { status: true },
  });
  if (allSlots.every((s) => s.status === 'COMPLETED')) {
    await prisma.booking.update({ where: { id: session.bookingSession.bookingId }, data: { status: 'COMPLETED' } });
  }
  return updated;
}

async function getSessionHistory(bookingSessionId, userId) {
  const session = await prisma.session.findUnique({
    where: { bookingSessionId },
    include: {
      bookingSession: {
        include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
      },
    },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const booking = session.bookingSession?.booking;
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== userId && booking.teacher.userId !== userId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
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
