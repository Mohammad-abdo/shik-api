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
      bookingSessions: {
        orderBy: { orderIndex: 'asc' },
        include: { session: true },
      },
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

  return bookings.flatMap((b) =>
    (b.bookingSessions || []).length > 0
      ? b.bookingSessions.map((bs) => ({
          id: bs.session?.id || bs.id,
          sheikh_name: sheikhName(b.teacher),
          date: bs.scheduledDate.toISOString().split('T')[0],
          day: getDayName(bs.scheduledDate.getDay(), lang),
          time: bs.startTime,
          status: mapBookingStatus(bs.status),
          report_available: bs.status === 'COMPLETED' && !!bs.session?.endedAt,
        }))
      : [{
          id: b.id,
          sheikh_name: sheikhName(b.teacher),
          date: b.date.toISOString().split('T')[0],
          day: getDayName(b.date.getDay(), lang),
          time: b.startTime,
          status: mapBookingStatus(b.status),
          report_available: false,
        }]
  );
}

async function getSessionReport(sessionOrBookingSessionId, studentId, lang = 'en') {
  let session = await prisma.session.findUnique({
    where: { id: sessionOrBookingSessionId },
    include: {
      bookingSession: {
        include: {
          booking: {
            include: {
              student: true,
              teacher: true,
            },
          },
        },
      },
    },
  });
  if (!session) {
    session = await prisma.session.findUnique({
      where: { bookingSessionId: sessionOrBookingSessionId },
      include: {
        bookingSession: { include: { booking: { include: { student: true, teacher: true } } } },
      },
    });
  }
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const booking = session.bookingSession?.booking;
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.studentId !== studentId) throw Object.assign(new Error('You do not have access to this session report'), { statusCode: 403 });
  if (booking.status !== 'COMPLETED') throw Object.assign(new Error('Session not completed yet'), { statusCode: 400 });

  const slotDate = session.bookingSession?.scheduledDate ?? booking.date;
  const report = {
    session_id: session.id,
    date: slotDate.toISOString ? slotDate.toISOString().split('T')[0] : new Date(slotDate).toISOString().split('T')[0],
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
      bookingSession: {
        booking: {
          studentId,
          status: 'COMPLETED',
        },
      },
    },
    include: {
      bookingSession: {
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
      const b = s.bookingSession?.booking;
      const teacher = b?.teacher;
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
      const slotDate = s.bookingSession?.scheduledDate ?? b?.date;
      const slotTime = s.bookingSession?.startTime ?? b?.startTime;
      return {
        sheikh: {
          id: teacher?.id,
          name: sheikhName(teacher),
          image: teacher?.image || teacher?.user?.avatar || null,
          specialization: teacher ? (lang === 'ar' ? (teacher.specialtiesAr || teacher.specialties) : (teacher.specialties || teacher.specialtiesAr) || '—') : '—',
        },
        session: {
          id: s.id,
          date: slotDate?.toISOString?.()?.split('T')[0] ?? '',
          day_name: slotDate ? dayName(slotDate.getDay()) : '',
          time: slotTime ?? '',
        },
        report: reportPayload,
      };
    })
  );

  return withReports;
}

async function getReportsBySheikh(studentId, sheikhId, page = 1, limit = 20, lang = 'en') {
  const skip = (page - 1) * limit;

  const teacher = await prisma.teacher.findUnique({
    where: { id: sheikhId },
    include: {
      user: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
    },
  });
  if (!teacher) throw Object.assign(new Error('Sheikh not found'), { statusCode: 404 });

  const [reports, total] = await Promise.all([
    prisma.sessionReport.findMany({
      where: { studentId, teacherId: sheikhId },
      include: {
        session: {
          include: {
            memorizations: { orderBy: { createdAt: 'asc' } },
            revisions: { orderBy: { createdAt: 'asc' } },
            bookingSession: {
              include: {
                booking: { select: { date: true, startTime: true, status: true } },
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    prisma.sessionReport.count({ where: { studentId, teacherId: sheikhId } }),
  ]);

  const sheikhName = (t) => {
    if (!t?.user) return '—';
    const u = t.user;
    return lang === 'ar'
      ? [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ').trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      : [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  };

  const dayName = (d) => (lang === 'ar' ? DAY_NAMES_AR[d] : DAY_NAMES_EN[d]);

  const items = reports.map((r) => {
    const s = r.session;
    const bs = s?.bookingSession;
    const slotDate = bs?.scheduledDate ?? bs?.booking?.date;
    const slotTime = bs?.startTime ?? bs?.booking?.startTime;

    let reportContent = {};
    try { reportContent = JSON.parse(r.content); } catch (_) { reportContent = { text: r.content }; }

    return {
      report_id: r.id,
      session_id: s?.id ?? null,
      date: slotDate?.toISOString?.()?.split('T')[0] ?? r.createdAt.toISOString().split('T')[0],
      day_name: slotDate ? dayName(slotDate.getDay()) : '',
      time: slotTime ?? '',
      rating: r.rating,
      content: reportContent,
      memorizations: (s?.memorizations || []).map((m) => ({
        id: m.id,
        surah: lang === 'ar' ? (m.surahNameAr || m.surahName) : m.surahName,
        from_ayah: m.fromAyah,
        to_ayah: m.toAyah,
        is_full_surah: m.isFullSurah,
        notes: m.notes,
      })),
      revisions: (s?.revisions || []).map((rv) => ({
        id: rv.id,
        type: rv.revisionType,
        range_type: rv.rangeType,
        from_surah: rv.fromSurah,
        to_surah: rv.toSurah,
        from_juz: rv.fromJuz,
        to_juz: rv.toJuz,
        notes: rv.notes,
      })),
    };
  });

  return {
    sheikh: {
      id: teacher.id,
      name: sheikhName(teacher),
      image: teacher.image || teacher.user?.avatar || null,
      specialization: lang === 'ar'
        ? (teacher.specialtiesAr || teacher.specialties || '—')
        : (teacher.specialties || teacher.specialtiesAr || '—'),
    },
    reports: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
      hasPrevPage: page > 1,
    },
  };
}

async function getMyBookings(studentId, page = 1, limit = 20, lang = 'en') {
  const skip = (page - 1) * limit;

  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where: { studentId },
      include: {
        teacher: {
          include: {
            user: { select: { firstName: true, lastName: true, firstNameAr: true, lastNameAr: true, avatar: true } },
          },
        },
        bookingSessions: {
          orderBy: { orderIndex: 'asc' },
          include: { session: { select: { id: true, roomId: true, startedAt: true, endedAt: true } } },
        },
      },
      orderBy: { date: 'desc' },
      skip,
      take: limit,
    }),
    prisma.booking.count({ where: { studentId } }),
  ]);

  const teacherIds = [...new Set(bookings.map(b => b.teacherId))];
  const activeSubs = await prisma.studentSubscription.findMany({
    where: {
      studentId,
      teacherId: { in: teacherIds },
      status: { in: ['ACTIVE', 'PENDING'] },
      endDate: { gte: new Date() },
    },
    select: { teacherId: true },
  });
  const subscribedTeacherIds = new Set(activeSubs.map(s => s.teacherId));

  const sheikhName = (t) => {
    if (!t?.user) return '—';
    const u = t.user;
    return lang === 'ar'
      ? [u.firstNameAr, u.lastNameAr].filter(Boolean).join(' ').trim() || [u.firstName, u.lastName].filter(Boolean).join(' ').trim()
      : [u.firstName, u.lastName].filter(Boolean).join(' ').trim();
  };

  const items = bookings.map((b) => {
    const t = b.teacher;
    const sessions = (b.bookingSessions || []).map(bs => ({
      id: bs.session?.id || bs.id,
      scheduledDate: bs.scheduledDate?.toISOString?.()?.split('T')[0] ?? '',
      startTime: bs.startTime,
      endTime: bs.endTime,
      status: bs.status,
      meetingLink: bs.session?.roomId ? `https://meet.example.com/${bs.session.roomId}` : null,
    }));

    return {
      id: b.id,
      date: b.date?.toISOString?.()?.split('T')[0] ?? '',
      startTime: b.startTime,
      duration: b.duration,
      status: b.status,
      totalPrice: b.totalPrice,
      notes: b.notes || null,
      createdAt: b.createdAt,
      sheikh: {
        id: t?.id || null,
        name: sheikhName(t),
        image: t?.image || t?.user?.avatar || null,
        specialization: lang === 'ar' ? (t?.specialtiesAr || t?.specialties || '—') : (t?.specialties || t?.specialtiesAr || '—'),
        rating: t?.rating ?? 0,
        is_subscribed: subscribedTeacherIds.has(b.teacherId),
      },
      sessions,
    };
  });

  return {
    bookings: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      hasNextPage: skip + limit < total,
      hasPrevPage: page > 1,
    },
  };
}

module.exports = { getMySessions, getSessionReport, getMyReports, getReportsBySheikh, getMyBookings };
