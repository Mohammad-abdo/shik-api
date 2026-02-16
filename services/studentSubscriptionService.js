const { prisma } = require('../lib/prisma');
const fawryService = require('./fawry');
const { v4: uuidv4 } = require('uuid');

function parseFeatures(pkg) {
  if (pkg.features && typeof pkg.features === 'string') pkg.features = JSON.parse(pkg.features);
  if (pkg.featuresAr && typeof pkg.featuresAr === 'string') pkg.featuresAr = JSON.parse(pkg.featuresAr);
  return pkg;
}

async function createPackage(dto, adminId) {
  const pkg = await prisma.studentSubscriptionPackage.create({
    data: {
      name: dto.name,
      nameAr: dto.nameAr,
      description: dto.description,
      descriptionAr: dto.descriptionAr,
      price: dto.price,
      duration: dto.duration || 30,
      durationMonths: dto.durationMonths,
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

  const startDate = new Date();
  const endDate = new Date();

  let validSlots = [];

  if (pkg.durationMonths && dto.selectedSlots && dto.selectedSlots.length > 0) {
    if (!dto.teacherId) throw Object.assign(new Error('Teacher is required for this package'), { statusCode: 400 });

    endDate.setMonth(endDate.getMonth() + pkg.durationMonths);

    // Fetch existing bookings in range for optimization
    const existingBookings = await prisma.booking.findMany({
      where: {
        teacherId: dto.teacherId,
        date: { gte: startDate, lte: endDate },
        status: { notIn: ['CANCELLED', 'REJECTED'] }
      }
    });

    // Validate slots and generate booking dates
    const dayMap = { 'SUNDAY': 0, 'MONDAY': 1, 'TUESDAY': 2, 'WEDNESDAY': 3, 'THURSDAY': 4, 'FRIDAY': 5, 'SATURDAY': 6 };
    const toMinutes = (time) => {
      const [h, m] = time.split(':').map(Number);
      return h * 60 + m;
    };

    let currentDate = new Date(startDate);
    while (currentDate <= endDate) {
      const dayName = Object.keys(dayMap).find(key => dayMap[key] === currentDate.getDay());
      const slotsForDay = dto.selectedSlots.filter(s => s.dayOfWeek === dayName);

      for (const slot of slotsForDay) {
        const slotDate = new Date(currentDate);
        const slotStart = toMinutes(slot.startTime);
        const slotDuration = pkg.duration || 30;
        const slotEnd = slotStart + slotDuration;

        // Check for conflicts
        const conflict = existingBookings.find(b => {
          const bDate = new Date(b.date);
          if (bDate.getDate() !== slotDate.getDate() || bDate.getMonth() !== slotDate.getMonth() || bDate.getFullYear() !== slotDate.getFullYear()) {
            return false;
          }
          const bStart = toMinutes(b.startTime);
          const bEnd = bStart + (b.duration || 30);
          return (slotStart < bEnd) && (bStart < slotEnd);
        });

        if (conflict) {
          throw Object.assign(new Error(`Conflict found at ${slot.startTime} on ${currentDate.toDateString()}`), { statusCode: 409 });
        }

        validSlots.push({
          date: slotDate,
          startTime: slot.startTime,
          dayOfWeek: slot.dayOfWeek
        });
      }
      currentDate.setDate(currentDate.getDate() + 1);
    }
  } else {
    endDate.setDate(endDate.getDate() + (pkg.duration || 30));
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
      selectedSlots: dto.selectedSlots ? JSON.stringify(dto.selectedSlots) : null
    },
    include: { package: true, student: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } } },
  });

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

  // If Free or Amount 0
  if (validSlots.length > 0) {
    // Create Bookings
    const bookingData = validSlots.map(slot => ({
      studentId,
      teacherId: dto.teacherId,
      date: slot.date,
      startTime: slot.startTime,
      duration: pkg.duration || 60, // Default duration if not specified
      status: 'CONFIRMED', // Automatically confirmed? or PENDING?
      price: 0,
      totalPrice: 0,
      type: 'SUBSCRIPTION', // Use new enum value
      subscriptionId: subscription.id
    }));

    await prisma.booking.createMany({ data: bookingData });
  }

  return { subscription };
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
