const { prisma } = require('../lib/prisma');

/**
 * Endpoint 1: getCourseWithSheikhs
 * جلب تفاصيل الدورة مع قائمة المشايخ وعدد الدروس لكل شيخ في الدورة
 */
async function getCourseWithSheikhs(courseId) {
  // جلب بيانات الدورة مع العلاقات المطلوبة
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: {
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
              avatar: true
            }
          }
        }
      },
      courseTeachers: {
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  firstNameAr: true,
                  lastName: true,
                  lastNameAr: true,
                  avatar: true
                }
              }
            }
          }
        }
      },
      _count: {
        select: {
          enrollments: true,
          lessons: true
        }
      }
    }
  });

  if (!course) {
    throw Object.assign(new Error('الدورة غير موجودة'), { statusCode: 404 });
  }

  // جمع جميع المشايخ (المعلم الرئيسي + المعلمين المساعدين)
  const sheikhs = [];
  const seenIds = new Set();

  // إضافة المعلم الرئيسي إذا وُجد
  if (course.teacher) {
    const lessonsCount = await getLessonsCountForTeacherInCourse(courseId, course.teacher.id);
    sheikhs.push(formatSheikhWithLessonsCount(course.teacher, lessonsCount));
    seenIds.add(course.teacher.id);
  }

  // إضافة المعلمين المساعدين
  for (const ct of course.courseTeachers) {
    if (!seenIds.has(ct.teacher.id)) {
      const lessonsCount = await getLessonsCountForTeacherInCourse(courseId, ct.teacher.id);
      sheikhs.push(formatSheikhWithLessonsCount(ct.teacher, lessonsCount));
      seenIds.add(ct.teacher.id);
    }
  }

  // تنسيق استجابة الدورة حسب التقرير
  return {
    id: course.id,
    name: course.titleAr || course.title,
    description: course.descriptionAr || course.description || '',
    image: course.image,
    price: `${course.price} جنيه`,
    duration: course.duration ? `${course.duration} أسابيع` : null,
    lessonsCount: course._count.lessons,
    studentsCount: course._count.enrollments,
    rating: course.rating,
    sheikhs
  };
}

/**
 * حساب عدد الدروس التي يدرّسها شيخ في دورة محددة
 * (الدروس التي تحتوي على فيديو واحد على الأقل بـ teacherId = الشيخ)
 */
async function getLessonsCountForTeacherInCourse(courseId, teacherId) {
  const count = await prisma.lesson.count({
    where: {
      courseId,
      videos: {
        some: {
          teacherId
        }
      }
    }
  });
  return count;
}

/**
 * تنسيق بيانات الشيخ مع عدد الدروس
 */
function formatSheikhWithLessonsCount(teacher, lessonsCount) {
  const user = teacher.user;
  const name = (user.firstNameAr && user.lastNameAr) 
    ? `${user.firstNameAr} ${user.lastNameAr}`.trim()
    : `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;

  return {
    id: teacher.id,
    name,
    image: teacher.image || user.avatar,
    title: teacher.specialtiesAr || teacher.specialties || 'معلم',
    rating: teacher.rating,
    lessonsCountInThisCourse: lessonsCount
  };
}

/**
 * Endpoint 2: getSheikhInCourseContext
 * جلب تفاصيل الشيخ في سياق الدورة
 */
async function getSheikhInCourseContext(courseId, sheikhId) {
  // التحقق من أن الشيخ يدرّس في هذه الدورة
  const courseTeacher = await prisma.courseTeacher.findFirst({
    where: {
      courseId,
      teacherId: sheikhId
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          _count: {
            select: {
              enrollments: true
            }
          }
        }
      },
      teacher: {
        include: {
          user: {
            select: {
              firstName: true,
              firstNameAr: true,
              lastName: true,
              lastNameAr: true,
              avatar: true
            }
          }
        }
      }
    }
  });

  // إذا لم يكن في courseTeachers، نتحقق إذا كان هو المعلم الرئيسي
  if (!courseTeacher) {
    const course = await prisma.course.findFirst({
      where: {
        id: courseId,
        teacherId: sheikhId
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                firstName: true,
                firstNameAr: true,
                lastName: true,
                lastNameAr: true,
                avatar: true
              }
            }
          }
        },
        _count: {
          select: {
            enrollments: true
          }
        }
      }
    });

    if (!course) {
      throw Object.assign(new Error('الشيخ غير موجود في هذه الدورة'), { statusCode: 404 });
    }

    // تنسيق البيانات للمعلم الرئيسي
    const teacher = course.teacher;
    const user = teacher.user;
    const name = (user.firstNameAr && user.lastNameAr) 
      ? `${user.firstNameAr} ${user.lastNameAr}`.trim()
      : `${user.firstName || ''} ${user.lastName || ''}`.trim();

    const lessonsCount = await getLessonsCountForTeacherInCourse(courseId, sheikhId);

    // جلب التعليقات
    const reviews = await getTeacherReviews(sheikhId, 10);

    return {
      id: teacher.id,
      name,
      title: teacher.specialtiesAr || teacher.specialties || 'معلم',
      image: teacher.image || user.avatar,
      bio: teacher.bioAr || teacher.bio || '',
      rating: teacher.rating,
      experienceYears: teacher.experience || 0,
      specialization: teacher.specialtiesAr || teacher.specialties || '',
      videoUrl: teacher.introVideoUrl,
      courseContext: {
        courseId: course.id,
        courseName: course.titleAr || course.title,
        lessonsCount,
        studentsEnrolled: course._count.enrollments,
        completionRate: 78 // يمكن حسابه لاحقاً من VideoProgress
      },
      achievements: [], // مصفوفة فارغة حتى إضافة model Achievement
      reviews
    };
  }

  // تنسيق البيانات للمعلم المساعد
  const teacher = courseTeacher.teacher;
  const user = teacher.user;
  const name = (user.firstNameAr && user.lastNameAr) 
    ? `${user.firstNameAr} ${user.lastNameAr}`.trim()
    : `${user.firstName || ''} ${user.lastName || ''}`.trim();

  const lessonsCount = await getLessonsCountForTeacherInCourse(courseId, sheikhId);

  // جلب التعليقات
  const reviews = await getTeacherReviews(sheikhId, 10);

  return {
    id: teacher.id,
    name,
    title: teacher.specialtiesAr || teacher.specialties || 'معلم',
    image: teacher.image || user.avatar,
    bio: teacher.bioAr || teacher.bio || '',
    rating: teacher.rating,
    experienceYears: teacher.experience || 0,
    specialization: teacher.specialtiesAr || teacher.specialties || '',
    videoUrl: teacher.introVideoUrl,
    courseContext: {
      courseId: courseTeacher.course.id,
      courseName: courseTeacher.course.titleAr || courseTeacher.course.title,
      lessonsCount,
      studentsEnrolled: courseTeacher.course._count.enrollments,
      completionRate: 78 // يمكن حسابه لاحقاً من VideoProgress
    },
    achievements: [], // مصفوفة فارغة حتى إضافة model Achievement
    reviews
  };
}

/**
 * جلب تعليقات الشيخ
 */
async function getTeacherReviews(teacherId, limit = 10) {
  const reviews = await prisma.review.findMany({
    where: { teacherId },
    take: limit,
    orderBy: { createdAt: 'desc' },
    include: {
      student: {
        select: {
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true,
          avatar: true
        }
      }
    }
  });

  return reviews.map(review => ({
    id: review.id,
    user: (review.student.firstNameAr && review.student.lastNameAr)
      ? `${review.student.firstNameAr} ${review.student.lastNameAr}`.trim()
      : `${review.student.firstName || ''} ${review.student.lastName || ''}`.trim(),
    userImage: review.student.avatar,
    rating: review.rating,
    comment: review.comment || '',
    date: review.createdAt,
    helpful: 0 // يمكن إضافة نظام helpful لاحقاً
  }));
}

/**
 * Endpoint 3: getSheikhLessonsInCourse
 * جلب دروس الشيخ في الدورة مع pagination وفلتر
 */
async function getSheikhLessonsInCourse(courseId, sheikhId, options) {
  const { page, limit, isFree, userId } = options;
  const skip = (page - 1) * limit;

  // بناء شروط البحث
  const where = {
    courseId,
    videos: {
      some: {
        teacherId: sheikhId
      }
    }
  };

  // إضافة فلتر isFree إذا تم تمريره
  if (isFree !== undefined) {
    where.isFree = isFree;
  }

  // جلب الدروس مع pagination
  const [lessons, total] = await Promise.all([
    prisma.lesson.findMany({
      where,
      skip,
      take: limit,
      orderBy: { order: 'asc' },
      include: {
        videos: {
          where: { teacherId: sheikhId },
          orderBy: { order: 'asc' },
          take: 1 // أول فيديو فقط للـ thumbnail والـ videoUrl
        },
        course: {
          select: {
            id: true,
            title: true,
            titleAr: true
          }
        }
      }
    }),
    prisma.lesson.count({ where })
  ]);

  // جلب بيانات الشيخ
  const teacher = await prisma.teacher.findUnique({
    where: { id: sheikhId },
    include: {
      user: {
        select: {
          firstName: true,
          firstNameAr: true,
          lastName: true,
          lastNameAr: true
        }
      }
    }
  });

  const sheikhName = teacher 
    ? (teacher.user.firstNameAr && teacher.user.lastNameAr)
      ? `${teacher.user.firstNameAr} ${teacher.user.lastNameAr}`.trim()
      : `${teacher.user.firstName || ''} ${teacher.user.lastName || ''}`.trim()
    : '';

  // التحقق من enrollment المستخدم
  const isEnrolled = userId ? await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId: userId } }
  }) : null;

  // تنسيق الدروس
  const formattedLessons = lessons.map(lesson => {
    const firstVideo = lesson.videos[0];
    
    return {
      id: lesson.id,
      title: lesson.titleAr || lesson.title,
      description: lesson.descriptionAr || lesson.description || '',
      videoUrl: firstVideo?.videoUrl || '',
      duration: firstVideo 
        ? `${Math.floor(firstVideo.durationSeconds / 60)}:${String(firstVideo.durationSeconds % 60).padStart(2, '0')}` 
        : `${lesson.durationMinutes}:00`,
      thumbnail: firstVideo?.thumbnailUrl || '',
      price: '0 جنيه', // سعر الدرس - حالياً 0 لأنه part of course
      order: lesson.order,
      isPurchased: !!isEnrolled, // إذا كان enrolled في الدورة يعتبر purchased
      isFree: lesson.isFree,
      viewsCount: 0, // يمكن إضافة view tracking لاحقاً
      rating: 0, // يمكن إضافة rating للدرس لاحقاً
      createdAt: lesson.createdAt,
      sheikhId: sheikhId,
      sheikhName,
      courseId: lesson.course.id,
      courseName: lesson.course.titleAr || lesson.course.title
    };
  });

  // حساب الملخص
  const [freeCount, paidCount] = await Promise.all([
    prisma.lesson.count({ where: { ...where, isFree: true } }),
    prisma.lesson.count({ where: { ...where, isFree: false } })
  ]);

  // حساب المدة الإجمالية
  const allLessonsForDuration = await prisma.lesson.findMany({
    where,
    include: {
      videos: {
        where: { teacherId: sheikhId }
      }
    }
  });

  let totalSeconds = 0;
  allLessonsForDuration.forEach(lesson => {
    lesson.videos.forEach(video => {
      totalSeconds += video.durationSeconds || 0;
    });
  });

  const totalHours = Math.floor(totalSeconds / 3600);
  const totalMinutes = Math.floor((totalSeconds % 3600) / 60);
  const totalDuration = `${totalHours} ساعة و ${totalMinutes} دقيقة`;

  return {
    lessons: formattedLessons,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalLessons: total,
      limit,
      hasNextPage: page * limit < total,
      hasPrevPage: page > 1
    },
    summary: {
      totalLessons: total,
      freeLessons: freeCount,
      paidLessons: paidCount,
      purchasedLessons: isEnrolled ? total : 0,
      totalDuration
    }
  };
}

module.exports = {
  getCourseWithSheikhs,
  getSheikhInCourseContext,
  getSheikhLessonsInCourse
};