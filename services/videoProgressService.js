const { prisma } = require('../lib/prisma');
const { updateEnrollmentProgress } = require('./enrollmentService');

/**
 * Video Progress Service
 */

/**
 * Start watching a lesson/video
 * @param {string} lessonId 
 * @param {string} userId 
 * @param {string} videoId - Optional: specific video in lesson
 * @returns {Object} video progress data
 */
async function startLesson(lessonId, userId, videoId = null) {
  // Get lesson details
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { studentId: userId },
            take: 1
          }
        }
      },
      videos: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  if (!lesson) {
    throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
  }
  
  // Check if student is enrolled in the course
  if (lesson.course.enrollments.length === 0) {
    throw Object.assign(new Error('Student is not enrolled in this course'), { statusCode: 403 });
  }
  
  // Get the video to track (first video if not specified)
  let targetVideo;
  if (videoId) {
    targetVideo = lesson.videos.find(v => v.id === videoId);
    if (!targetVideo) {
      throw Object.assign(new Error('Video not found in this lesson'), { statusCode: 404 });
    }
  } else {
    targetVideo = lesson.videos[0];
  }
  
  if (!targetVideo) {
    throw Object.assign(new Error('No videos found in this lesson'), { statusCode: 404 });
  }
  
  // Check existing progress
  let videoProgress = await prisma.videoProgress.findUnique({
    where: {
      userId_videoId: {
        userId,
        videoId: targetVideo.id
      }
    }
  });
  
  if (videoProgress) {
    // Update existing progress
    videoProgress = await prisma.videoProgress.update({
      where: {
        userId_videoId: {
          userId,
          videoId: targetVideo.id
        }
      },
      data: {
        status: 'WATCHING',
        startedAt: new Date(),
        updatedAt: new Date()
      },
      include: {
        video: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                titleAr: true,
                courseId: true
              }
            }
          }
        }
      }
    });
  } else {
    // Create new progress record
    videoProgress = await prisma.videoProgress.create({
      data: {
        userId,
        videoId: targetVideo.id,
        lessonId: lesson.id,
        courseId: lesson.courseId,
        status: 'WATCHING',
        watchProgress: 0,
        watchDurationSeconds: 0,
        startedAt: new Date()
      },
      include: {
        video: {
          include: {
            lesson: {
              select: {
                id: true,
                title: true,
                titleAr: true,
                courseId: true
              }
            }
          }
        }
      }
    });
  }
  
  return {
    id: videoProgress.id,
    userId: videoProgress.userId,
    videoId: videoProgress.videoId,
    lessonId: videoProgress.lessonId,
    courseId: videoProgress.courseId,
    status: videoProgress.status,
    watchProgress: videoProgress.watchProgress,
    watchDurationSeconds: videoProgress.watchDurationSeconds,
    startedAt: videoProgress.startedAt,
    completedAt: videoProgress.completedAt,
    lesson: videoProgress.video.lesson,
    video: {
      id: targetVideo.id,
      title: targetVideo.title,
      titleAr: targetVideo.titleAr,
      videoUrl: targetVideo.videoUrl,
      thumbnailUrl: targetVideo.thumbnailUrl,
      durationSeconds: targetVideo.durationSeconds
    }
  };
}

/**
 * Complete a lesson/video
 * @param {string} lessonId 
 * @param {string} userId 
 * @param {string} videoId - Optional: specific video in lesson
 * @param {number} watchDurationSeconds - Total time watched
 * @returns {Object} updated progress and course progress
 */
async function completeLesson(lessonId, userId, videoId = null, watchDurationSeconds = 0) {
  // Get lesson details
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: {
      course: {
        include: {
          enrollments: {
            where: { studentId: userId },
            take: 1
          },
          _count: {
            select: { lessons: true }
          }
        }
      },
      videos: {
        orderBy: { order: 'asc' }
      }
    }
  });
  
  if (!lesson) {
    throw Object.assign(new Error('Lesson not found'), { statusCode: 404 });
  }
  
  // Check if student is enrolled
  if (lesson.course.enrollments.length === 0) {
    throw Object.assign(new Error('Student is not enrolled in this course'), { statusCode: 403 });
  }
  
  // Get the video to complete
  let targetVideo;
  if (videoId) {
    targetVideo = lesson.videos.find(v => v.id === videoId);
    if (!targetVideo) {
      throw Object.assign(new Error('Video not found in this lesson'), { statusCode: 404 });
    }
  } else {
    targetVideo = lesson.videos[0];
  }
  
  if (!targetVideo) {
    throw Object.assign(new Error('No videos found in this lesson'), { statusCode: 404 });
  }
  
  // Update video progress to completed
  const videoProgress = await prisma.videoProgress.upsert({
    where: {
      userId_videoId: {
        userId,
        videoId: targetVideo.id
      }
    },
    create: {
      userId,
      videoId: targetVideo.id,
      lessonId: lesson.id,
      courseId: lesson.courseId,
      status: 'COMPLETED',
      watchProgress: 100,
      watchDurationSeconds: watchDurationSeconds,
      startedAt: new Date(),
      completedAt: new Date()
    },
    update: {
      status: 'COMPLETED',
      watchProgress: 100,
      watchDurationSeconds: watchDurationSeconds,
      completedAt: new Date(),
      updatedAt: new Date()
    }
  });
  
  // Calculate course progress
  const totalLessons = lesson.course._count.lessons;
  const completedLessonsCount = await prisma.videoProgress.count({
    where: {
      userId,
      courseId: lesson.courseId,
      status: 'COMPLETED'
    },
    distinct: ['lessonId']
  });
  
  const courseProgress = Math.round((completedLessonsCount / totalLessons) * 100);
  
  // Update course enrollment progress
  const updatedEnrollment = await updateEnrollmentProgress(
    lesson.courseId,
    userId,
    courseProgress
  );
  
  return {
    videoProgress: {
      id: videoProgress.id,
      status: videoProgress.status,
      watchProgress: videoProgress.watchProgress,
      watchDurationSeconds: videoProgress.watchDurationSeconds,
      completedAt: videoProgress.completedAt
    },
    courseProgress: {
      courseId: lesson.courseId,
      progress: updatedEnrollment.progress,
      status: updatedEnrollment.status,
      completedLessons: completedLessonsCount,
      totalLessons: totalLessons
    },
    lesson: {
      id: lesson.id,
      title: lesson.title,
      titleAr: lesson.titleAr,
      courseId: lesson.courseId
    },
    video: {
      id: targetVideo.id,
      title: targetVideo.title,
      titleAr: targetVideo.titleAr
    }
  };
}

/**
 * Get user's video progress for a course
 * @param {string} courseId 
 * @param {string} userId 
 * @returns {Object} progress data
 */
async function getCourseProgress(courseId, userId) {
  // Check enrollment
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: userId
      }
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          _count: {
            select: { lessons: true }
          }
        }
      }
    }
  });
  
  if (!enrollment) {
    throw Object.assign(new Error('Student is not enrolled in this course'), { statusCode: 404 });
  }
  
  // Get all video progress for this course
  const videoProgress = await prisma.videoProgress.findMany({
    where: {
      userId,
      courseId
    },
    include: {
      video: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          lessonId: true
        }
      },
      lesson: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          order: true
        }
      }
    },
    orderBy: [
      { lesson: { order: 'asc' } },
      { video: { order: 'asc' } }
    ]
  });
  
  const completedLessons = new Set();
  const totalWatchTime = videoProgress.reduce((sum, vp) => {
    if (vp.status === 'COMPLETED') {
      completedLessons.add(vp.lessonId);
    }
    return sum + vp.watchDurationSeconds;
  }, 0);
  
  return {
    enrollment: {
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      progress: enrollment.progress,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt
    },
    course: enrollment.course,
    progressStats: {
      completedLessons: completedLessons.size,
      totalLessons: enrollment.course._count.lessons,
      completedVideos: videoProgress.filter(vp => vp.status === 'COMPLETED').length,
      totalVideos: videoProgress.length,
      totalWatchTimeSeconds: totalWatchTime,
      progressPercentage: enrollment.progress
    },
    videoProgress: videoProgress.map(vp => ({
      id: vp.id,
      videoId: vp.videoId,
      lessonId: vp.lessonId,
      status: vp.status,
      watchProgress: vp.watchProgress,
      watchDurationSeconds: vp.watchDurationSeconds,
      startedAt: vp.startedAt,
      completedAt: vp.completedAt,
      video: vp.video,
      lesson: vp.lesson
    }))
  };
}

module.exports = {
  startLesson,
  completeLesson,
  getCourseProgress
};