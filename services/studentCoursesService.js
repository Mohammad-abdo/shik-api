const { prisma } = require('../lib/prisma');

function courseName(course, lang) {
  return lang === 'ar' ? (course.titleAr || course.title) : course.title;
}

async function getMyCourses(studentId, lang = 'en') {
  const enrollments = await prisma.courseEnrollment.findMany({
    where: { studentId, status: 'ACTIVE' },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          image: true,
          introVideoUrl: true,
          rating: true,
          totalLessons: true,
        },
      },
    },
    orderBy: { enrolledAt: 'desc' },
  });

  const list = enrollments.map((e) => {
    const name = courseName(e.course, lang);
    const progressValue = Number(e.progress) || 0;
    const progressPercentage = Math.round(progressValue * 100);
    return {
      id: e.course.id,
      name,
      image: e.course.image || null,
      video_url: e.course.introVideoUrl || null,
      progress_percentage: progressPercentage,
      progress_value: progressValue,
      enrollment_date: e.enrolledAt.toISOString().split('T')[0],
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
