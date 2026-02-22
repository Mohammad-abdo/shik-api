const { prisma } = require('../lib/prisma');
const teacherService = require('./teacherService');

const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayName(dayOfWeek, lang) {
  const names = lang === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;
  return names[dayOfWeek] || names[0];
}

function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

function timeToMinutes(value) {
  const time = normalizeTime(value);
  const [h, m] = time.split(':').map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null;
  return (h * 60) + m;
}

function minutesToTime(minutes) {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}

function sameUtcDate(a, b) {
  return a.getUTCFullYear() === b.getUTCFullYear()
    && a.getUTCMonth() === b.getUTCMonth()
    && a.getUTCDate() === b.getUTCDate();
}

function subtractBusyIntervals(scheduleInterval, busyIntervals) {
  let free = [scheduleInterval];
  for (const busy of busyIntervals) {
    const nextFree = [];
    for (const current of free) {
      if (busy.start >= current.end || busy.end <= current.start) {
        nextFree.push(current);
        continue;
      }
      if (busy.start > current.start) {
        nextFree.push({ start: current.start, end: busy.start });
      }
      if (busy.end < current.end) {
        nextFree.push({ start: busy.end, end: current.end });
      }
    }
    free = nextFree;
    if (free.length === 0) break;
  }
  return free.filter((i) => i.end > i.start);
}

function teacherToSheikhListItem(teacher, lang) {
  const name = lang === 'ar'
    ? [teacher.user?.firstNameAr, teacher.user?.lastNameAr].filter(Boolean).join(' ').trim() ||
      [teacher.user?.firstName, teacher.user?.lastName].filter(Boolean).join(' ').trim()
    : [teacher.user?.firstName, teacher.user?.lastName].filter(Boolean).join(' ').trim();
  const title = lang === 'ar' ? (teacher.specialtiesAr || teacher.specialties || 'مقرئ ومحفظ قرآن كريم') : (teacher.specialties || 'Quran reciter and memorization');
  const specialization = lang === 'ar' ? (teacher.specialtiesAr || teacher.specialties || '—') : (teacher.specialties || teacher.specialtiesAr || '—');
  const recitation_style = lang === 'ar' ? (teacher.readingTypeAr || teacher.readingType || 'حفص') : (teacher.readingType || 'Hafs');
  const teaching_type = lang === 'ar' ? 'بنين وبنات' : 'Male & Female'; // placeholder - can add to Teacher later
  const rate = teacher.hourlyRate || 0;
  const starting_price = lang === 'ar' ? `${rate} EGP / حصة` : `${rate} EGP / session`;

  return {
    id: teacher.id,
    name: name || '—',
    title,
    specialization,
    image: teacher.image || teacher.user?.avatar || null,
    rating: teacher.rating ?? 0,
    recitation_style,
    teaching_type,
    starting_price,
    intro_video_url: teacher.introVideoUrl || null,
  };
}

function buildPackagesFromSchedules(schedules, teacher, lang) {
  if (!schedules || schedules.length === 0) {
    const rate = teacher.hourlyRate || 0;
    return [{
      id: `pkg_${teacher.id}_default`,
      days: [],
      time: '—',
      monthly_price: `${rate * 4} EGP`,
      session_price: `${rate} EGP`,
      currency: 'EGP',
      allowed_payment_types: ['monthly', 'per_session'],
    }];
  }
  const bySlot = {};
  for (const s of schedules) {
    const key = `${s.startTime}-${s.endTime}`;
    if (!bySlot[key]) bySlot[key] = { startTime: s.startTime, endTime: s.endTime, days: [] };
    bySlot[key].days.push(lang === 'ar' ? getDayName(s.dayOfWeek, 'ar') : getDayName(s.dayOfWeek, 'en'));
  }
  const teacherId = schedules[0].teacherId;
  const rate = teacher.hourlyRate || 0;
  return Object.entries(bySlot).map(([key, slot], i) => ({
    id: `pkg_${teacherId}_${i}`,
    days: slot.days,
    time: `${slot.startTime} - ${slot.endTime}`,
    monthly_price: `${rate * 4} EGP`,
    session_price: rate ? `${rate} EGP` : null,
    currency: 'EGP',
    allowed_payment_types: ['monthly', 'per_session'],
  }));
}

async function isStudentSubscribedToTeacher(studentId, teacherId) {
  const count = await prisma.booking.count({
    where: {
      studentId,
      teacherId,
      status: { in: ['CONFIRMED', 'COMPLETED'] },
    },
  });
  return count > 0;
}

async function getSheikhs(page = 1, limit = 10, search, lang = 'en') {
  const skip = (page - 1) * limit;
  const where = { isApproved: true, teacherType: 'FULL_TEACHER' };
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { firstNameAr: { contains: search } },
        { lastNameAr: { contains: search } },
      ],
    };
  }
  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
      },
      orderBy: { rating: 'desc' },
    }),
    prisma.teacher.count({ where }),
  ]);

  const sheikhs = teachers.map((t) => teacherToSheikhListItem(t, lang));
  return {
    sheikhs,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / limit) || 1,
      total_items: total,
    },
  };
}

/**
 * جلب المشايخ العاديين الذين يمكن الحجز معهم (FULL_TEACHER) — استبعاد مشايخ الدورات فقط (COURSE_SHEIKH).
 * Returns bookable sheikhs (ordinary teachers), excluding course-only sheikhs.
 */
async function getBookableSheikhsNotInCourses(page = 1, limit = 10, search, lang = 'en') {
  const skip = (page - 1) * limit;
  const where = {
    isApproved: true,
    teacherType: 'FULL_TEACHER',
  };
  if (search) {
    where.user = {
      OR: [
        { firstName: { contains: search } },
        { lastName: { contains: search } },
        { firstNameAr: { contains: search } },
        { lastNameAr: { contains: search } },
      ],
    };
  }
  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
      },
      orderBy: { rating: 'desc' },
    }),
    prisma.teacher.count({ where }),
  ]);

  const sheikhs = teachers.map((t) => teacherToSheikhListItem(t, lang));
  return {
    sheikhs,
    pagination: {
      current_page: page,
      total_pages: Math.ceil(total / limit) || 1,
      total_items: total,
    },
  };
}

async function getSheikhById(id, studentId, lang = 'en') {
  const teacher = await prisma.teacher.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true, language: true } },
      schedules: { where: { isActive: true } },
      _count: { select: { reviews: true, bookings: true } },
    },
  });
  if (!teacher) throw Object.assign(new Error('Sheikh not found'), { statusCode: 404 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('This profile is a course sheikh, not a Quran live-session sheikh'), { statusCode: 400 });
  }

  const name = lang === 'ar'
    ? [teacher.user?.firstNameAr, teacher.user?.lastNameAr].filter(Boolean).join(' ').trim() ||
      [teacher.user?.firstName, teacher.user?.lastName].filter(Boolean).join(' ').trim()
    : [teacher.user?.firstName, teacher.user?.lastName].filter(Boolean).join(' ').trim();
  const bio = lang === 'ar' ? (teacher.bioAr || teacher.bio) : (teacher.bio || teacher.bioAr);
  const recitation_style = lang === 'ar' ? (teacher.readingTypeAr || teacher.readingType) : (teacher.readingType || teacher.readingTypeAr);
  const teaching_type = lang === 'ar' ? 'بنين وبنات' : 'Male & Female';

  const is_subscribed = studentId ? await isStudentSubscribedToTeacher(studentId, teacher.id) : false;
  const packages = buildPackagesFromSchedules(teacher.schedules, teacher, lang);

  const reviewsSummary = await prisma.review.aggregate({
    where: { teacherId: teacher.id },
    _count: true,
    _avg: { rating: true },
  });

  const base = {
    id: teacher.id,
    name: name || '—',
    bio: bio || '',
    video_url: teacher.introVideoUrl || null,
    image: teacher.image || teacher.user?.avatar || null,
    rating: teacher.rating ?? 0,
    experience_years: teacher.experience ?? 0,
    students_count: teacher._count.bookings || 0,
    recitation_style: recitation_style || '—',
    teaching_type,
    is_subscribed,
    packages,
    reviews_summary: {
      count: reviewsSummary._count || 0,
      average: Math.round((reviewsSummary._avg?.rating || 0) * 10) / 10,
    },
  };

  if (is_subscribed && studentId) {
    const nextBooking = await prisma.booking.findFirst({
      where: { studentId, teacherId: teacher.id, status: 'CONFIRMED', date: { gte: new Date() } },
      orderBy: { date: 'asc' },
      include: { session: true },
    });
    if (nextBooking) {
      base.next_session = {
        date: nextBooking.date.toISOString().split('T')[0],
        time: nextBooking.startTime,
        is_active_now: false,
        meeting_link: nextBooking.session?.roomId ? `https://meet.example.com/${nextBooking.session.roomId}` : null,
      };
    }
    const activeBooking = await prisma.booking.findFirst({
      where: { studentId, teacherId: teacher.id, status: 'CONFIRMED' },
      orderBy: { date: 'desc' },
    });
    if (activeBooking) {
      base.current_subscription = {
        package_name: lang === 'ar' ? 'باقة حجز مع الشيخ' : 'Booking with Sheikh',
        renewal_date: activeBooking.date.toISOString().split('T')[0],
        status: 'active',
      };
    }
  }

  return base;
}

async function getSheikhReviews(teacherId, page = 1, limit = 10, lang = 'en') {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true, teacherType: true } });
  if (!teacher) throw Object.assign(new Error('Sheikh not found'), { statusCode: 404 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Reviews endpoint is only available for Quran live-session sheikhs'), { statusCode: 400 });
  }

  const skip = (page - 1) * limit;
  const reviews = await prisma.review.findMany({
    where: { teacherId },
    skip,
    take: limit,
    include: { student: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true } } },
    orderBy: { createdAt: 'desc' },
  });
  return reviews.map((r) => {
    const user_name = lang === 'ar'
      ? [r.student?.firstNameAr, r.student?.lastNameAr].filter(Boolean).join(' ').trim() ||
        [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ').trim()
      : [r.student?.firstName, r.student?.lastName].filter(Boolean).join(' ').trim();
    return {
      id: r.id,
      user_name: user_name || '—',
      rating: r.rating,
      comment: r.comment || '',
      date: r.createdAt.toISOString().split('T')[0],
    };
  });
}

async function addSheikhReview(teacherId, studentId, body) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, select: { id: true, teacherType: true } });
  if (!teacher) throw Object.assign(new Error('Sheikh not found'), { statusCode: 404 });
  if (teacher.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Reviews endpoint is only available for Quran live-session sheikhs'), { statusCode: 400 });
  }

  const booking = await prisma.booking.findFirst({
    where: { studentId, teacherId, status: 'COMPLETED' },
    orderBy: { date: 'desc' },
  });
  if (!booking) throw Object.assign(new Error('Only subscribed students can add a review. No completed booking found.'), { statusCode: 403 });
  const existing = await prisma.review.findFirst({
    where: { teacherId, studentId },
  });
  if (existing) throw Object.assign(new Error('You have already reviewed this sheikh'), { statusCode: 400 });
  const reviewService = require('./reviewService');
  return reviewService.create(booking.id, studentId, { rating: body.rating, comment: body.comment });
}

async function createMySchedules(userId, dto) {
  return teacherService.createMySchedules(userId, dto);
}

async function getMySchedules(userId) {
  return teacherService.getMySchedules(userId);
}

async function getSheikhAvailability(teacherId, startDate, endDate) {
  const sheikh = await prisma.teacher.findUnique({
    where: { id: teacherId },
    select: { id: true, isApproved: true, teacherType: true },
  });

  if (!sheikh) throw Object.assign(new Error('Sheikh not found'), { statusCode: 404 });
  if (!sheikh.isApproved) throw Object.assign(new Error('Sheikh is not approved'), { statusCode: 400 });
  if (sheikh.teacherType !== 'FULL_TEACHER') {
    throw Object.assign(new Error('Availability endpoint is only available for Quran live-session sheikhs'), { statusCode: 400 });
  }

  const now = new Date();
  const defaultStart = now.toISOString().split('T')[0];
  const defaultEndDate = new Date(now);
  defaultEndDate.setUTCDate(defaultEndDate.getUTCDate() + 14);
  const defaultEnd = defaultEndDate.toISOString().split('T')[0];

  const rangeStart = startDate || defaultStart;
  const rangeEnd = endDate || defaultEnd;

  const base = await teacherService.getAvailability(teacherId, rangeStart, rangeEnd);
  const startAt = new Date(base.range.startDate);
  const endAt = new Date(base.range.endDate);

  const days = [];
  const cursor = new Date(startAt);

  while (cursor <= endAt) {
    const dayStart = new Date(Date.UTC(cursor.getUTCFullYear(), cursor.getUTCMonth(), cursor.getUTCDate(), 0, 0, 0, 0));
    const dayOfWeek = dayStart.getUTCDay();
    const dayName = DAY_NAMES_EN[dayOfWeek];

    const daySchedules = base.schedules.filter((s) => s.dayOfWeek === dayOfWeek);
    const dayBookings = base.bookings.filter((b) => sameUtcDate(new Date(b.date), dayStart));

    const busyIntervals = dayBookings
      .map((b) => {
        const start = timeToMinutes(b.startTime);
        const end = start + Number(b.duration || 30);
        return { start, end };
      })
      .filter((b) => Number.isFinite(b.start) && Number.isFinite(b.end))
      .sort((a, b) => a.start - b.start);

    const availableWindows = [];
    for (const schedule of daySchedules) {
      const scheduleStart = timeToMinutes(schedule.startTime);
      const scheduleEnd = timeToMinutes(schedule.endTime);
      if (!Number.isFinite(scheduleStart) || !Number.isFinite(scheduleEnd) || scheduleEnd <= scheduleStart) continue;

      const free = subtractBusyIntervals({ start: scheduleStart, end: scheduleEnd }, busyIntervals);
      for (const interval of free) {
        availableWindows.push({
          startTime: minutesToTime(interval.start),
          endTime: minutesToTime(interval.end),
        });
      }
    }

    days.push({
      date: dayStart.toISOString().split('T')[0],
      dayOfWeek,
      dayName,
      isAvailable: availableWindows.length > 0,
      availableWindows,
      bookedCount: dayBookings.length,
    });

    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  return {
    teacherId,
    range: { startDate: rangeStart, endDate: rangeEnd },
    days,
  };
}

module.exports = {
  getSheikhs,
  getBookableSheikhsNotInCourses,
  getSheikhById,
  getSheikhReviews,
  addSheikhReview,
  createMySchedules,
  getMySchedules,
  getSheikhAvailability,
  getDayName,
  buildPackagesFromSchedules,
};
