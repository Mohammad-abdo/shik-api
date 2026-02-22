const { prisma } = require('../lib/prisma');
const fawryService = require('./fawry');
const { v4: uuidv4 } = require('uuid');
const DAY_NAMES = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];
const SESSION_DURATION_MINUTES = 120;

const DAY_ALIASES = {
  SUNDAY: 0, SUN: 0,
  MONDAY: 1, MON: 1,
  TUESDAY: 2, TUE: 2, TUES: 2,
  WEDNESDAY: 3, WED: 3,
  THURSDAY: 4, THU: 4, THUR: 4, THURS: 4,
  FRIDAY: 5, FRI: 5,
  SATURDAY: 6, SAT: 6,
};

function parseFeatures(pkg) {
  if (pkg.features && typeof pkg.features === 'string') pkg.features = JSON.parse(pkg.features);
  if (pkg.featuresAr && typeof pkg.featuresAr === 'string') pkg.featuresAr = JSON.parse(pkg.featuresAr);
  if (pkg.sessionsPerMonth === undefined) {
    pkg.sessionsPerMonth = pkg.totalSessions ?? pkg.maxBookings ?? 0;
  }
  return pkg;
}

function parseDayOfWeek(value) {
  if (typeof value !== 'string') return null;
  const upper = String(value || '').trim().toUpperCase();
  if (Object.prototype.hasOwnProperty.call(DAY_ALIASES, upper)) return DAY_ALIASES[upper];
  return null;
}

function normalizeTime(time) {
  const raw = String(time || '').trim();
  const match = raw.match(/^(\d{1,2}):(\d{2})/);
  if (!match) return null;
  const hour = Number(match[1]);
  const min = Number(match[2]);
  if (hour < 0 || hour > 23 || min < 0 || min > 59) return null;
  return `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
}

function toMinutes(time) {
  const normalized = normalizeTime(time);
  if (!normalized) return null;
  const [h, m] = normalized.split(':').map(Number);
  return h * 60 + m;
}

function sameDay(a, b) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function normalizeSelectedSlots(selectedSlots) {
  if (!Array.isArray(selectedSlots)) return [];
  const seen = new Set();
  const normalized = [];
  for (let index = 0; index < selectedSlots.length; index += 1) {
    const slot = selectedSlots[index];
    const dayOfWeek = parseDayOfWeek(slot?.dayOfWeek);
    const startTime = normalizeTime(slot?.startTime);
    if (dayOfWeek == null) {
      throw Object.assign(
        new Error(`selectedSlots[${index}].dayOfWeek must be an English day name (e.g. SUNDAY, MONDAY)`),
        { statusCode: 400 }
      );
    }
    if (!startTime) {
      throw Object.assign(
        new Error(`selectedSlots[${index}].startTime must be in HH:mm format`),
        { statusCode: 400 }
      );
    }
    const key = `${dayOfWeek}-${startTime}`;
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push({
      dayOfWeek,
      dayName: DAY_NAMES[dayOfWeek],
      startTime,
    });
  }
  return normalized.sort((a, b) => (a.dayOfWeek - b.dayOfWeek) || a.startTime.localeCompare(b.startTime));
}

async function createPackage(dto, adminId) {
  const sessionsPerMonth = dto.sessionsPerMonth ?? dto.totalSessions ?? dto.maxBookings ?? 0;
  const pkg = await prisma.studentSubscriptionPackage.create({
    data: {
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      price: dto.price,
      duration: dto.duration || 30,
      durationMonths: dto.durationMonths,
      totalSessions: sessionsPerMonth,
      monthlyPrice: dto.monthlyPrice,
      yearlyPrice: dto.yearlyPrice,
      maxTeachers: dto.maxTeachers,
      features: dto.features ? JSON.stringify(dto.features) : null,
      featuresAr: dto.featuresAr ? JSON.stringify(dto.featuresAr) : null,
      maxBookings: dto.maxBookings,
      maxCourses: dto.maxCourses,
      isActive: dto.isActive !== undefined ? dto.isActive : true,
      isPopular: dto.isPopular || false,
      createdBy: adminId,
    },
  });
  return parseFeatures({ ...pkg });
}

async function getAllPackages(activeOnly = false) {
  const where = activeOnly ? { isActive: true } : {};
  const packages = await prisma.studentSubscriptionPackage.findMany({ where, orderBy: [{ isPopular: 'desc' }, { price: 'asc' }] });
  return packages.map((p) => parseFeatures({ ...p }));
}

async function getPackageById(id) {
  const pkg = await prisma.studentSubscriptionPackage.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  return parseFeatures({ ...pkg });
}

async function updatePackage(id, dto) {
  const pkg = await prisma.studentSubscriptionPackage.findUnique({ where: { id } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  const data = {};
  if (dto.name !== undefined) data.name = dto.name;
  if (dto.nameAr !== undefined) data.nameAr = dto.nameAr;
  if (dto.description !== undefined) data.description = dto.description;
  if (dto.descriptionAr !== undefined) data.descriptionAr = dto.descriptionAr;
  if (dto.price !== undefined) data.price = dto.price;
  if (dto.duration !== undefined) data.duration = dto.duration;
  if (dto.durationMonths !== undefined) data.durationMonths = dto.durationMonths;
  if (dto.sessionsPerMonth !== undefined) data.totalSessions = dto.sessionsPerMonth;
  if (dto.totalSessions !== undefined) data.totalSessions = dto.totalSessions;
  if (dto.monthlyPrice !== undefined) data.monthlyPrice = dto.monthlyPrice;
  if (dto.yearlyPrice !== undefined) data.yearlyPrice = dto.yearlyPrice;
  if (dto.maxTeachers !== undefined) data.maxTeachers = dto.maxTeachers;
  if (dto.features !== undefined) data.features = JSON.stringify(dto.features);
  if (dto.featuresAr !== undefined) data.featuresAr = JSON.stringify(dto.featuresAr);
  if (dto.maxBookings !== undefined) data.maxBookings = dto.maxBookings;
  if (dto.maxCourses !== undefined) data.maxCourses = dto.maxCourses;
  if (dto.isActive !== undefined) data.isActive = dto.isActive;
  if (dto.isPopular !== undefined) data.isPopular = dto.isPopular;
  const updated = await prisma.studentSubscriptionPackage.update({ where: { id }, data });
  return parseFeatures({ ...updated });
}

async function deletePackage(id) {
  const pkg = await prisma.studentSubscriptionPackage.findUnique({ where: { id }, include: { _count: { select: { subscriptions: true } } } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  if (pkg._count.subscriptions > 0) throw Object.assign(new Error('Cannot delete package with active subscriptions'), { statusCode: 400 });
  await prisma.studentSubscriptionPackage.delete({ where: { id } });
  return { message: 'Package deleted' };
}

async function subscribe(studentId, dto) {
  const pkg = await prisma.studentSubscriptionPackage.findUnique({ where: { id: dto.packageId } });
  if (!pkg) throw Object.assign(new Error('Package not found'), { statusCode: 404 });
  if (!pkg.isActive) throw Object.assign(new Error('Package is not active'), { statusCode: 400 });

  const startDate = new Date();
  const endDate = new Date();
  const normalizedSlots = normalizeSelectedSlots(dto.selectedSlots);

  let teacher = null;
  if (dto.teacherId) {
    teacher = await prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      include: { schedules: { where: { isActive: true } } },
    });
    if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
    if (!teacher.isApproved) throw Object.assign(new Error('Teacher is not approved'), { statusCode: 400 });
    if (teacher.teacherType !== 'FULL_TEACHER') {
      throw Object.assign(new Error('Subscriptions for live sessions are only available with Quran sheikhs'), { statusCode: 400 });
    }
  }

  if (normalizedSlots.length > 0 && !dto.teacherId) {
    throw Object.assign(new Error('teacherId is required when selectedSlots are provided'), { statusCode: 400 });
  }

  if (normalizedSlots.length > 0) {
    for (const slot of normalizedSlots) {
      const slotStart = toMinutes(slot.startTime);
      const slotEnd = slotStart + SESSION_DURATION_MINUTES;
      const compatibleSchedule = (teacher?.schedules || []).find((s) => {
        if (s.dayOfWeek !== slot.dayOfWeek) return false;
        const scheduleStart = toMinutes(s.startTime);
        const scheduleEnd = toMinutes(s.endTime);
        return slotStart >= scheduleStart && slotEnd <= scheduleEnd;
      });
      if (!compatibleSchedule) {
        throw Object.assign(
          new Error(`Selected slot ${slot.dayName} ${slot.startTime} is not within teacher availability`),
          { statusCode: 400 }
        );
      }
    }
  }

  if (pkg.durationMonths) {
    endDate.setMonth(endDate.getMonth() + pkg.durationMonths);
  } else {
    endDate.setDate(endDate.getDate() + (pkg.duration || 30));
  }

  let generatedSlots = [];
  if (normalizedSlots.length > 0) {
    // Fetch existing bookings in range for optimization
    const existingBookings = await prisma.booking.findMany({
      where: {
        teacherId: dto.teacherId,
        date: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
      select: {
        date: true,
        startTime: true,
        duration: true,
      },
    });

    const slotDuration = SESSION_DURATION_MINUTES;
    const cursorDate = new Date(startDate);
    while (cursorDate <= endDate) {
      const dayOfWeek = cursorDate.getDay();
      const slotsForDay = normalizedSlots.filter((s) => s.dayOfWeek === dayOfWeek);
      for (const slot of slotsForDay) {
        const slotStart = toMinutes(slot.startTime);
        const slotEnd = slotStart + slotDuration;
        const slotDate = new Date(cursorDate);

        // Check for conflicts
        const conflict = existingBookings.find((b) => {
          const bDate = new Date(b.date);
          if (!sameDay(bDate, slotDate)) return false;
          const bStart = toMinutes(b.startTime);
          const bEnd = bStart + (b.duration || 30);
          return slotStart < bEnd && bStart < slotEnd;
        });

        if (conflict) {
          throw Object.assign(
            new Error(`Conflict found at ${slot.startTime} on ${slotDate.toDateString()}`),
            { statusCode: 409 }
          );
        }

        generatedSlots.push({
          date: slotDate,
          startTime: slot.startTime,
          dayOfWeek,
          dayName: DAY_NAMES[dayOfWeek],
        });
      }
      cursorDate.setDate(cursorDate.getDate() + 1);
    }
  }

  // Calculate Amount
  let amount = 0;
  if (pkg.price > 0) {
    amount = pkg.price;
    // If monthly/yearly logic applies, adjust here.
    // Current schema suggests pkg.price is main price.
    // If recurring, we might need monthlyPrice? Let's assume price is the upfront cost for now.
    if (dto.billingCount && pkg.monthlyPrice) { // Example logic if frontend sends billingCount
      amount = pkg.monthlyPrice * dto.billingCount;
    }
  }

  // Create Subscription as PENDING
  const subscription = await prisma.studentSubscription.create({
    data: {
      studentId,
      packageId: dto.packageId,
      teacherId: dto.teacherId,
      startDate,
      endDate,
      status: amount > 0 ? 'PENDING' : 'ACTIVE', // If free, activate immediately
      selectedSlots: normalizedSlots.length > 0 ? JSON.stringify(normalizedSlots) : null
    },
    include: { package: true, student: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });

  // Reserve selected slots for the whole package duration.
  // Paid subscriptions reserve as PENDING until webhook confirms payment.
  const bookingStatus = amount > 0 ? 'PENDING' : 'CONFIRMED';
  if (generatedSlots.length > 0) {
    const bookingData = generatedSlots.map(slot => ({
      studentId,
      teacherId: dto.teacherId,
      date: slot.date,
      startTime: slot.startTime,
      duration: SESSION_DURATION_MINUTES,
      status: bookingStatus,
      price: 0,
      totalPrice: 0,
      type: 'SUBSCRIPTION',
      subscriptionId: subscription.id
    }));

    await prisma.booking.createMany({ data: bookingData });
  }

  const reservation = {
    slotsPerWeek: normalizedSlots.length,
    totalReservedSessions: generatedSlots.length,
    bookingStatus,
  };

  if (amount > 0) {
    // Create Payment Record
    const paymentId = uuidv4();
    const merchantRefNum = paymentId; // Use payment ID as ref

    const paymentMethod = dto.paymentMethod || 'CARD';

    const payment = await prisma.payment.create({
      data: {
        id: paymentId,
        subscriptionId: subscription.id,
        amount: amount,
        currency: 'EGP',
        status: 'PENDING',
        merchantRefNum: merchantRefNum,
        paymentMethod: paymentMethod
      }
    });

    // Initiate Fawry Payment
    // Prioritize mobile from input (for wallet), then from profile
    const studentPhone = dto.mobileNumber || subscription.student.phone || '';

    // Ensure mobile number format is clean for Fawry (no spaces, etc.)
    const cleanMobile = String(studentPhone).replace(/\s+/g, '');

    const chargeRequest = fawryService.buildChargeRequest({
      merchantCode: process.env.FAWRY_MERCHANT_CODE,
      merchantRefNum: merchantRefNum,
      customerProfileId: studentId,
      customerName: `${subscription.student.firstName} ${subscription.student.lastName}`,
      customerMobile: cleanMobile,
      customerEmail: subscription.student.email,
      description: `Subscription to ${pkg.name}`,
      amount: amount,
      chargeItems: [
        {
          itemId: pkg.id,
          description: pkg.name,
          price: amount,
          quantity: 1
        }
      ],
      returnUrl: `${process.env.FRONTEND_URL || 'http://localhost:5173'}/student/subscriptions/callback?subscriptionId=${subscription.id}`,
      paymentMethod: paymentMethod,
      secureKey: process.env.FAWRY_SECURE_KEY
    });

    try {
      const fawryResponse = await fawryService.createCharge(chargeRequest);

      // Respond with Payment URL or Reference Number
      return {
        subscription,
        reservation,
        paymentUrl: fawryResponse.paymentUrl,
        referenceNumber: fawryResponse.referenceNumber,
        fawryRefNumber: fawryResponse.referenceNumber, // Sometimes called this way
        paymentId: payment.id,
        merchantRefNum: merchantRefNum, // Return this so frontend knows which ref to track
        expiresAt: fawryResponse.expiresAt,
        statusCode: fawryResponse.statusCode,
        statusDescription: fawryResponse.statusDescription
      };

    } catch (error) {
      // If payment initiation fails, maybe cancel subscription?
      // Keeping it PENDING allows retry.
      throw error;
    }
  }

  return {
    subscription,
    reservation,
  };
}

async function getMySubscriptions(studentId) {
  return prisma.studentSubscription.findMany({
    where: { studentId },
    include: { package: true },
    orderBy: { createdAt: 'desc' },
  });
}

async function getMyActive(studentId) {
  return prisma.studentSubscription.findFirst({
    where: { studentId, status: 'ACTIVE', endDate: { gte: new Date() } },
    include: { package: true },
  });
}

async function cancel(subscriptionId, studentId) {
  const sub = await prisma.studentSubscription.findUnique({ where: { id: subscriptionId } });
  if (!sub) throw Object.assign(new Error('Subscription not found'), { statusCode: 404 });
  if (sub.studentId !== studentId) throw Object.assign(new Error('Not authorized'), { statusCode: 403 });
  return prisma.studentSubscription.update({
    where: { id: subscriptionId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: studentId },
  });
}

async function getAllAdmin(page = 1, limit = 20, status) {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [subscriptions, total] = await Promise.all([
    prisma.studentSubscription.findMany({
      where,
      skip,
      take: limit,
      include: { package: true, student: { select: { id: true, firstName: true, lastName: true, email: true } } },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.studentSubscription.count({ where }),
  ]);
  return { subscriptions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

module.exports = { createPackage, getAllPackages, getPackageById, updatePackage, deletePackage, subscribe, getMySubscriptions, getMyActive, cancel, getAllAdmin };
