const { prisma } = require('../lib/prisma');
const DAY_NAMES_EN = ['SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY'];

function parseDateRange(startDate, endDate) {
  const dateOnlyRegex = /^\d{4}-\d{2}-\d{2}$/;

  const parseOne = (value, endOfDay = false) => {
    if (!value) return null;
    if (dateOnlyRegex.test(value)) {
      return new Date(`${value}T${endOfDay ? '23:59:59.999' : '00:00:00.000'}Z`);
    }
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  };

  const startAt = parseOne(startDate, false);
  const endAt = parseOne(endDate, true);

  if (!startAt || !endAt) {
    throw Object.assign(new Error('Invalid startDate or endDate format'), { statusCode: 400 });
  }
  if (startAt > endAt) {
    throw Object.assign(new Error('startDate must be earlier than or equal to endDate'), { statusCode: 400 });
  }
  return { startAt, endAt };
}

function normalizeTime(value) {
  if (!value) return value;
  return String(value).slice(0, 5);
}

function parseTimeToMinutes(value) {
  const time = normalizeTime(value);
  if (!/^\d{2}:\d{2}$/.test(time)) return null;
  const [h, m] = time.split(':').map(Number);
  if (h < 0 || h > 23 || m < 0 || m > 59) return null;
  return h * 60 + m;
}

function normalizeSlotsPayload(dto) {
  if (Array.isArray(dto?.slots)) return dto.slots;
  return [dto];
}

function validateSlot(slot) {
  const dayOfWeek = Number(slot?.dayOfWeek);
  const startTime = normalizeTime(slot?.startTime);
  const endTime = normalizeTime(slot?.endTime);

  if (!Number.isInteger(dayOfWeek) || dayOfWeek < 0 || dayOfWeek > 6) {
    throw Object.assign(new Error('dayOfWeek must be an integer from 0 to 6'), { statusCode: 400 });
  }

  const startMinutes = parseTimeToMinutes(startTime);
  const endMinutes = parseTimeToMinutes(endTime);
  if (startMinutes === null || endMinutes === null) {
    throw Object.assign(new Error('startTime and endTime must be in HH:MM format'), { statusCode: 400 });
  }
  if (endMinutes <= startMinutes) {
    throw Object.assign(new Error('endTime must be greater than startTime'), { statusCode: 400 });
  }

  return { dayOfWeek, startTime, endTime, startMinutes, endMinutes };
}

async function findAll(filters = {}) {
  const where = { isApproved: filters.isApproved !== undefined ? filters.isApproved : true };
  if (filters.minRating != null) where.rating = { gte: filters.minRating };
  if (filters.search) {
    where.user = {
      OR: [
        { firstName: { contains: filters.search } },
        { lastName: { contains: filters.search } },
      ],
    };
  }
  let teachers = await prisma.teacher.findMany({
    where,
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true } },
      schedules: { where: { isActive: true } },
      _count: { select: { reviews: true, bookings: true } },
    },
    orderBy: { rating: 'desc' },
  });
  if (filters.specialties && filters.specialties.length > 0) {
    teachers = teachers.filter((t) => {
      if (!t.specialties) return false;
      const arr = typeof t.specialties === 'string' ? JSON.parse(t.specialties) : t.specialties;
      return filters.specialties.some((s) => (Array.isArray(arr) ? arr.includes(s) : false));
    });
  }
  return teachers;
}

async function findOne(id) {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true, phone: true, language: true } },
      schedules: { where: { isActive: true } },
      reviews: {
        include: { student: { select: { id: true, firstName: true, lastName: true, avatar: true } } },
      },
      _count: { select: { reviews: true, bookings: true } },
    },
  });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  return teacher;
}

async function create(userId, dto) {
  const existing = await prisma.teacher.findUnique({ where: { userId } });
  if (existing) throw Object.assign(new Error('Teacher profile already exists'), { statusCode: 409 });
  const teacher = await prisma.teacher.create({
    data: {
      userId,
      bio: dto.bio,
      bioAr: dto.bioAr,
      image: dto.image,
      experience: dto.experience,
      hourlyRate: dto.hourlyRate || 0,
      specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
      specialtiesAr: dto.specialtiesAr ? JSON.stringify(dto.specialtiesAr) : null,
      readingType: dto.readingType,
      readingTypeAr: dto.readingTypeAr,
      introVideoUrl: dto.introVideoUrl,
      canIssueCertificates: dto.canIssueCertificates || false,
    },
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
  });
  return teacher;
}

async function update(teacherId, userId, dto) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (teacher.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  const data = {};
  if (dto.bio !== undefined) data.bio = dto.bio;
  if (dto.bioAr !== undefined) data.bioAr = dto.bioAr;
  if (dto.image !== undefined) data.image = dto.image;
  if (dto.experience !== undefined) data.experience = dto.experience;
  if (dto.hourlyRate !== undefined) data.hourlyRate = dto.hourlyRate;
  if (dto.specialties !== undefined) data.specialties = typeof dto.specialties === 'string' ? dto.specialties : JSON.stringify(dto.specialties || []);
  if (dto.specialtiesAr !== undefined) data.specialtiesAr = typeof dto.specialtiesAr === 'string' ? dto.specialtiesAr : JSON.stringify(dto.specialtiesAr || []);
  if (dto.readingType !== undefined) data.readingType = dto.readingType;
  if (dto.readingTypeAr !== undefined) data.readingTypeAr = dto.readingTypeAr;
  if (dto.introVideoUrl !== undefined) data.introVideoUrl = dto.introVideoUrl;
  if (dto.canIssueCertificates !== undefined) data.canIssueCertificates = dto.canIssueCertificates;
  return prisma.teacher.update({
    where: { id: teacherId },
    data,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } } },
  });
}

async function approveTeacher(id, adminId) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const updated = await prisma.teacher.update({
    where: { id },
    data: { isApproved: true, approvedAt: new Date(), approvedBy: adminId },
    include: { user: true },
  });
  // Ensure wallet exists when teacher is accepted (e.g. if they registered before being approved)
  await prisma.teacherWallet.upsert({
    where: { teacherId: id },
    create: { teacherId: id, balance: 0, pendingBalance: 0, totalEarned: 0 },
    update: {},
  });
  return updated;
}

async function rejectTeacher(id) {
  const teacher = await prisma.teacher.findUnique({ where: { id } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  return prisma.teacher.delete({ where: { id } });
}

async function createSchedule(teacherId, userId, dto) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  if (teacher.userId !== userId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Schedules are only available for Quran sheikhs (FULL_TEACHER)'), { statusCode: 400 });
  }
  return prisma.schedule.create({
    data: {
      teacherId,
      dayOfWeek: dto.dayOfWeek,
      startTime: dto.startTime,
      endTime: dto.endTime,
    },
  });
}

async function createMySchedules(userId, dto) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) throw Object.assign(new Error('Teacher profile not found'), { statusCode: 404 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Schedules are only available for Quran sheikhs (FULL_TEACHER)'), { statusCode: 400 });
  }

  const rawSlots = normalizeSlotsPayload(dto).filter(Boolean);
  if (rawSlots.length === 0) {
    throw Object.assign(new Error('At least one schedule slot is required'), { statusCode: 400 });
  }

  const validatedSlots = rawSlots.map(validateSlot);

  const existingSchedules = await prisma.schedule.findMany({
    where: { teacherId: teacher.id, isActive: true },
    select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
  });

  const existingByDay = new Map();
  for (const s of existingSchedules) {
    const list = existingByDay.get(s.dayOfWeek) || [];
    list.push({
      startMinutes: parseTimeToMinutes(s.startTime),
      endMinutes: parseTimeToMinutes(s.endTime),
    });
    existingByDay.set(s.dayOfWeek, list);
  }

  const toCreate = [];
  for (const slot of validatedSlots) {
    const overlapsExisting = (existingByDay.get(slot.dayOfWeek) || []).some(
      (s) => slot.startMinutes < s.endMinutes && slot.endMinutes > s.startMinutes
    );
    if (overlapsExisting) {
      throw Object.assign(
        new Error(`Slot overlaps existing schedule on day ${slot.dayOfWeek}: ${slot.startTime}-${slot.endTime}`),
        { statusCode: 409 }
      );
    }
    toCreate.push({ teacherId: teacher.id, dayOfWeek: slot.dayOfWeek, startTime: slot.startTime, endTime: slot.endTime });
  }

  for (let i = 0; i < toCreate.length; i += 1) {
    for (let j = i + 1; j < toCreate.length; j += 1) {
      if (toCreate[i].dayOfWeek !== toCreate[j].dayOfWeek) continue;
      const aStart = parseTimeToMinutes(toCreate[i].startTime);
      const aEnd = parseTimeToMinutes(toCreate[i].endTime);
      const bStart = parseTimeToMinutes(toCreate[j].startTime);
      const bEnd = parseTimeToMinutes(toCreate[j].endTime);
      if (aStart < bEnd && aEnd > bStart) {
        throw Object.assign(new Error('Provided slots must not overlap each other'), { statusCode: 409 });
      }
    }
  }

  const created = [];
  await prisma.$transaction(async (tx) => {
    for (const row of toCreate) {
      const schedule = await tx.schedule.create({ data: row });
      created.push(schedule);
    }
  });

  return {
    teacherId: teacher.id,
    createdCount: created.length,
    schedules: created,
  };
}

async function updateSchedule(scheduleId, teacherId, userId, dto) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { teacher: true },
  });
  if (!schedule) throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  return prisma.schedule.update({
    where: { id: scheduleId },
    data: {
      ...(dto.dayOfWeek !== undefined && { dayOfWeek: dto.dayOfWeek }),
      ...(dto.startTime !== undefined && { startTime: dto.startTime }),
      ...(dto.endTime !== undefined && { endTime: dto.endTime }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    },
  });
}

async function deleteSchedule(scheduleId, teacherId, userId) {
  const schedule = await prisma.schedule.findUnique({
    where: { id: scheduleId },
    include: { teacher: true },
  });
  if (!schedule) throw Object.assign(new Error('Schedule not found'), { statusCode: 404 });
  if (schedule.teacher.userId !== userId || schedule.teacherId !== teacherId) throw Object.assign(new Error('Forbidden'), { statusCode: 403 });
  await prisma.schedule.delete({ where: { id: scheduleId } });
  return { message: 'Schedule deleted successfully' };
}

async function getAvailability(teacherId, startDate, endDate) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const { startAt, endAt } = parseDateRange(startDate, endDate);

  const schedules = await prisma.schedule.findMany({
    where: { teacherId, isActive: true },
    orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }],
  });

  const bookings = await prisma.booking.findMany({
    where: {
      teacherId,
      status: { notIn: ['CANCELLED', 'REJECTED'] },
      date: {
        gte: startAt,
        lte: endAt,
      },
    },
    select: {
      id: true,
      date: true,
      startTime: true,
      duration: true,
      status: true,
    },
    orderBy: [{ date: 'asc' }, { startTime: 'asc' }],
  });

  const normalizedSchedules = schedules.map((s) => ({
    ...s,
    dayName: DAY_NAMES_EN[s.dayOfWeek],
    startTime: normalizeTime(s.startTime),
    endTime: normalizeTime(s.endTime),
  }));

  const normalizedBookings = bookings.map((b) => {
    const bookingDate = new Date(b.date);
    const dayOfWeek = bookingDate.getUTCDay();
    return {
      ...b,
      date: bookingDate,
      startTime: normalizeTime(b.startTime),
      dayOfWeek,
      dayName: DAY_NAMES_EN[dayOfWeek],
    };
  });

  const availabilityByDay = DAY_NAMES_EN.map((name, dayOfWeek) => {
    const daySchedules = normalizedSchedules.filter((s) => s.dayOfWeek === dayOfWeek);
    const dayBookings = normalizedBookings.filter((b) => b.dayOfWeek === dayOfWeek);
    return {
      dayOfWeek,
      dayName: name,
      schedules: daySchedules,
      bookings: dayBookings,
      isAvailable: daySchedules.length > 0,
    };
  });

  return {
    range: { startDate: startAt, endDate: endAt },
    schedules: normalizedSchedules,
    bookings: normalizedBookings,
    availabilityByDay,
  };
}

module.exports = {
  findAll,
  findOne,
  create,
  update,
  approveTeacher,
  rejectTeacher,
  createSchedule,
  createMySchedules,
  updateSchedule,
  deleteSchedule,
  getAvailability,
};
