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

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  const totalM = (h * 60 + (m || 0)) + minutes;
  const nh = Math.floor(totalM / 60) % 24;
  const nm = totalM % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

async function create(studentId, dto) {
  const normalizedSlots = Array.isArray(dto?.slots)
    ? dto.slots.map((slot) => ({
        scheduleId: slot.scheduleId || slot.schedule_id,
        scheduledDate: slot.scheduledDate || slot.scheduled_date || slot.date,
        startTime: slot.startTime || slot.start_time,
      }))
    : [];

  const normalizedDto = {
    ...dto,
    teacherId: dto?.teacherId || dto?.teacher_id || dto?.sheikhId || dto?.sheikh_id,
    scheduleId: dto?.scheduleId || dto?.schedule_id,
    date: dto?.date || dto?.scheduledDate || dto?.scheduled_date,
    startTime: dto?.startTime || dto?.start_time,
    paymentMethod: dto?.paymentMethod || dto?.payment_type,
    packageId: dto?.packageId || dto?.package_id,
    slots: normalizedSlots.length > 0 ? normalizedSlots : dto?.slots,
  };

  if (!normalizedDto.teacherId) {
    throw Object.assign(
      new Error(
        'teacherId is required. If you are subscribing to a package, use POST /api/student-subscriptions/subscribe with packageId + teacherId.'
      ),
      { statusCode: 400 }
    );
  }

  const teacher = await prisma.teacher.findUnique({
    where: { id: normalizedDto.teacherId },
    include: { user: true, schedules: { where: { isActive: true } } },
  });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (!teacher.isApproved) throw Object.assign(new Error('Teacher is not approved'), { statusCode: 400 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Bookings are only available with Quran live-session sheikhs'), { statusCode: 400 });
  }

  const activeSubscription = await prisma.studentSubscription.findFirst({
    where: {
      studentId,
      teacherId: normalizedDto.teacherId,
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
  let slots = Array.isArray(normalizedDto.slots) && normalizedDto.slots.length > 0
    ? normalizedDto.slots
    : [{ scheduleId: normalizedDto.scheduleId, scheduledDate: normalizedDto.date, startTime: normalizedDto.startTime }];

  if (!slots[0].scheduleId || !slots[0].scheduledDate || !slots[0].startTime) {
    throw Object.assign(new Error('At least one slot with scheduleId, scheduledDate and startTime is required'), { statusCode: 400 });
  }

  const scheduleIds = [...new Set(slots.map((s) => s.scheduleId))];
  const schedules = await prisma.schedule.findMany({
    where: { id: { in: scheduleIds }, teacherId: teacher.id, isActive: true },
  });
  if (schedules.length !== scheduleIds.length) {
    throw Object.assign(new Error('All slot scheduleIds must belong to the teacher and be active'), { statusCode: 400 });
  }

  for (const slot of slots) {
    const existing = await prisma.bookingSession.findUnique({
      where: {
        scheduleId_scheduledDate_startTime: {
          scheduleId: slot.scheduleId,
          scheduledDate: new Date(slot.scheduledDate),
          startTime: slot.startTime,
        },
      },
    });
    if (existing) {
      throw Object.assign(
        new Error(`Slot ${slot.scheduledDate} ${slot.startTime} is already booked`),
        { statusCode: 400 }
      );
    }
  }

  const firstSlot = slots[0];
  const firstDate = new Date(firstSlot.scheduledDate);
  const pricePerSession = (teacher.hourlyRate || 0) * (duration / 60);
  const totalPrice = pricePerSession * slots.length;
  const discount = dto.discount || 0;
  const finalTotal = totalPrice - discount;

  const booking = await prisma.booking.create({
    data: {
      studentId,
      teacherId: normalizedDto.teacherId,
      subscriptionId: activeSubscription.id,
      scheduleId: firstSlot.scheduleId,
      date: firstDate,
      startTime: firstSlot.startTime,
      duration,
      price: totalPrice,
      discount,
      totalPrice: finalTotal,
      notes: normalizedDto.notes,
      status: 'PENDING',
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
      teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } } },
    },
  });

  const scheduleById = Object.fromEntries(schedules.map((s) => [s.id, s]));
  for (let i = 0; i < slots.length; i++) {
    const slot = slots[i];
    const schedule = scheduleById[slot.scheduleId];
    const scheduledDate = new Date(slot.scheduledDate);
    const endTime = addMinutesToTime(slot.startTime, duration);
    await prisma.bookingSession.create({
      data: {
        bookingId: booking.id,
        scheduleId: slot.scheduleId,
        scheduledDate,
        startTime: slot.startTime,
        endTime: schedule ? schedule.endTime : endTime,
        orderIndex: i + 1,
        status: 'PENDING',
      },
    });
  }

  await notificationService.createNotification(
    teacher.userId,
    'BOOKING_REQUEST',
    'New Booking Request',
    `You have a new booking request from ${booking.student.firstName} ${booking.student.lastName}`,
    { bookingId: booking.id },
    booking.id,
    null
  );
  await notificationService.notifyAdmins(
    'BOOKING_REQUEST',
    'New Booking Request',
    `New booking request from ${booking.student.firstName} ${booking.student.lastName} for ${teacher.user?.firstName || 'Sheikh'}`,
    { bookingId: booking.id },
    booking.id,
    null
  );

  const [packageBookings, scheduleReservations, bookingSessions] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId, subscriptionId: activeSubscription.id },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      include: {
        bookingSessions: {
          orderBy: { orderIndex: 'asc' },
          include: { session: { select: { id: true, roomId: true, startedAt: true, endedAt: true, duration: true } } },
        },
      },
    }),
    prisma.scheduleReservation.findMany({
      where: { studentId, subscriptionId: activeSubscription.id },
      orderBy: [{ reservationDate: 'asc' }, { startTime: 'asc' }],
      select: { id: true, scheduleId: true, reservationDate: true, startTime: true, endTime: true },
    }),
    prisma.bookingSession.findMany({
      where: { bookingId: booking.id },
      orderBy: { orderIndex: 'asc' },
      include: { session: { select: { id: true, roomId: true, startedAt: true, endedAt: true, duration: true } } },
    }),
  ]);

  return {
    ...booking,
    bookingSessions,
    subscriptionTimeline: {
      subscriptionId: activeSubscription.id,
      bookedSchedule: scheduleReservations.map((r) => ({
        id: r.id,
        scheduleId: r.scheduleId,
        date: r.reservationDate,
        startTime: r.startTime,
        endTime: r.endTime,
      })),
      bookedSessions: packageBookings.flatMap((b) =>
        (b.bookingSessions || []).map((bs) => ({
          bookingSessionId: bs.id,
          bookingId: b.id,
          scheduledDate: bs.scheduledDate,
          startTime: bs.startTime,
          duration,
          status: bs.status,
          session: bs.session,
        }))
      ),
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
      bookingSessions: {
        orderBy: { orderIndex: 'asc' },
        include: { session: true },
      },
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
      bookingSessions: {
        orderBy: { orderIndex: 'asc' },
        include: { session: true },
      },
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
      bookingSessions: {
        orderBy: { orderIndex: 'asc' },
        include: { session: true },
      },
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
  await prisma.bookingSession.updateMany({
    where: { bookingId },
    data: { status: 'CONFIRMED' },
  });
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
    { bookingId: updated.id },
    updated.id,
    userId
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
  await prisma.bookingSession.updateMany({
    where: { bookingId },
    data: { status: 'CANCELLED' },
  });
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
    { bookingId: updated.id },
    updated.id,
    userId
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
  await prisma.bookingSession.updateMany({
    where: { bookingId },
    data: { status: 'CANCELLED' },
  });
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
    { bookingId: updated.id },
    updated.id,
    userId
  );
  return updated;
}

const BOOKING_SESSION_STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED'];

/**
 * Update a single booking session (slot). Allowed: scheduledDate, startTime, endTime, status.
 * Teacher of the booking or admin only.
 */
async function updateBookingSession(bookingSessionId, data, userId, userRole) {
  const bookingSession = await prisma.bookingSession.findUnique({
    where: { id: bookingSessionId },
    include: {
      booking: { include: { teacher: true } },
      schedule: true,
    },
  });
  if (!bookingSession) throw Object.assign(new Error('Booking session not found'), { statusCode: 404 });
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!isAdmin && bookingSession.booking.teacher.userId !== userId) {
    throw Object.assign(new Error('You can only edit sessions for your own bookings'), { statusCode: 403 });
  }
  const updateData = {};
  if (data.status != null) {
    if (!BOOKING_SESSION_STATUSES.includes(data.status)) {
      throw Object.assign(new Error('Invalid status'), { statusCode: 400 });
    }
    updateData.status = data.status;
  }
  const scheduledDate = data.scheduledDate != null && data.scheduledDate !== '' ? new Date(data.scheduledDate) : null;
  const startTime = data.startTime != null && String(data.startTime).trim() !== '' ? String(data.startTime).trim() : null;
  const endTime = data.endTime != null && String(data.endTime).trim() !== '' ? String(data.endTime).trim() : null;
  if (scheduledDate != null || startTime != null || endTime != null) {
    const finalDate = scheduledDate || bookingSession.scheduledDate;
    const finalStart = startTime ?? bookingSession.startTime;
    const finalEnd = endTime ?? bookingSession.endTime ?? addMinutesToTime(finalStart, SESSION_DURATION_MINUTES);
    const dayOfWeek = finalDate.getDay();
    let schedule = await prisma.schedule.findFirst({
      where: { teacherId: bookingSession.booking.teacherId, dayOfWeek, startTime: finalStart, isActive: true },
    });
    if (!schedule) {
      schedule = await prisma.schedule.create({
        data: {
          teacherId: bookingSession.booking.teacherId,
          dayOfWeek,
          startTime: finalStart,
          endTime: finalEnd,
          isActive: true,
        },
      });
    }
    const existingSlot = await prisma.bookingSession.findFirst({
      where: {
        scheduleId: schedule.id,
        scheduledDate: finalDate,
        startTime: finalStart,
        id: { not: bookingSessionId },
      },
    });
    if (existingSlot) {
      throw Object.assign(new Error('This date and time slot is already taken'), { statusCode: 400 });
    }
    updateData.scheduleId = schedule.id;
    updateData.scheduledDate = finalDate;
    updateData.startTime = finalStart;
    updateData.endTime = finalEnd;
  }
  if (Object.keys(updateData).length === 0) {
    return prisma.bookingSession.findUnique({
      where: { id: bookingSessionId },
      include: { session: true, schedule: true },
    });
  }
  const updated = await prisma.bookingSession.update({
    where: { id: bookingSessionId },
    data: updateData,
    include: { session: true, schedule: true },
  });
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
      bookingSessions: {
        orderBy: { orderIndex: 'asc' },
        include: {
          session: {
            include: {
              memorizations: { orderBy: { createdAt: 'asc' } },
              revisions: { orderBy: { createdAt: 'asc' } },
              report: true,
            },
          },
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
        bookingSessions: {
          orderBy: { orderIndex: 'asc' },
          include: { session: { select: { id: true, startedAt: true, endedAt: true, duration: true } } },
        },
      },
      orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
      take: 10,
    });

    const pastSessions = await prisma.booking.findMany({
      where: { studentId, teacherId, status: 'COMPLETED' },
      include: {
        bookingSessions: {
          orderBy: { orderIndex: 'asc' },
          include: {
            session: {
              include: {
                memorizations: { orderBy: { createdAt: 'asc' } },
                revisions: { orderBy: { createdAt: 'asc' } },
                report: true,
              },
            },
          },
        },
      },
      orderBy: { date: 'desc' },
      take: 20,
    });

    pastSessionsWithSession = pastSessions.filter((b) =>
      (b.bookingSessions || []).some((bs) => bs.session != null && bs.session.endedAt != null)
    );
  } catch (listErr) {
    console.error('getBookingDetails upcoming/past sessions failed:', listErr?.message || listErr);
  }

  // Avoid circular reference and ensure JSON-serializable response
  const safeBooking = { ...booking };
  if (safeBooking.bookingSessions) {
    safeBooking.bookingSessions = safeBooking.bookingSessions.map((bs) => {
      const out = { ...bs };
      if (out.session && typeof out.session === 'object') delete out.session.bookingSession;
      return out;
    });
  }
  const safeUpcoming = (upcomingBookings || []).map((b) => {
    const out = { ...b };
    if (out.bookingSessions) {
      out.bookingSessions = out.bookingSessions.map((bs) => {
        const bsOut = { ...bs };
        if (bsOut.session && typeof bsOut.session === 'object') delete bsOut.session.bookingSession;
        return bsOut;
      });
    }
    return out;
  });
  const safePast = (pastSessionsWithSession || []).map((b) => {
    const out = { ...b };
    if (out.bookingSessions) {
      out.bookingSessions = out.bookingSessions.map((bs) => {
        const bsOut = { ...bs };
        if (bsOut.session && typeof bsOut.session === 'object') delete bsOut.session.bookingSession;
        return bsOut;
      });
    }
    return out;
  });

  return {
    ...safeBooking,
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
  updateBookingSession,
  getSubscriptionPackagesForStudent,
};
