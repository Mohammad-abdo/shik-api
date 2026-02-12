const { prisma } = require('../lib/prisma');

async function findAll(page = 1, limit = 20, status, teacherId, isFeatured) {
  const skip = (page - 1) * limit;
  const where = {};
  if (status) where.status = status;
  if (teacherId) where.teacherId = teacherId;
  if (isFeatured !== undefined) where.isFeatured = isFeatured;
  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true } } } },
        _count: { select: { enrollments: true, lessons: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.course.count({ where }),
  ]);
  return { courses, pagination: { current_page: page, per_page: limit, total_courses: total, total_pages: Math.ceil(total / limit) } };
}

async function findOne(id) {
  const course = await prisma.course.findUnique({
    where: { id },
    include: {
      teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true } } } },
      courseTeachers: { include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } } } },
      _count: { select: { enrollments: true, lessons: true } },
      lessons: { orderBy: { order: 'asc' }, include: { videos: { orderBy: { order: 'asc' } } } },
    },
  });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  return course;
}

function formatSheikh(teacher) {
  if (!teacher || !teacher.user) return null;
  const u = teacher.user;
  const name = (u.firstNameAr && u.lastNameAr) ? `${u.firstNameAr} ${u.lastNameAr}`.trim() : `${u.firstName || ''} ${u.lastName || ''}`.trim();
  return {
    id: teacher.id,
    name: name || u.email,
    profile_image: teacher.image || u.avatar || null,
    bio: teacher.bioAr || teacher.bio || null,
    rating: teacher.rating ?? 0,
    specialization: teacher.specialtiesAr || teacher.specialties || null,
    email: u.email,
    introVideoUrl: teacher.introVideoUrl || null,
    teacherType: teacher.teacherType || 'FULL_TEACHER',
  };
}

async function findCourseSheikhs(courseId, page = 1, limit = 10) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true } } } },
      courseTeachers: { include: { teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true } } } } } },
    },
  });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });

  const seen = new Set();
  const list = [];

  if (course.teacher) {
    const main = formatSheikh(course.teacher);
    if (main) {
      seen.add(course.teacher.id);
      list.push(main);
    }
  }

  if (course.courseTeachers && course.courseTeachers.length > 0) {
    for (const ct of course.courseTeachers) {
      if (ct.teacher && !seen.has(ct.teacher.id)) {
        const formatted = formatSheikh(ct.teacher);
        if (formatted) {
          seen.add(ct.teacher.id);
          list.push(formatted);
        }
      }
    }
  }

  const total = list.length;
  const skip = (page - 1) * limit;
  const teachers = list.slice(skip, skip + limit);

  return {
    teachers,
    total,
    pagination: {
      page: Number(page),
      limit: Number(limit),
      total_pages: limit > 0 ? Math.ceil(total / limit) : 0,
    },
  };
}

async function getCourseLessonsForPlayback(courseId, options = {}) {
  const { userId = null, sheikh_id, page = 1, limit = 20 } = options;
  const skip = (page - 1) * limit;
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { lessons: { orderBy: { order: 'asc' }, include: { videos: { orderBy: { order: 'asc' } } } } },
  });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  let lessons = course.lessons;
  if (sheikh_id) {
    const courseTeacherIds = (await prisma.courseTeacher.findMany({ where: { courseId }, select: { teacherId: true } })).map((x) => x.teacherId);
    const allowed = new Set([...(course.teacherId ? [course.teacherId] : []), ...courseTeacherIds]);
    if (!allowed.has(sheikh_id)) lessons = [];
  }
  const totalItems = lessons.length;
  const paginated = lessons.slice(skip, skip + limit);
  let isEnrolled = false;
  let completedVideoIds = new Set();
  if (userId) {
    const enrollment = await prisma.courseEnrollment.findUnique({ where: { courseId_studentId: { courseId, studentId: userId } } });
    isEnrolled = !!enrollment;
    const progress = await prisma.videoProgress.findMany({ where: { userId, courseId, status: 'COMPLETED' }, select: { videoId: true } });
    completedVideoIds = new Set(progress.map((p) => p.videoId));
  }
  const lessonsFormatted = paginated.map((lesson) => {
    const firstVideo = lesson.videos[0];
    const durationFormatted = firstVideo ? `${Math.floor(firstVideo.durationSeconds / 60)}:${String(firstVideo.durationSeconds % 60).padStart(2, '0')}` : `${lesson.durationMinutes}:00`;
    const lessonCompleted = lesson.videos.length > 0 && lesson.videos.every((v) => completedVideoIds.has(v.id));
    const isLocked = !lesson.isFree && !isEnrolled;
    return {
      id: lesson.id,
      title: lesson.titleAr || lesson.title,
      description: lesson.descriptionAr || lesson.description || null,
      thumbnail_url: firstVideo?.thumbnailUrl || null,
      duration: durationFormatted,
      lesson_number: lesson.order,
      is_locked: isLocked,
      is_completed: lessonCompleted,
      video_id: firstVideo?.id || null,
      type: 'video',
    };
  });
  return { lessons: lessonsFormatted, pagination: { current_page: page, total_pages: Math.ceil(totalItems / limit) || 1, total_items: totalItems } };
}

async function create(dto, adminId) {
  if (dto.teacherId) {
    const t = await prisma.teacher.findUnique({ where: { id: dto.teacherId } });
    if (!t) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  }
  const data = {
    title: dto.title,
    titleAr: dto.titleAr,
    description: dto.description,
    descriptionAr: dto.descriptionAr,
    teacherId: dto.teacherId,
    price: dto.price ?? 0,
    duration: dto.duration,
    image: dto.image,
    introVideoUrl: dto.introVideoUrl,
    introVideoThumbnail: dto.introVideoThumbnail,
    status: dto.status || 'DRAFT',
    createdBy: adminId,
  };
  if (dto.teacherIds && dto.teacherIds.length > 0) {
    data.courseTeachers = { create: dto.teacherIds.map((teacherId) => ({ teacherId })) };
  }
  const course = await prisma.course.create({
    data,
    include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }, courseTeachers: { include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } } } }, _count: { select: { enrollments: true } } },
  });

  // Create lessons and videos if provided (each lesson can have multiple videos with duration and teacherId)
  if (dto.lessons && Array.isArray(dto.lessons) && dto.lessons.length > 0) {
    let totalVideosCount = 0;
    for (let i = 0; i < dto.lessons.length; i++) {
      const lessonDto = dto.lessons[i];
      const lesson = await prisma.lesson.create({
        data: {
          courseId: course.id,
          title: lessonDto.title || `Lesson ${i + 1}`,
          titleAr: lessonDto.titleAr,
          order: lessonDto.order ?? i,
          durationMinutes: lessonDto.durationMinutes ?? 0,
          isFree: lessonDto.isFree ?? false,
        },
      });
      if (lessonDto.videos && lessonDto.videos.length > 0) {
        for (let j = 0; j < lessonDto.videos.length; j++) {
          const v = lessonDto.videos[j];
          await prisma.video.create({
            data: {
              lessonId: lesson.id,
              title: v.title || `Video ${j + 1}`,
              titleAr: v.titleAr,
              videoUrl: v.videoUrl,
              thumbnailUrl: v.thumbnailUrl,
              durationSeconds: v.durationSeconds ?? 0,
              order: v.order ?? j,
              teacherId: v.teacherId || undefined,
            },
          });
          totalVideosCount += 1;
        }
      }
    }
    await prisma.course.update({
      where: { id: course.id },
      data: { totalLessons: dto.lessons.length, totalVideos: totalVideosCount },
    });
  }

  return course;
}

async function createTeacherCourse(dto, userId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw Object.assign(new Error('Teacher profile not found'), { statusCode: 404 });
  return prisma.course.create({
    data: {
      title: dto.title,
      titleAr: dto.titleAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      teacherId: teacher.id,
      price: dto.price ?? 0,
      duration: dto.duration,
      image: dto.image,
      introVideoUrl: dto.introVideoUrl,
      introVideoThumbnail: dto.introVideoThumbnail,
      status: dto.status || 'DRAFT',
      createdBy: userId,
    },
    include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }, _count: { select: { enrollments: true } } },
  });
}

async function update(id, dto) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  if (dto.teacherIds !== undefined) {
    await prisma.courseTeacher.deleteMany({ where: { courseId: id } });
    if (dto.teacherIds.length > 0) {
      await prisma.courseTeacher.createMany({ data: dto.teacherIds.map((teacherId) => ({ courseId: id, teacherId })) });
    }
  }
  const updateData = {};
  if (dto.title) updateData.title = dto.title;
  if (dto.titleAr !== undefined) updateData.titleAr = dto.titleAr;
  if (dto.description !== undefined) updateData.description = dto.description;
  if (dto.descriptionAr !== undefined) updateData.descriptionAr = dto.descriptionAr;
  if (dto.teacherId !== undefined) updateData.teacherId = dto.teacherId || null;
  if (dto.price !== undefined) updateData.price = dto.price;
  if (dto.duration !== undefined) updateData.duration = dto.duration;
  if (dto.image !== undefined) updateData.image = dto.image;
  if (dto.introVideoUrl !== undefined) updateData.introVideoUrl = dto.introVideoUrl;
  if (dto.introVideoThumbnail !== undefined) updateData.introVideoThumbnail = dto.introVideoThumbnail;
  if (dto.status) updateData.status = dto.status;

  // حفظ الدروس وفيديوهات الدورة عند التعديل (نفس منطق الإنشاء)
  if (dto.lessons !== undefined && Array.isArray(dto.lessons)) {
    await prisma.lesson.deleteMany({ where: { courseId: id } });
    let totalVideosCount = 0;
    if (dto.lessons.length > 0) {
      for (let i = 0; i < dto.lessons.length; i++) {
        const lessonDto = dto.lessons[i];
        const lesson = await prisma.lesson.create({
          data: {
            courseId: id,
            title: lessonDto.title || `Lesson ${i + 1}`,
            titleAr: lessonDto.titleAr,
            order: lessonDto.order ?? i,
            durationMinutes: lessonDto.durationMinutes ?? 0,
            isFree: lessonDto.isFree ?? false,
          },
        });
        if (lessonDto.videos && lessonDto.videos.length > 0) {
          for (let j = 0; j < lessonDto.videos.length; j++) {
            const v = lessonDto.videos[j];
            await prisma.video.create({
              data: {
                lessonId: lesson.id,
                title: v.title || `Video ${j + 1}`,
                titleAr: v.titleAr,
                videoUrl: v.videoUrl,
                thumbnailUrl: v.thumbnailUrl,
                durationSeconds: v.durationSeconds ?? 0,
                order: v.order ?? j,
                teacherId: v.teacherId || undefined,
              },
            });
            totalVideosCount += 1;
          }
        }
      }
    }
    updateData.totalLessons = dto.lessons.length;
    updateData.totalVideos = totalVideosCount;
  }

  return prisma.course.update({ where: { id }, data: updateData, include: { teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } }, _count: { select: { enrollments: true } } } });
}

async function deleteCourse(id) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  await prisma.course.delete({ where: { id } });
  return { message: 'Course deleted successfully' };
}

async function enrollStudent(courseId, studentId) {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  if (course.status !== 'PUBLISHED') throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });
  const existing = await prisma.courseEnrollment.findUnique({ where: { courseId_studentId: { courseId, studentId } } });
  if (existing) throw Object.assign(new Error('Student is already enrolled in this course'), { statusCode: 400 });
  return prisma.courseEnrollment.create({
    data: { courseId, studentId, status: 'ACTIVE', progress: 0 },
    include: { course: true, student: { select: { id: true, firstName: true, lastName: true, email: true } } },
  });
}

async function toggleFeatured(id, isFeatured) {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  return prisma.course.update({ where: { id }, data: { isFeatured: !!isFeatured } });
}

module.exports = { findAll, findOne, findCourseSheikhs, getCourseLessonsForPlayback, create, createTeacherCourse, update, deleteCourse, enrollStudent, toggleFeatured };
