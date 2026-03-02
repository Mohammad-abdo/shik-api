const { prisma } = require('../lib/prisma');
const notificationService = require('./notificationService');
const SESSION_DURATION_MINUTES = 120;

function parseJsonSafe(value) {
  if (value == null) return null;
  if (typeof value !== 'string') return value;
  try {
    return JSON.parse(value);
  } catch {
    return value;
  }
}

async function create(studentId, dto) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: dto.teacherId },
    include: { user: true },
  });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (!teacher.isApproved) throw Object.assign(new Error('Teacher is not approved'), { statusCode: 400 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Bookings are only available with Quran live-session sheikhs'), { statusCode: 400 });
  }

  const activeSubscription = await prisma.studentSubscription.findFirst({
    where: {
      studentId,
      teacherId: dto.teacherId,
      status: { in: ['ACTIVE', 'PENDING'] },
      endDate: { gte: new Date() },
    },
    orderBy: { createdAt: 'desc' },
  });
  if (!activeSubscription) {
    throw Object.assign(
      new Error('You must subscribe to a package with this teacher before booking. لا يتم أي حجز إلا بعد الاشتراك في باقة.'),
      { statusCode: 400 }
    );
  }

  const duration = SESSION_DURATION_MINUTES;
  const price = teacher.hourlyRate * duration;
  const discount = dto.discount || 0;
  const totalPrice = price - discount;
  const booking = await prisma.booking.create({
    data: {
      studentId,
      teacherId: dto.teacherId,
      subscriptionId: activeSubscription.id,
      date: new Date(dto.date),
      startTime: dto.startTime,
      duration,
      price,
      discount,
      totalPrice,
      notes: dto.notes,
      status: 'PENDING',
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } },
    },
  });
  await notificationService.createNotification(
    teacher.userId,
    'BOOKING_REQUEST',
    'New Booking Request',
    `You have a new booking request from ${booking.student.firstName} ${booking.student.lastName}`,
    { bookingId: booking.id }
  );

  const [packageBookings, scheduleReservations] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId, subscriptionId: activeSubscription.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        session: {
          select: { id: true, roomId: true, startedAt: true, endedAt: true, duration: true },
        },
      },
    }),
    prisma.scheduleReservation.findMany({
      where: { studentId, subscriptionId: activeSubscription.id },
      orderBy: [{ reservationDate: 'asc' }, { startTime: 'asc' }],
      select: { id: true, scheduleId: true, reservationDate: true, startTime: true, endTime: true },
    }),
  ]);

  return {
    ...booking,
    subscriptionTimeline: {
      subscriptionId: activeSubscription.id,
      bookedSchedule: scheduleReservations.map((r) => ({
        id: r.id,
        scheduleId: r.scheduleId,
        date: r.reservationDate,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
      bookedSessions: packageBookings.map((b) => ({
        bookingId: b.id,
        date: b.date,
        startTime: b.startTime,
        duration: b.duration,
        status: b.status,
        session: b.session,
      })),
      joinPolicy: {
        studentCanJoinBeforeStart: false,
        note: 'Student cannot join a session before its scheduled start time.',
      },
    },
  };
}

async function findOne(id, userId, userRole) {
  const booking = await prisma.booking.findUnique({
    where: { id },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true } },
      teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true } } } },
      payment: true,
      session: true,
      review: true,
    },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this booking'), { statusCode: 403 });
  }
  return booking;
}

async function findByStudent(studentId, status) {
  const where = { studentId };
  if (status) where.status = status;
  return prisma.booking.findMany({
    where,
    include: {
      teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, avatar: true } } } },
      payment: true,
      session: true,
    },
    orderBy: { date: 'desc' },
  });
}

async function findByTeacher(teacherId, status) {
  const where = { teacherId };
  if (status) where.status = status;
  return prisma.booking.findMany({
    where,
    include: {
      student: { select: { id: true, firstName: true, lastName: true, avatar: true, email: true } },
      payment: true,
      session: true,
    },
    orderBy: { date: 'desc' },
  });
}

async function confirm(bookingId, teacherId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true, student: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You can only confirm your own bookings'), { statusCode: 403 });
  }
  if (booking.status !== 'PENDING') throw Object.assign(new Error('Booking is not in pending status'), { statusCode: 400 });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
    include: { student: true, teacher: { include: { user: true } } },
  });
  await notificationService.createNotification(
    booking.studentId,
    'BOOKING_CONFIRMED',
    'Booking Confirmed',
    `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been confirmed`,
    { bookingId: updated.id }
  );
  return updated;
}

async function cancel(bookingId, userId, userRole) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true, student: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You can only cancel your own bookings'), { statusCode: 403 });
  }
  if (booking.status === 'COMPLETED' || booking.status === 'CANCELLED') {
    throw Object.assign(new Error('Cannot cancel this booking'), { statusCode: 400 });
  }
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: userId },
    include: { student: true, teacher: { include: { user: true } } },
  });
  const notifyUserId = booking.studentId === userId ? booking.teacher.userId : booking.studentId;
  const notifyName = booking.studentId === userId
    ? `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`
    : `${updated.student.firstName} ${updated.student.lastName}`;
  await notificationService.createNotification(
    notifyUserId,
    'BOOKING_CANCELLED',
    'Booking Cancelled',
    `Your booking with ${notifyName} has been cancelled`,
    { bookingId: updated.id }
  );
  return updated;
}

async function reject(bookingId, teacherId, userId) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true, student: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You can only reject your own bookings'), { statusCode: 403 });
  }
  if (booking.status !== 'PENDING') throw Object.assign(new Error('Booking is not in pending status'), { statusCode: 400 });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'REJECTED', cancelledAt: new Date(), cancelledBy: userId },
    include: { student: true, teacher: { include: { user: true } } },
  });
  await notificationService.createNotification(
    booking.studentId,
    'BOOKING_REJECTED',
    'Booking Rejected',
    `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been rejected`,
    { bookingId: updated.id }
  );
  return updated;
}

/**
 * Rich booking details for FULL_TEACHER: package stats, student, session (memorizations, revisions, report), schedule, history.
 */
async function getBookingDetails(bookingId, userId, userRole) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true, phone: true, avatar: true } },
      teacher: {
        include: {
          user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, email: true, phone: true, avatar: true } },
        },
      },
      payment: true,
      session: {
        include: {
          memorizations: { orderBy: { createdAt: 'asc' } },
          revisions: { orderBy: { createdAt: 'asc' } },
          report: true,
        },
      },
      review: true,
    },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!isAdmin && booking.studentId !== userId && booking.teacher?.userId !== userId) {
    throw Object.assign(new Error('You do not have access to this booking'), { statusCode: 403 });
  }

  const teacherId = booking.teacherId;
  const studentId = booking.studentId;
  let subscriptionId = booking.subscriptionId || null;

  let subscription = null;
  let scheduleReservations = [];
  let usedSessions = 0;
  let totalSessions = 0;
  let remainingSessions = 0;

  // If this booking has no subscriptionId, try to find active subscription for same student+teacher so sheikh still sees package
  let sub = null;
  try {
    if (subscriptionId) {
      sub = await prisma.studentSubscription.findUnique({
        where: { id: subscriptionId },
        include: {
          package: true,
          teacher: {
            include: {
              schedules: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
            },
          },
        },
      });
    }
    if (!sub) {
      sub = await prisma.studentSubscription.findFirst({
        where: {
          studentId,
          teacherId,
          status: { in: ['ACTIVE', 'PENDING'] },
          endDate: { gte: new Date() },
        },
        orderBy: { createdAt: 'desc' },
        include: {
          package: true,
          teacher: {
            include: {
              schedules: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
            },
          },
        },
      });
      if (sub) subscriptionId = sub.id;
    }

    if (sub) {
      subscription = {
        id: sub.id,
        packageName: sub.package?.name || null,
        packageNameAr: sub.package?.nameAr || null,
        totalSessions: sub.package?.totalSessions ?? 0,
        startDate: sub.startDate,
        endDate: sub.endDate,
        status: sub.status,
        selectedSlots: parseJsonSafe(sub.selectedSlots),
      };
      totalSessions = subscription.totalSessions;
      usedSessions = await prisma.booking.count({
        where: { subscriptionId: sub.id, status: 'COMPLETED' },
      });
      remainingSessions = Math.max(0, totalSessions - usedSessions);
      subscription.usedSessions = usedSessions;
      subscription.remainingSessions = remainingSessions;

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      scheduleReservations = await prisma.scheduleReservation.findMany({
        where: { subscriptionId: sub.id, reservationDate: { gte: today } },
        orderBy: [{ reservationDate: 'asc' }, { startTime: 'asc' }],
        take: 50,
      });
      subscription.bookedSlotsCount = scheduleReservations.length;
      subscription.availableSlots = (sub.teacher?.schedules || []).map((s) => ({
        dayOfWeek: s.dayOfWeek,
        startTime: s.startTime,
        endTime: s.endTime,
      }));
    }
  } catch (subErr) {
    console.error('getBookingDetails subscription load failed:', subErr?.message || subErr);
    subscription = null;
    scheduleReservations = [];
  }

  let totalSessionsWithTeacher = 0;
  let upcomingBookings = [];
  let pastSessionsWithSession = [];

  try {
    totalSessionsWithTeacher = await prisma.booking.count({
      where: { studentId, teacherId, status: 'COMPLETED' },
    });

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    upcomingBookings = await prisma.booking.findMany({
      where: {
        studentId,
        teacherId,
        status: { in: ['CONFIRMED', 'PENDING'] },
        date: { gte: today },
      },
      include: {
        session: { select: { id: true, startedAt: true, endedAt: true, duration: true } },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
    });

    const pastSessions = await prisma.booking.findMany({
      where: { studentId, teacherId, status: 'COMPLETED' },
      include: {
        session: {
          include: {
            memorizations: { orderBy: { createdAt: 'asc' } },
            revisions: { orderBy: { createdAt: 'asc' } },
            report: true,
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    pastSessionsWithSession = pastSessions.filter((b) => b.session != null && b.session.endedAt != null);
  } catch (listErr) {
    console.error('getBookingDetails upcoming/past sessions failed:', listErr?.message || listErr);
  }

  // Avoid circular reference and ensure JSON-serializable response (session.booking can cause 500)
  if (booking.session && typeof booking.session === 'object') {
    const s = { ...booking.session };
    delete s.booking;
    booking = { ...booking, session: s };
  }
  const safeUpcoming = (upcomingBookings || []).map((b) => {
    const out = { ...b };
    if (out.session && typeof out.session === 'object') delete out.session.booking;
    return out;
  });
  const safePast = (pastSessionsWithSession || []).map((b) => {
    const out = { ...b };
    if (out.session && typeof out.session === 'object') delete out.session.booking;
    return out;
  });

  return {
    ...booking,
    subscription,
    scheduleReservations,
    totalSessionsWithTeacher,
    upcomingBookings: safeUpcoming,
    pastSessions: safePast,
  };
}

async function getSubscriptionPackagesForStudent(studentId, teacherId) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      user: {
        select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true },
      },
      schedules: { where: { isActive: true }, orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (!teacher.isApproved) throw Object.assign(new Error('Teacher is not approved'), { statusCode: 400 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Subscription packages are only available with Quran live-session sheikhs'), { statusCode: 400 });
  }

  const packages = await prisma.studentSubscriptionPackage.findMany({
    where: { isActive: true },
    orderBy: [{ isPopular: 'desc' }, { price: 'asc' }, { createdAt: 'desc' }],
  });

  const currentSubscription = await prisma.studentSubscription.findFirst({
    where: {
      studentId,
      teacherId,
      status: { in: ['ACTIVE', 'PENDING'] },
      endDate: { gte: new Date() },
    },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });

  return {
    teacher: {
      id: teacher.id,
      name: `${teacher.user?.firstName || ''} ${teacher.user?.lastName || ''}`.trim(),
      nameAr: `${teacher.user?.firstNameAr || ''} ${teacher.user?.lastNameAr || ''}`.trim(),
      avatar: teacher.image || teacher.user?.avatar || null,
      hourlyRate: teacher.hourlyRate,
      schedules: teacher.schedules,
    },
    packages: packages.map((pkg) => ({
      ...pkg,
      features: parseJsonSafe(pkg.features),
      featuresAr: parseJsonSafe(pkg.featuresAr),
    })),
    currentSubscription: currentSubscription
      ? {
          ...currentSubscription,
          package: {
            ...currentSubscription.package,
            features: parseJsonSafe(currentSubscription.package.features),
            featuresAr: parseJsonSafe(currentSubscription.package.featuresAr),
          },
          selectedSlots: parseJsonSafe(currentSubscription.selectedSlots),
        }
      : null,
  };
}

module.exports = {
  create,
  findOne,
  getBookingDetails,
  findByStudent,
  findByTeacher,
  confirm,
  cancel,
  reject,
  getSubscriptionPackagesForStudent,
};
