const { prisma } = require('../lib/prisma');

async function getLessonPlayAccess(lessonId, userId) {
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { course: true, videos: { orderBy: { order: 'asc' } } },
  });
  if (!lesson) throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
  const firstVideo = lesson.videos[0];
  if (!firstVideo) throw Object.assign(new Error('No video found for this lesson'), { statusCode: 404 });
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId: lesson.courseId, studentId: userId } },
  });
  const hasAccess = lesson.isFree || !!enrollment;
  if (!hasAccess) throw Object.assign(new Error('You do not have access to this lesson'), { statusCode: 403, error_code: 'LESSON_LOCKED' });
  const videoUrl = firstVideo.videoUrl;
  const format = videoUrl && videoUrl.includes('.m3u8') ? 'hls' : 'mp4';
  return { success: true, message: 'Access granted', data: { video_url: videoUrl, format, drm_token: null } };
}

module.exports = { getLessonPlayAccess };
