const { prisma } = require('../lib/prisma');

function courseName(course, lang) {
  return lang === 'ar' ? (course.titleAr || course.title) : course.title;
}

async function getMyCourses(studentId, lang = 'en') {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, status: 'ACTIVE' },
    include: {
      course: {
        include: {
          courseTeachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true, firstName: true, lastName: true,
                      firstNameAr: true, lastNameAr: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
          teacher: {
            include: {
              user: {
                select: {
                  id: true, firstName: true, lastName: true,
                  firstNameAr: true, lastNameAr: true,
                  avatar: true,
                },
              },
            },
          },
          lessons: {
            orderBy: { order: 'asc' },
            include: {
              videos: { orderBy: { order: 'asc' } },
            },
          },
          _count: { select: { enrollments: true, lessons: true } },
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const courseIds = enrollments.map(e => e.courseId);
  const videoProgressList = courseIds.length > 0
    ? await prisma.videoProgress.findMany({
        where: { userId: studentId, courseId: { in: courseIds } },
      })
    : [];
  const progressByCourse = {};
  for (const vp of videoProgressList) {
    if (!progressByCourse[vp.courseId]) progressByCourse[vp.courseId] = [];
    progressByCourse[vp.courseId].push(vp);
  }

  const list = enrollments.map((e) => {
    const c = e.course;
    const name = courseName(c, lang);
    const description = lang === 'ar' ? (c.descriptionAr || c.description) : (c.description || c.descriptionAr);
    const fullDescription = lang === 'ar' ? (c.fullDescriptionAr || c.fullDescription) : (c.fullDescription || c.fullDescriptionAr);
    const duration = c.duration ? (lang === 'ar' ? `${c.duration} أشهر` : `${c.duration} months`) : null;
    const progressValue = Number(e.progress) || 0;
    const progressPercentage = Math.round(progressValue * 100);

    const sheikhs = [];
    const seenIds = new Set();
    if (c.teacher) {
      const t = c.teacher;
      const u = t.user;
      const sName = lang === 'ar'
        ? [u?.firstNameAr, u?.lastNameAr].filter(Boolean).join(' ').trim() || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
        : [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
      sheikhs.push({
        id: t.id,
        name: sName || '—',
        image: t.image || u?.avatar || null,
        bio: lang === 'ar' ? (t.bioAr || t.bio || '') : (t.bio || t.bioAr || ''),
        specialization: lang === 'ar' ? (t.specialtiesAr || t.specialties || '—') : (t.specialties || t.specialtiesAr || '—'),
        rating: t.rating ?? 0,
        experience: t.experience ?? 0,
      });
      seenIds.add(t.id);
    }
    for (const ct of (c.courseTeachers || [])) {
      const t = ct.teacher;
      if (seenIds.has(t.id)) continue;
      const u = t?.user;
      const sName = lang === 'ar'
        ? [u?.firstNameAr, u?.lastNameAr].filter(Boolean).join(' ').trim() || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
        : [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
      sheikhs.push({
        id: t.id,
        name: sName || '—',
        image: t.image || u?.avatar || null,
        bio: lang === 'ar' ? (t.bioAr || t.bio || '') : (t.bio || t.bioAr || ''),
        specialization: lang === 'ar' ? (t.specialtiesAr || t.specialties || '—') : (t.specialties || t.specialtiesAr || '—'),
        rating: t.rating ?? 0,
        experience: t.experience ?? 0,
      });
      seenIds.add(t.id);
    }

    const courseProgress = progressByCourse[c.id] || [];
    const completedVideos = courseProgress.filter(vp => vp.status === 'COMPLETED').length;
    const totalVideos = (c.lessons || []).reduce((sum, l) => sum + (l.videos?.length || 0), 0);

    const lessons = (c.lessons || []).map((lesson) => {
      const lessonVideos = lesson.videos || [];
      const lessonVideoProgress = courseProgress.filter(vp => vp.lessonId === lesson.id);
      const lessonCompleted = lessonVideoProgress.length > 0 && lessonVideoProgress.every(vp => vp.status === 'COMPLETED');

      return {
        id: lesson.id,
        title: lang === 'ar' ? (lesson.titleAr || lesson.title) : lesson.title,
        description: lang === 'ar' ? (lesson.descriptionAr || lesson.description || '') : (lesson.description || lesson.descriptionAr || ''),
        order: lesson.order,
        duration_minutes: lesson.durationMinutes,
        is_free: lesson.isFree,
        is_completed: lessonCompleted,
        videos_count: lessonVideos.length,
        videos: lessonVideos.map(v => ({
          id: v.id,
          title: lang === 'ar' ? (v.titleAr || v.title) : v.title,
          video_url: v.videoUrl,
          thumbnail_url: v.thumbnailUrl || null,
          duration_seconds: v.durationSeconds,
          order: v.order,
          is_completed: courseProgress.some(vp => vp.videoId === v.id && vp.status === 'COMPLETED'),
          watch_progress: courseProgress.find(vp => vp.videoId === v.id)?.watchProgress ?? 0,
        })),
      };
    });

    return {
      id: c.id,
      name,
      name_ar: c.titleAr || null,
      description: description || '',
      full_description: fullDescription || '',
      image: c.image || null,
      intro_video_url: c.introVideoUrl || null,
      intro_video_thumbnail: c.introVideoThumbnail || null,
      price: c.price ?? 0,
      duration,
      category: c.category || null,
      level: c.level || null,
      status: c.status,
      is_featured: c.isFeatured ?? false,
      rating: c.rating ?? 0,
      total_reviews: c.totalReviews ?? 0,
      total_lessons: c._count?.lessons ?? c.totalLessons ?? 0,
      total_videos: totalVideos,
      students_count: c._count?.enrollments ?? 0,
      progress_percentage: progressPercentage,
      progress_value: progressValue,
      completed_videos: completedVideos,
      enrollment_date: e.enrolledAt.toISOString().split('T')[0],
      completed_at: e.completedAt ? e.completedAt.toISOString().split('T')[0] : null,
      sheikhs,
      lessons,
    };
  });

  return list;
}

async function getCourseDetails(courseId, studentId, lang = 'en') {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId, studentId },
    include: {
      course: {
        include: {
          courseTeachers: {
            include: {
              teacher: {
                include: {
                  user: {
                    select: {
                      id: true,
                      firstName: true,
                      lastName: true,
                      firstNameAr: true,
                      lastNameAr: true,
                      avatar: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!enrollment) throw Object.assign(new Error('Course not found or not enrolled'), { statusCode: 404 });

  const c = enrollment.course;
  const name = courseName(c, lang);
  const description = lang === 'ar' ? (c.descriptionAr || c.description) : (c.description || c.descriptionAr);
  const duration = c.duration ? (lang === 'ar' ? `${c.duration} أشهر` : `${c.duration} months`) : null;
  const progressValue = Number(enrollment.progress) || 0;
  const progressPercentage = Math.round(progressValue * 100);

  const subscribed_sheikhs = (c.courseTeachers || []).map((ct) => {
    const t = ct.teacher;
    const u = t?.user;
    const sheikhName = lang === 'ar'
      ? [u?.firstNameAr, u?.lastNameAr].filter(Boolean).join(' ').trim() || [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim()
      : [u?.firstName, u?.lastName].filter(Boolean).join(' ').trim();
    const specialization = lang === 'ar' ? (t?.specialtiesAr || t?.specialties) : (t?.specialties || t?.specialtiesAr);
    return {
      id: t.id,
      name: sheikhName || '—',
      image: t.image || u?.avatar || null,
      specialization: specialization || '—',
      rating: t.rating ?? 0,
      country: lang === 'ar' ? 'مصر' : 'Egypt',
    };
  });

  return {
    id: c.id,
    name,
    image: c.image || null,
    description: description || '',
    duration,
    rating: c.rating ?? 0,
    progress_percentage: progressPercentage,
    progress_value: progressValue,
    enrollment_date: enrollment.enrolledAt.toISOString().split('T')[0],
    subscribed_sheikhs,
  };
}

module.exports = { getMyCourses, getCourseDetails };
