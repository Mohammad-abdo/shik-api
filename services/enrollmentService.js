const { prisma } = require('../lib/prisma');
const fawryService = require('./fawry');

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
async function enrollInCourse(courseId, studentId, sheikId = null, options = {}) {
  const { bypassPayment = false } = options;
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

  // Check if student is already enrolled (before payment check, so "already enrolled" is clear)
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

  // Paid course: require either bypassPayment or a completed payment for this course
  if (!bypassPayment && Number(course.price || 0) > 0) {
    // 1) Payment linked via booking (course flow creates Payment with bookingId; booking has courseId + studentId)
    let completedPayment = await prisma.payment.findFirst({
      where: {
        status: 'COMPLETED',
        booking: { courseId, studentId },
      },
    });
    // 2) Payment with direct courseId + userId (some flows set these)
    if (!completedPayment) {
      completedPayment = await prisma.payment.findFirst({
        where: {
          status: 'COMPLETED',
          courseId,
          userId: studentId,
        },
      });
    }
    // 3) Via booking: find booking for this course+student and check its payment
    if (!completedPayment) {
      const bookingWithPayment = await prisma.booking.findFirst({
        where: { courseId, studentId, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { payment: true },
      });
      if (bookingWithPayment?.payment?.status === 'COMPLETED') {
        completedPayment = bookingWithPayment.payment;
      }
    }
    // 4) If still no completed payment: sync with Fawry (webhook may not have run)
    if (!completedPayment) {
      const pendingBooking = await prisma.booking.findFirst({
        where: { courseId, studentId, status: { in: ['PENDING', 'CONFIRMED'] } },
        include: { payment: true },
      });
      const pendingPayment = pendingBooking?.payment;
      if (pendingPayment?.status === 'PENDING' && pendingPayment?.merchantRefNum) {
        try {
          const fawryStatus = await fawryService.getPaymentStatus(pendingPayment.merchantRefNum);
          const orderStatus = String(fawryStatus?.orderStatus || fawryStatus?.paymentStatus || fawryStatus?.status || '').trim().toUpperCase();
          const statusCode = fawryStatus?.statusCode;
          const isPaid = orderStatus === 'PAID' || orderStatus === 'SUCCESS' || Number(statusCode) === 200;
          if (isPaid) {
            await prisma.$transaction([
              prisma.payment.update({
                where: { id: pendingPayment.id },
                data: {
                  status: 'COMPLETED',
                  fawryRefNumber: fawryStatus?.referenceNumber || fawryStatus?.fawryRefNumber || pendingPayment.fawryRefNumber,
                },
              }),
              prisma.booking.updateMany({
                where: { id: pendingBooking.id, status: 'PENDING' },
                data: { status: 'CONFIRMED' },
              }),
              prisma.courseEnrollment.upsert({
                where: { courseId_studentId: { courseId, studentId } },
                create: { courseId, studentId, status: 'ACTIVE', progress: 0 },
                update: { status: 'ACTIVE' },
              }),
            ]);
            completedPayment = await prisma.payment.findUnique({ where: { id: pendingPayment.id } });
            const enrollmentAfterSync = await prisma.courseEnrollment.findUnique({
              where: { courseId_studentId: { courseId, studentId } },
              include: {
                course: { include: { teacher: { include: { user: true } } } },
                student: true,
              },
            });
            if (enrollmentAfterSync) {
              const e = enrollmentAfterSync;
              return {
                id: e.id,
                courseId: e.courseId,
                studentId: e.studentId,
                status: e.status,
                enrolledAt: e.enrolledAt,
                progress: e.progress,
                course: {
                  id: e.course.id,
                  title: e.course.title,
                  titleAr: e.course.titleAr,
                  description: e.course.description,
                  descriptionAr: e.course.descriptionAr,
                  price: e.course.price,
                  image: e.course.image,
                  teacher: e.course.teacher,
                },
                student: e.student,
              };
            }
          }
        } catch (err) {
          // Fawry API error or network: do not block; will throw 402 below
        }
      }
    }
    if (!completedPayment) {
      throw Object.assign(
        new Error('This course requires payment first. Please pay with Fawry before enrollment.'),
        { statusCode: 402 }
      );
    }
  }

  // Verify sheikh is associated with the course (if provided)
  if (sheikId) {
    const validSheikh = course.teacherId === sheikId || 
                       course.courseTeachers.some(ct => ct.teacherId === sheikId);
    
    if (!validSheikh) {
      throw Object.assign(new Error('Sheikh is not associated with this course'), { statusCode: 400 });
    }
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

async function createCourseFawryReference(courseId, student, options = {}) {
  const FAWRY_MERCHANT_CODE = (process.env.FAWRY_MERCHANT_CODE || '').trim();
  const FAWRY_SECURE_KEY = (process.env.FAWRY_SECURE_KEY || '').trim();
  const BASE_URL = process.env.BASE_URL || '';

  if (!FAWRY_MERCHANT_CODE || !FAWRY_SECURE_KEY) {
    throw Object.assign(new Error('Fawry is not configured'), { statusCode: 503 });
  }

  if (student.role !== 'STUDENT' && student.role !== 'ADMIN' && student.role !== 'SUPER_ADMIN') {
    throw Object.assign(new Error('Only students can purchase courses'), { statusCode: 403 });
  }

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: {
      teacher: true,
      courseTeachers: true,
    },
  });

  if (!course) {
    throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  }

  if (course.status !== 'PUBLISHED') {
    throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });
  }

  const existingEnrollment = await prisma.courseEnrollment.findUnique({
    where: {
      courseId_studentId: {
        courseId,
        studentId: student.id,
      },
    },
  });

  if (existingEnrollment) {
    return {
      alreadyEnrolled: true,
      enrollmentId: existingEnrollment.id,
      message: 'Student is already enrolled in this course',
    };
  }

  if (Number(course.price || 0) <= 0) {
    const freeEnrollment = await enrollInCourse(courseId, student.id, null, { bypassPayment: true });
    return {
      alreadyEnrolled: false,
      freeCourse: true,
      enrollment: freeEnrollment,
    };
  }

  const teacherId = course.teacherId || course.courseTeachers?.[0]?.teacherId || null;
  if (!teacherId) {
    throw Object.assign(
      new Error('No teacher is linked to this course, unable to create payment booking'),
      { statusCode: 400 }
    );
  }

  const existingBooking = await prisma.booking.findFirst({
    where: {
      studentId: student.id,
      courseId,
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    include: {
      payment: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  if (existingBooking?.payment?.status === 'COMPLETED') {
    const enrollment = await prisma.courseEnrollment.upsert({
      where: {
        courseId_studentId: {
          courseId,
          studentId: student.id,
        },
      },
      create: {
        courseId,
        studentId: student.id,
        status: 'ACTIVE',
        progress: 0,
      },
      update: {
        status: 'ACTIVE',
      },
    });

    return {
      alreadyEnrolled: true,
      enrollmentId: enrollment.id,
      message: 'Payment already completed and enrollment is active',
    };
  }

  let booking = existingBooking;
  if (!booking) {
    booking = await prisma.booking.create({
      data: {
        studentId: student.id,
        teacherId,
        courseId,
        date: new Date(),
        startTime: '00:00',
        duration: Math.max(1, (course.duration || 1) * 60),
        status: 'PENDING',
        price: Number(course.price),
        totalPrice: Number(course.price),
        discount: 0,
        notes: `Course purchase: ${course.title}`,
        type: 'SINGLE',
      },
      include: {
        payment: true,
      },
    });
  }

  const numericRef = () => String(Math.floor(Math.random() * 900000000) + 100000000);
  const merchantRefNum = numericRef();

  const payment = await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: Number(course.price),
      currency: process.env.FAWRY_CURRENCY || 'EGP',
      status: 'PENDING',
      paymentMethod: 'PayAtFawry',
      merchantRefNum,
    },
    update: {
      paymentMethod: 'PayAtFawry',
      merchantRefNum,
      status: 'PENDING',
    },
  });

  const expiryHours = Number(options.expiryHours) > 0 ? Number(options.expiryHours) : 24;
  const expiryTimestamp = Date.now() + expiryHours * 60 * 60 * 1000;
  const paymentExpiry = String(expiryTimestamp);
  // Webhook must be a full public URL so Fawry can notify when payment is done (set FAWRY_ORDER_WEBHOOK_URL or BASE_URL)
  const apiBase = (process.env.BASE_URL || process.env.API_URL || '').replace(/\/$/, '');
  const orderWebHookUrl =
    process.env.FAWRY_ORDER_WEBHOOK_URL ||
    (apiBase ? `${apiBase}/api/payments/fawry/webhook` : undefined);

  const profileDigits = String(student.id || '0').replace(/\D/g, '').slice(0, 10) || '0';
  const customerName =
    [student.firstName, student.lastName].filter(Boolean).join(' ').trim() || student.email || 'Student';
  const customerMobile = student.phone || student.student_phone || '';

  const chargeRequest = fawryService.buildChargeRequest({
    merchantCode: FAWRY_MERCHANT_CODE,
    merchantRefNum,
    customerMobile,
    customerEmail: student.email,
    customerName,
    customerProfileId: profileDigits,
    chargeItems: [
      {
        itemId: course.id.replace(/-/g, ''),
        description: `Course ${course.title}`,
        price: Number(course.price),
        quantity: 1,
      },
    ],
    language: options.language === 'en-gb' ? 'en-gb' : 'ar-eg',
    secureKey: FAWRY_SECURE_KEY,
    paymentExpiry,
    orderWebHookUrl,
    paymentMethod: 'PayAtFawry',
    description: `Payment for course ${course.id}`,
  });

  const result = await fawryService.createCharge(chargeRequest);

  return {
    alreadyEnrolled: false,
    freeCourse: false,
    bookingId: booking.id,
    paymentId: payment.id,
    merchantRefNum,
    referenceNumber: result.referenceNumber,
    amount: Number(course.price),
    currency: process.env.FAWRY_CURRENCY || 'EGP',
    expiresAt: result.expiresAt || new Date(expiryTimestamp).toISOString(),
    instructions: {
      en: 'Visit any Fawry store and provide this reference number to complete your payment.',
      ar: 'قم بزيارة أي فرع من فوري وقدم رقم المرجع هذا لإتمام الدفع.',
    },
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

/**
 * Get or create booking and payment for a course (for checkout link).
 * Returns { course, booking, payment } or throws. Does not call Fawry.
 */
async function getOrCreateCourseBookingAndPayment(courseId, studentId) {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    include: { teacher: true, courseTeachers: true },
  });
  if (!course) throw Object.assign(new Error('Course not found'), { statusCode: 404 });
  if (course.status !== 'PUBLISHED') throw Object.assign(new Error('Course is not available for enrollment'), { statusCode: 400 });

  const existingEnrollment = await prisma.courseEnrollment.findUnique({
    where: { courseId_studentId: { courseId, studentId } },
  });
  if (existingEnrollment) throw Object.assign(new Error('Student is already enrolled in this course'), { statusCode: 400 });

  if (Number(course.price || 0) <= 0) {
    const enrollment = await enrollInCourse(courseId, studentId, null, { bypassPayment: true });
    return { course, enrollment, booking: null, payment: null, freeCourse: true };
  }

  const teacherId = course.teacherId || course.courseTeachers?.[0]?.teacherId || null;
  if (!teacherId) throw Object.assign(new Error('No teacher linked to this course'), { statusCode: 400 });

  let booking = await prisma.booking.findFirst({
    where: { studentId, courseId, status: { in: ['PENDING', 'CONFIRMED'] } },
    include: { payment: true },
    orderBy: { createdAt: 'desc' },
  });

  if (booking?.payment?.status === 'COMPLETED') {
    const enrollment = await prisma.courseEnrollment.upsert({
      where: { courseId_studentId: { courseId, studentId } },
      create: { courseId, studentId, status: 'ACTIVE', progress: 0 },
      update: { status: 'ACTIVE' },
    });
    return { course, enrollment, booking, payment: booking.payment, freeCourse: false };
  }

  if (!booking) {
    booking = await prisma.booking.create({
      data: {
        studentId,
        teacherId,
        courseId,
        date: new Date(),
        startTime: '00:00',
        duration: Math.max(1, (course.duration || 1) * 60),
        status: 'PENDING',
        price: Number(course.price),
        totalPrice: Number(course.price),
        discount: 0,
        notes: `Course purchase: ${course.title}`,
        type: 'SINGLE',
      },
      include: { payment: true },
    });
  }

  const merchantRefNum = String(Math.floor(Math.random() * 900000000) + 100000000);
  const payment = await prisma.payment.upsert({
    where: { bookingId: booking.id },
    create: {
      bookingId: booking.id,
      amount: Number(course.price),
      currency: process.env.FAWRY_CURRENCY || 'EGP',
      status: 'PENDING',
      paymentMethod: 'CARD',
      merchantRefNum,
    },
    update: { merchantRefNum, status: 'PENDING', paymentMethod: 'CARD' },
  });

  return { course, enrollment: null, booking, payment, freeCourse: false };
}

module.exports = {
  enrollInCourse,
  createCourseFawryReference,
  getOrCreateCourseBookingAndPayment,
  getStudentEnrollments,
  checkEnrollment,
  updateEnrollmentProgress
};
