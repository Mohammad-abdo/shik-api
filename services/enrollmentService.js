const { prisma } = require('../lib/prisma');

/**
 * Course Enrollment Service
 */

/**
 * Enroll student in a course with specific teacher/sheikh
 * @param {string} courseId 
 * @param {string} studentId 
 * @param {string} sheikId - Optional: specific sheikh/teacher for the course
 * @returns {Object} enrollment data
 */
async function enrollInCourse(courseId, studentId, sheikId = null) {
  // Verify course exists
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: true,
      courseTeachers: {
        include: { teacher: true }
      }
    }
  });
  
  if (!course) {
    throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  }
  
  // Check if course is available for enrollment
  if (course.status !== 'PUBLISHED') {
    throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });
  }
  
  // Verify sheikh is associated with the course (if provided)
  if (sheikId) {
    const validSheikh = course.teacherId === sheikId || 
                       course.courseTeachers.some(ct => ct.teacherId === sheikId);
    
    if (!validSheikh) {
      throw Object.assign(new Error('Sheikh is not associated with this course'), { statusCode: 400 });
    }
  }
  
  // Check if student is already enrolled
  const existingEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId
      }
    }
  });
  
  if (existingEnrollment) {
    throw Object.assign(new Error('Student is already enrolled in this course'), { statusCode: 400 });
  }
  
  // Create enrollment
  const enrollment = await prisma.courseEnrollment.create({
    data: {
      courseId,
      studentId,
      status: 'ACTIVE',
      progress: 0
    },
    include: {
      course: {
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
                  email: true,
                  avatar: true
                }
              }
            }
          }
        }
      },
      student: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          firstNameAr: true,
          lastNameAr: true,
          email: true,
          avatar: true
        }
      }
    }
  });
  
  return {
    id: enrollment.id,
    courseId: enrollment.courseId,
    studentId: enrollment.studentId,
    status: enrollment.status,
    enrolledAt: enrollment.enrolledAt,
    progress: enrollment.progress,
    course: {
      id: course.id,
      title: course.title,
      titleAr: course.titleAr,
      description: course.description,
      descriptionAr: course.descriptionAr,
      price: course.price,
      image: course.image,
      teacher: enrollment.course.teacher
    },
    student: enrollment.student
  };
}

/**
 * Get student's course enrollments
 * @param {string} studentId 
 * @param {number} page 
 * @param {number} limit 
 * @returns {Object} enrollments with pagination
 */
async function getStudentEnrollments(studentId, page = 1, limit = 20) {
  const skip = (page - 1) * limit;
  
  const [enrollments, total] = await Promise.all([
    prisma.courseEnrollment.findMany({
      where: { studentId },
      skip,
      take: limit,
      orderBy: { enrolledAt: 'desc' },
      include: {
        course: {
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
                    email: true,
                    avatar: true
                  }
                }
              }
            },
            _count: {
              select: {
                lessons: true
              }
            }
          }
        }
      }
    }),
    prisma.courseEnrollment.count({
      where: { studentId }
    })
  ]);
  
  return {
    enrollments: enrollments.map(enrollment => ({
      id: enrollment.id,
      courseId: enrollment.courseId,
      status: enrollment.status,
      enrolledAt: enrollment.enrolledAt,
      completedAt: enrollment.completedAt,
      progress: enrollment.progress,
      course: {
        id: enrollment.course.id,
        title: enrollment.course.title,
        titleAr: enrollment.course.titleAr,
        description: enrollment.course.description,
        descriptionAr: enrollment.course.descriptionAr,
        price: enrollment.course.price,
        image: enrollment.course.image,
        status: enrollment.course.status,
        totalLessons: enrollment.course._count.lessons,
        teacher: enrollment.course.teacher
      }
    })),
    pagination: {
      current_page: page,
      per_page: limit,
      total_enrollments: total,
      total_pages: Math.ceil(total / limit)
    }
  };
}

/**
 * Check if student is enrolled in course
 * @param {string} courseId 
 * @param {string} studentId 
 * @returns {Object|null} enrollment or null
 */
async function checkEnrollment(courseId, studentId) {
  return await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId
      }
    },
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true,
          status: true
        }
      }
    }
  });
}

/**
 * Update enrollment progress
 * @param {string} courseId 
 * @param {string} studentId 
 * @param {number} progress - Progress percentage (0-100)
 * @returns {Object} updated enrollment
 */
async function updateEnrollmentProgress(courseId, studentId, progress) {
  const enrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId
      }
    }
  });
  
  if (!enrollment) {
    throw Object.assign(new Error('Enrollment not found'), { statusCode: 404 });
  }
  
  const updateData = {
    progress: Math.min(100, Math.max(0, progress)),
    updatedAt: new Date()
  };
  
  // Mark as completed if progress is 100%
  if (progress >= 100) {
    updateData.completedAt = new Date();
    updateData.status = 'COMPLETED';
  }
  
  return await prisma.courseEnrollment.update({
    where: {
      courseId_studentId: {
        courseId,
        studentId
      }
    },
    data: updateData,
    include: {
      course: {
        select: {
          id: true,
          title: true,
          titleAr: true
        }
      }
    }
  });
}

module.exports = {
  enrollInCourse,
  getStudentEnrollments,
  checkEnrollment,
  updateEnrollmentProgress
};