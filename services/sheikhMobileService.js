/**
 * Sheikh Mobile API Service
 * تطبيق الشيخ: تسجيل، دخول، ملف، طلابي، جلساتي، تقييم الجلسة (حفظ / مراجعة / تقرير)، محفظة، سحب.
 * تقييم الجلسة مطابق لصفحة الحجوزات في الداشبورد (memorization, revision, report).
 */
const bcrypt = require('bcrypt');
const jwtLib = require('../lib/jwt');
const { prisma } = require('../lib/prisma');
const sessionReportService = require('./sessionReportService');
const financeService = require('./financeService');
const sitePageService = require('./sitePageService');
const walletService = require('./walletService');

// ─── Helpers ─────────────────────────────────────────────────────────────────
async function getTeacherByUserId(userId) {
  return prisma.teacher.findUnique({
    where: { userId },
    include: {
      user: true,
      wallet: true,
      schedules: { orderBy: [{ dayOfWeek: 'asc' }, { startTime: 'asc' }] },
    },
  });
}

function parseSpecialties(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw;
  try { const parsed = JSON.parse(raw); if (Array.isArray(parsed)) return parsed; } catch {}
  return String(raw).split(',').map(s => s.trim()).filter(Boolean);
}

// ─── Auth ────────────────────────────────────────────────────────────────────
async function register(dto) {
  const email = (dto.email || '').trim().toLowerCase();
  const phone = (dto.phone || '').trim();
  const password = (dto.password || '').trim();
  const confirmPassword = (dto.confirmPassword || '').trim();

  if (!dto.name || !email || !password) {
    const err = new Error('Name, email and password are required');
    err.statusCode = 400;
    throw err;
  }
  if (!dto.experience && dto.experience !== 0) {
    const err = new Error('Experience (years) is required');
    err.statusCode = 400;
    throw err;
  }
  if (!dto.specialties || (Array.isArray(dto.specialties) ? dto.specialties.length === 0 : !String(dto.specialties).trim())) {
    const err = new Error('Specialties are required');
    err.statusCode = 400;
    throw err;
  }
  if (password !== confirmPassword) {
    const err = new Error('Password and confirm password do not match');
    err.statusCode = 400;
    throw err;
  }

  const existingEmail = await prisma.user.findUnique({ where: { email } });
  if (existingEmail) {
    const err = new Error('Email already registered');
    err.statusCode = 409;
    throw err;
  }
  if (phone) {
    const existingPhone = await prisma.user.findFirst({ where: { phone } });
    if (existingPhone) {
      const err = new Error('Phone already registered');
      err.statusCode = 409;
      throw err;
    }
  }

  const nameParts = (dto.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      firstName,
      lastName,
      phone: phone || undefined,
      role: 'TEACHER',
      status: 'ACTIVE',
    },
  });

  await prisma.teacher.create({
    data: {
      userId: user.id,
      hourlyRate: 0,
      isApproved: false,
    },
  });

  const payload = { sub: user.id, email: user.email, role: user.role };
  const token = jwtLib.sign(payload);

  return {
    success: true,
    message: 'Sheikh registered successfully — pending admin approval',
    data: {
      id: user.id,
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      phone: user.phone,
      token,
      isApproved: false,
    },
  };
}

async function login(dto) {
  const phone = (dto.phone || '').trim();
  const password = (dto.password || '').trim();

  if (!phone || !password) {
    const err = new Error('Phone and password are required');
    err.statusCode = 400;
    throw err;
  }

  const user = await prisma.user.findFirst({
    where: { phone, role: 'TEACHER' },
  });
  if (!user || !user.password) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is not active');
    err.statusCode = 401;
    throw err;
  }

  const teacherProfile = await prisma.teacher.findUnique({ where: { userId: user.id } });
  const isApproved = teacherProfile?.isApproved ?? false;

  const payload = { sub: user.id, email: user.email, role: user.role };
  const token = jwtLib.sign(payload);

  return {
    success: true,
    data: {
      token,
      isApproved,
      sheikh: {
        id: user.id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        email: user.email,
      },
    },
  };
}

// ─── Profile ───────────────────────────────────────────────────────────────────
async function getProfile(userId) {
  const teacher = await getTeacherByUserId(userId);
  if (!teacher) {
    const err = new Error('Sheikh profile not found');
    err.statusCode = 404;
    throw err;
  }
  const wallet = teacher.wallet || await walletService.getOrCreateWallet(teacher.id);
  const u = teacher.user;
  return {
    id: u.id,
    teacherId: teacher.id,
    firstName: u.firstName,
    firstNameAr: u.firstNameAr || '',
    lastName: u.lastName,
    lastNameAr: u.lastNameAr || '',
    name: `${u.firstName || ''} ${u.lastName || ''}`.trim(),
    nameAr: `${u.firstNameAr || ''} ${u.lastNameAr || ''}`.trim(),
    email: u.email,
    phone: u.phone,
    avatar: u.avatar || null,

    teacherType: teacher.teacherType,
    bio: teacher.bio || '',
    bioAr: teacher.bioAr || '',
    image: teacher.image || '',
    introVideoUrl: teacher.introVideoUrl || '',
    experience: teacher.experience ?? 0,
    hourlyRate: teacher.hourlyRate ?? 0,
    specialties: parseSpecialties(teacher.specialties),
    specialtiesAr: parseSpecialties(teacher.specialtiesAr),
    readingType: teacher.readingType || '',
    readingTypeAr: teacher.readingTypeAr || '',
    rating: teacher.rating ?? 0,
    totalReviews: teacher.totalReviews ?? 0,

    isApproved: teacher.isApproved ?? false,
    approvedAt: teacher.approvedAt || null,

    schedules: (teacher.schedules || []).map(s => ({
      id: s.id,
      dayOfWeek: s.dayOfWeek,
      startTime: String(s.startTime || '').slice(0, 5),
      endTime: String(s.endTime || '').slice(0, 5),
    })),

    totalHoursCompleted: wallet.totalHours ?? 0,
    walletBalance: wallet.balance ?? 0,
  };
}

async function updateProfile(userId, dto) {
  const teacher = await getTeacherByUserId(userId);
  if (!teacher) {
    const err = new Error('Sheikh profile not found');
    err.statusCode = 404;
    throw err;
  }

  // ── User fields ──
  const userUpdates = {};
  if (dto.name !== undefined) {
    const parts = String(dto.name).trim().split(' ');
    userUpdates.firstName = parts[0] || teacher.user.firstName;
    userUpdates.lastName = parts.slice(1).join(' ') || teacher.user.lastName;
  }
  if (dto.firstName !== undefined) userUpdates.firstName = String(dto.firstName).trim();
  if (dto.firstNameAr !== undefined) userUpdates.firstNameAr = String(dto.firstNameAr).trim();
  if (dto.lastName !== undefined) userUpdates.lastName = String(dto.lastName).trim();
  if (dto.lastNameAr !== undefined) userUpdates.lastNameAr = String(dto.lastNameAr).trim();
  if (dto.email !== undefined) userUpdates.email = String(dto.email).trim().toLowerCase();
  if (dto.phone !== undefined) userUpdates.phone = String(dto.phone).trim() || null;

  if (Object.keys(userUpdates).length) {
    await prisma.user.update({ where: { id: userId }, data: userUpdates });
  }

  // ── Teacher fields (hourlyRate excluded — admin only) ──
  const teacherUpdates = {};
  if (dto.bio !== undefined) teacherUpdates.bio = String(dto.bio).trim();
  if (dto.bioAr !== undefined) teacherUpdates.bioAr = String(dto.bioAr).trim();
  if (dto.image !== undefined) teacherUpdates.image = String(dto.image).trim();
  if (dto.introVideoUrl !== undefined) teacherUpdates.introVideoUrl = String(dto.introVideoUrl).trim();
  if (dto.experience !== undefined) teacherUpdates.experience = parseInt(dto.experience, 10) || 0;
  if (dto.readingType !== undefined) teacherUpdates.readingType = String(dto.readingType).trim();
  if (dto.readingTypeAr !== undefined) teacherUpdates.readingTypeAr = String(dto.readingTypeAr).trim();
  if (dto.specialties !== undefined) {
    const arr = Array.isArray(dto.specialties)
      ? dto.specialties
      : String(dto.specialties).split(',').map(s => s.trim()).filter(Boolean);
    teacherUpdates.specialties = JSON.stringify(arr);
  }
  if (dto.specialtiesAr !== undefined) {
    const arr = Array.isArray(dto.specialtiesAr)
      ? dto.specialtiesAr
      : String(dto.specialtiesAr).split(',').map(s => s.trim()).filter(Boolean);
    teacherUpdates.specialtiesAr = JSON.stringify(arr);
  }

  if (Object.keys(teacherUpdates).length) {
    await prisma.teacher.update({ where: { id: teacher.id }, data: teacherUpdates });
  }

  return getProfile(userId);
}

// ─── My Students ─────────────────────────────────────────────────────────────
async function getMyStudents(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];

  const subs = await prisma.studentSubscription.findMany({
    where: {
      teacherId: teacher.id,
      status: 'ACTIVE',
      paymentId: { not: null },
    },
    include: {
      student: { select: { id: true, firstName: true, lastName: true } },
      package: true,
      payment: { select: { status: true } },
    },
  });

  const paidSubs = subs.filter((s) => s.payment?.status === 'COMPLETED');
  const result = [];

  for (const sub of paidSubs) {
    const totalSessions = sub.package?.sessionsPerMonth ?? sub.package?.totalSessions ?? sub.package?.maxBookings ?? 0;
    const completedSessions = await prisma.bookingSession.count({
      where: {
        booking: { subscriptionId: sub.id },
        status: 'COMPLETED',
      },
    });
    const remainingSessions = Math.max(0, (totalSessions || 0) - completedSessions);
    const progressPercentage = totalSessions ? Math.round((completedSessions / totalSessions) * 100) : 0;

    result.push({
      studentId: sub.student.id,
      studentName: `${sub.student.firstName || ''} ${sub.student.lastName || ''}`.trim(),
      subscription: {
        packageName: sub.package?.name || sub.package?.nameAr || 'Package',
        totalSessions,
        completedSessions,
        remainingSessions,
        startDate: sub.startDate,
        endDate: sub.endDate,
      },
      progressPercentage,
    });
  }

  return result;
}

async function getStudentDetails(teacherId, studentId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  const sub = await prisma.studentSubscription.findFirst({
    where: { teacherId: teacher.id, studentId, status: 'ACTIVE' },
    include: {
      student: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } },
      package: true,
    },
  });
  if (!sub) {
    const err = new Error('Student not found or no active subscription');
    err.statusCode = 404;
    throw err;
  }

  const bookingSessions = await prisma.bookingSession.findMany({
    where: { booking: { subscriptionId: sub.id } },
    orderBy: [{ scheduledDate: 'desc' }, { startTime: 'desc' }],
    include: {
      session: {
        include: {
          report: true,
          memorizations: { orderBy: { createdAt: 'asc' } },
          revisions: { orderBy: { createdAt: 'asc' } },
        },
      },
      booking: true,
    },
  });

  const sessions = bookingSessions.map((bs) => {
    const s = bs.session;
    const report = s?.report;
    return {
      sessionId: s?.id || bs.id,
      date: bs.scheduledDate,
      time: bs.startTime,
      status: bs.status,
      meetingLink: s?.roomId ? `https://meet.example.com/${s.roomId}` : null,
      memorizations: (s?.memorizations || []).map((m) => ({
        id: m.id,
        surahName: m.surahName,
        surahNameAr: m.surahNameAr,
        fromAyah: m.fromAyah,
        toAyah: m.toAyah,
        isFullSurah: m.isFullSurah,
        notes: m.notes,
      })),
      revisions: (s?.revisions || []).map((r) => ({
        id: r.id,
        revisionType: r.revisionType,
        rangeType: r.rangeType,
        fromSurah: r.fromSurah,
        toSurah: r.toSurah,
        fromJuz: r.fromJuz,
        toJuz: r.toJuz,
        notes: r.notes,
      })),
      report: report ? { rating: report.rating, notes: report.content } : null,
    };
  });

  return {
    student: {
      id: sub.student.id,
      name: `${sub.student.firstName || ''} ${sub.student.lastName || ''}`.trim(),
    },
    subscription: {
      packageName: sub.package?.name,
      startDate: sub.startDate,
      endDate: sub.endDate,
    },
    sessions,
  };
}

// ─── Sessions ─────────────────────────────────────────────────────────────────
async function getTodaySessions(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const bookingSessions = await prisma.bookingSession.findMany({
    where: {
      booking: { teacherId: teacher.id },
      scheduledDate: { gte: today, lt: tomorrow },
    },
    orderBy: { startTime: 'asc' },
    include: {
      booking: { include: { student: { select: { firstName: true, lastName: true } } } },
      session: true,
    },
  });

  return bookingSessions.map((bs) => ({
    sessionId: bs.session?.id || bs.id,
    studentName: `${bs.booking.student?.firstName || ''} ${bs.booking.student?.lastName || ''}`.trim(),
    time: bs.startTime,
    meetingLink: bs.session?.roomId ? `https://meet.example.com/${bs.session.roomId}` : null,
    status: bs.status?.toLowerCase() || 'scheduled',
  }));
}

async function getMySessions(teacherId, limit = 100) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) return [];

  const bookingSessions = await prisma.bookingSession.findMany({
    where: { booking: { teacherId: teacher.id } },
    orderBy: [{ scheduledDate: 'desc' }, { startTime: 'desc' }],
    take: limit,
    include: {
      booking: { include: { student: { select: { firstName: true, lastName: true } } } },
      session: true,
    },
  });

  return bookingSessions.map((bs) => ({
    sessionId: bs.session?.id || bs.id,
    studentName: `${bs.booking.student?.firstName || ''} ${bs.booking.student?.lastName || ''}`.trim(),
    date: bs.scheduledDate,
    time: bs.startTime,
    meetingLink: bs.session?.roomId ? `https://meet.example.com/${bs.session.roomId}` : null,
    status: bs.status?.toLowerCase() || 'scheduled',
  }));
}

// ─── Session evaluation (حفظ، مراجعة، تقرير) ─────────────────────────────────
/**
 * تأكد أن الشيخ يملك الجلسة.
 * يدعم البحث بـ Session.id أو BookingSession.id
 * (بعض الجلسات لها BookingSession فقط بدون سجل Session بعد).
 */
async function ensureSessionAccess(teacherId, sessionId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }

  // Try finding by Session.id first
  let session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { bookingSession: { include: { booking: true } } },
  });

  if (session) {
    if (session.bookingSession?.booking?.teacherId !== teacher.id) {
      const err = new Error('Session not found or access denied');
      err.statusCode = 404;
      throw err;
    }
    return { teacher, session, booking: session.bookingSession?.booking };
  }

  // Fallback: sessionId might be a BookingSession.id (no live Session record yet)
  const bs = await prisma.bookingSession.findUnique({
    where: { id: sessionId },
    include: { booking: true, session: true },
  });
  if (!bs || bs.booking?.teacherId !== teacher.id) {
    const err = new Error('Session not found or access denied');
    err.statusCode = 404;
    throw err;
  }

  // If the BookingSession has a linked Session, use it
  if (bs.session) {
    session = await prisma.session.findUnique({
      where: { id: bs.session.id },
      include: { bookingSession: { include: { booking: true } } },
    });
    return { teacher, session, booking: bs.booking };
  }

  // Auto-create a Session record so memorization/revision/report can be saved
  const { v4: uuidv4 } = require('uuid');
  session = await prisma.session.create({
    data: {
      bookingSessionId: bs.id,
      type: 'VIDEO',
      roomId: `room-${uuidv4()}`,
    },
    include: { bookingSession: { include: { booking: true } } },
  });

  return { teacher, session, booking: bs.booking };
}

/**
 * تفاصيل الجلسة الكاملة: حفظ، مراجعة، تقرير (مطابق لصفحة الحجوزات في الداشبورد).
 * يرجع تنسيقاً منظماً للموبايل: الطالب، الحفظ، المراجعة، التقرير.
 */
async function getSessionDetails(teacherId, sessionId) {
  const { session: resolvedSession } = await ensureSessionAccess(teacherId, sessionId);
  const raw = await sessionReportService.getSessionDetails(resolvedSession.id);
  if (!raw) return null;

  const bs = raw.bookingSession;
  const booking = bs?.booking;
  const student = booking?.student;

  return {
    sessionId: raw.id,
    roomId: raw.roomId,
    scheduledDate: bs?.scheduledDate,
    startTime: bs?.startTime,
    endTime: bs?.endTime,
    status: bs?.status,
    duration: raw.duration,
    startedAt: raw.startedAt,
    endedAt: raw.endedAt,
    student: student
      ? {
          id: student.id,
          name: `${student.firstName || ''} ${student.lastName || ''}`.trim(),
          email: student.email,
          phone: student.phone,
        }
      : null,
    memorizations: (raw.memorizations || []).map((m) => ({
      id: m.id,
      surahName: m.surahName,
      surahNameAr: m.surahNameAr,
      surahNumber: m.surahNumber,
      fromAyah: m.fromAyah,
      toAyah: m.toAyah,
      isFullSurah: Boolean(m.isFullSurah),
      notes: m.notes,
      createdAt: m.createdAt,
    })),
    revisions: (raw.revisions || []).map((r) => ({
      id: r.id,
      revisionType: r.revisionType,
      rangeType: r.rangeType,
      fromSurah: r.fromSurah,
      toSurah: r.toSurah,
      fromJuz: r.fromJuz,
      toJuz: r.toJuz,
      fromQuarter: r.fromQuarter,
      toQuarter: r.toQuarter,
      notes: r.notes,
      createdAt: r.createdAt,
    })),
    report: raw.report
      ? {
          id: raw.report.id,
          rating: raw.report.rating,
          content: raw.report.content,
          createdAt: raw.report.createdAt,
        }
      : null,
  };
}

/** إضافة حفظ جديد للجلسة */
async function addMemorization(teacherId, sessionId, dto) {
  const { session: s } = await ensureSessionAccess(teacherId, sessionId);
  const record = await sessionReportService.saveMemorization(s.id, {
    surahName: dto.surahName,
    surahNameAr: dto.surahNameAr || null,
    surahNumber: dto.surahNumber,
    fromAyah: dto.fromAyah,
    toAyah: dto.toAyah,
    isFullSurah: Boolean(dto.isFullSurah),
    notes: dto.notes || null,
  });
  return record;
}

/** إضافة مراجعة للجلسة */
async function addRevision(teacherId, sessionId, dto) {
  const { session: s } = await ensureSessionAccess(teacherId, sessionId);
  const record = await sessionReportService.saveRevision(s.id, {
    revisionType: dto.revisionType || 'CLOSE',
    rangeType: dto.rangeType || 'SURAH',
    fromSurah: dto.fromSurah || null,
    toSurah: dto.toSurah || null,
    fromJuz: dto.fromJuz,
    toJuz: dto.toJuz,
    fromQuarter: dto.fromQuarter || null,
    toQuarter: dto.toQuarter || null,
    notes: dto.notes || null,
  });
  return record;
}

/** إضافة/تحديث تقرير الجلسة (تقييم + ملاحظات) */
async function addSessionReport(teacherId, sessionId, dto) {
  const { teacher, session: s, booking } = await ensureSessionAccess(teacherId, sessionId);
  const studentId = booking?.studentId;
  if (!studentId) {
    const err = new Error('Student not found for this session');
    err.statusCode = 400;
    throw err;
  }
  await sessionReportService.saveReport(s.id, teacher.id, studentId, {
    content: dto.content ?? dto.notes ?? '',
    rating: dto.rating,
  });
  return { success: true, message: 'Report saved' };
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
async function getWallet(userId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }
  const wallet = await walletService.getOrCreateWallet(teacher.id);
  const pending = await prisma.payoutRequest.aggregate({
    where: { teacherId: teacher.id, status: 'PENDING' },
    _sum: { amount: true },
  });
  const withdrawHistory = await prisma.payoutRequest.findMany({
    where: { teacherId: teacher.id },
    orderBy: { requestedAt: 'desc' },
    take: 50,
  });

  const teacherProfile = await prisma.teacher.findUnique({
    where: { id: teacher.id },
    select: { hourlyRate: true },
  });
  return {
    hourPrice: teacherProfile?.hourlyRate ?? 0,
    totalCompletedHours: wallet.totalHours ?? 0,
    totalEarned: wallet.totalEarned ?? 0,
    availableBalance: wallet.balance ?? 0,
    pendingWithdraw: pending._sum?.amount ?? 0,
    withdrawHistory: withdrawHistory.map((w) => ({
      amount: w.amount,
      status: w.status?.toLowerCase(),
      date: w.requestedAt,
    })),
  };
}

async function requestWithdraw(userId, amount) {
  const teacher = await prisma.teacher.findUnique({ where: { userId } });
  if (!teacher) {
    const err = new Error('Teacher not found');
    err.statusCode = 404;
    throw err;
  }
  const pending = await prisma.payoutRequest.findFirst({
    where: { teacherId: teacher.id, status: 'PENDING' },
  });
  if (pending) {
    const err = new Error('You already have a pending withdraw request');
    err.statusCode = 400;
    throw err;
  }
  return financeService.createPayoutRequest(userId, { amount: parseFloat(amount) || 0 });
}

// ─── Account & Static pages ───────────────────────────────────────────────────
async function deleteAccount(userId) {
  await prisma.user.update({
    where: { id: userId },
    data: { status: 'INACTIVE' },
  });
  return { success: true, message: 'Account deleted' };
}

async function getAbout() {
  const page = await sitePageService.getBySlug('app');
  return page || { title: 'About', body: '', bodyAr: null };
}

async function getPrivacyPolicy() {
  const page = await sitePageService.getBySlug('privacy');
  return page || { title: 'Privacy Policy', body: '', bodyAr: null };
}

module.exports = {
  register,
  login,
  getProfile,
  updateProfile,
  getMyStudents,
  getStudentDetails,
  getTodaySessions,
  getMySessions,
  getSessionDetails,
  addMemorization,
  addRevision,
  addSessionReport,
  getWallet,
  requestWithdraw,
  deleteAccount,
  getAbout,
  getPrivacyPolicy,
};
