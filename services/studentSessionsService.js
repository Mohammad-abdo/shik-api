const { prisma } = require('../lib/prisma');

const DAY_NAMES_AR = ['الأحد', 'الإثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
const DAY_NAMES_EN = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

function getDayName(dayOfWeek, lang) {
  const names = lang === 'ar' ? DAY_NAMES_AR : DAY_NAMES_EN;
  return names[dayOfWeek] ?? names[0];
}

function mapBookingStatus(status) {
  const map = { PENDING: 'upcoming', CONFIRMED: 'upcoming', COMPLETED: 'completed', CANCELLED: 'cancelled', REJECTED: 'cancelled' };
  return map[status] || 'upcoming';
}

async function getMySessions(studentId, month, year, lang = 'en') {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0, 23, 59, 59);
  const bookings = await prisma.booking.findMany({
    where: {
      studentId,
      date: { gte: start, lte: end },
      status: { in: ['CONFIRMED', 'COMPLETED', 'PENDING'] },
    },
    include: {
      teacher: { include: { user: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true } } } },
      session: true,
    },
    orderBy: { date: 'asc' },
  });

  const sheikhName = (t) => {
    if (!t?.user) return '—';
    const u = t.user;
    return lang === 'ar'
      ? [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ').trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      : [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  };

  return bookings.map((b) => ({
    id: b.session?.id || b.id,
    sheikh_name: sheikhName(b.teacher),
    date: b.date.toISOString().split('T')[0],
    day: getDayName(b.date.getDay(), lang),
    time: b.startTime,
    status: mapBookingStatus(b.status),
    report_available: b.status === 'COMPLETED' && !!b.session?.endedAt,
  }));
}

async function getSessionReport(sessionOrBookingId, studentId, lang = 'en') {
  let session = await prisma.session.findUnique({
    where: { id: sessionOrBookingId },
    include: {
      booking: {
        include: {
          student: true,
          teacher: true,
        },
      },
    },
  });
  if (!session) {
    session = await prisma.session.findUnique({
      where: { bookingId: sessionOrBookingId },
      include: { booking: { include: { student: true, teacher: true } } },
    });
  }
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  if (session.booking.studentId !== studentId) throw Object.assign(new Error('You do not have access to this session report'), { statusCode: 403 });
  if (session.booking.status !== 'COMPLETED') throw Object.assign(new Error('Session not completed yet'), { statusCode: 400 });

  // Placeholder report - backend can later add SessionReport table with attendance_status, quran_progress, notes, next_homework
  const report = {
    session_id: session.id,
    date: session.booking.date.toISOString().split('T')[0],
    attendance_status: session.endedAt ? 'present' : 'absent',
    quran_progress: {
      surah: lang === 'ar' ? 'البقرة' : 'Al-Baqarah',
      from_ayah: 1,
      to_ayah: 50,
      rating: lang === 'ar' ? 'ممتاز' : 'Excellent',
      memorization_quality: 5,
      tajweed_quality: 5,
    },
    notes: lang === 'ar' ? 'تمت مراجعة الربع الأول بنجاح.' : 'First quarter reviewed successfully.',
    next_homework: lang === 'ar' ? 'حفظ من الآية 51 إلى 60 من سورة البقرة' : 'Memorize verses 51-60 of Al-Baqarah',
  };

  return report;
}

async function getMyReports(studentId, page = 1, limit = 20, lang = 'en') {
  const skip = (page - 1) * limit;
  const sessions = await prisma.session.findMany({
    where: {
      endedAt: { not: null },
      booking: {
        studentId,
        status: 'COMPLETED',
      },
    },
    include: {
      booking: {
        include: {
          teacher: {
            include: {
              user: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
            },
          },
        },
      },
    },
    orderBy: { endedAt: 'desc' },
    skip,
    take: limit,
  });

  const sheikhName = (t) => {
    if (!t?.user) return '—';
    const u = t.user;
    return lang === 'ar'
      ? [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ').trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      : [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  };

  const dayName = (d) => (lang === 'ar' ? DAY_NAMES_AR[d] : DAY_NAMES_EN[d]);

  const withReports = await Promise.all(
    sessions.map(async (s) => {
      const b = s.booking;
      const teacher = b.teacher;
      let reportPayload = {
        overall_rating: 7.5,
        rating_label: lang === 'ar' ? 'جيد جداً' : 'Very Good',
        new_memorization_rating: 7,
        recent_review_rating: 8,
        distant_review_rating: 8,
        notes: '',
      };
      try {
        const r = await getSessionReport(s.id, studentId, lang);
        reportPayload = {
          overall_rating: (r.quran_progress?.memorization_quality || 0) + (r.quran_progress?.tajweed_quality || 0) / 2 || 7.5,
          rating_label: r.quran_progress?.rating || reportPayload.rating_label,
          new_memorization_rating: r.quran_progress?.memorization_quality ?? 7,
          recent_review_rating: 8,
          distant_review_rating: 9,
          notes: r.notes || '',
        };
      } catch (_) {}
      return {
        sheikh: {
          id: teacher.id,
          name: sheikhName(teacher),
          image: teacher.image || teacher.user?.avatar || null,
          specialization: lang === 'ar' ? (teacher.specialtiesAr || teacher.specialties) : (teacher.specialties || teacher.specialtiesAr) || '—',
        },
        session: {
          id: s.id,
          date: b.date.toISOString().split('T')[0],
          day_name: dayName(b.date.getDay()),
          time: b.startTime,
        },
        report: reportPayload,
      };
    })
  );

  return withReports;
}

module.exports = { getMySessions, getSessionReport, getMyReports };
