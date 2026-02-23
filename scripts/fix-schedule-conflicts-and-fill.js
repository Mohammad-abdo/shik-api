require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function normalizeTime(value) {
  return String(value || '').slice(0, 5);
}

function keyForSchedule(s) {
  return `${s.teacherId}|${s.dayOfWeek}|${normalizeTime(s.startTime)}|${normalizeTime(s.endTime)}`;
}

async function getLinkedCounts(scheduleIds) {
  if (!scheduleIds.length) return new Map();

  const [bookingCounts, reservationCounts] = await Promise.all([
    prisma.booking.groupBy({
      by: ['scheduleId'],
      where: { scheduleId: { in: scheduleIds } },
      _count: { scheduleId: true },
    }),
    prisma.scheduleReservation.groupBy({
      by: ['scheduleId'],
      where: { scheduleId: { in: scheduleIds } },
      _count: { scheduleId: true },
    }),
  ]);

  const map = new Map();
  for (const row of bookingCounts) {
    map.set(row.scheduleId, { bookings: row._count.scheduleId || 0, reservations: 0 });
  }
  for (const row of reservationCounts) {
    const prev = map.get(row.scheduleId) || { bookings: 0, reservations: 0 };
    map.set(row.scheduleId, { ...prev, reservations: row._count.scheduleId || 0 });
  }
  return map;
}

function pickWinner(schedules, linkedCounts) {
  const sorted = [...schedules].sort((a, b) => {
    const aLinks = linkedCounts.get(a.id) || { bookings: 0, reservations: 0 };
    const bLinks = linkedCounts.get(b.id) || { bookings: 0, reservations: 0 };
    const aScore = aLinks.bookings + aLinks.reservations;
    const bScore = bLinks.bookings + bLinks.reservations;
    if (aScore !== bScore) return bScore - aScore;

    const aCreated = new Date(a.createdAt).getTime();
    const bCreated = new Date(b.createdAt).getTime();
    if (aCreated !== bCreated) return aCreated - bCreated;

    return String(a.id).localeCompare(String(b.id));
  });

  return sorted[0];
}

async function main() {
  const DEFAULT_SLOTS = [
    { dayOfWeek: 1, startTime: '18:00', endTime: '20:00' },
    { dayOfWeek: 3, startTime: '18:00', endTime: '20:00' },
    { dayOfWeek: 6, startTime: '10:00', endTime: '12:00' },
  ];

  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    select: { id: true, teacherId: true, dayOfWeek: true, startTime: true, endTime: true, createdAt: true },
    orderBy: [{ teacherId: 'asc' }, { dayOfWeek: 'asc' }, { startTime: 'asc' }, { createdAt: 'asc' }],
  });

  const grouped = new Map();
  for (const s of schedules) {
    const k = keyForSchedule(s);
    if (!grouped.has(k)) grouped.set(k, []);
    grouped.get(k).push(s);
  }

  const duplicateGroups = Array.from(grouped.values()).filter((g) => g.length > 1);
  const scheduleIds = duplicateGroups.flatMap((g) => g.map((s) => s.id));
  const linkedCounts = await getLinkedCounts(scheduleIds);

  const toDeactivate = [];
  const resolvedGroups = [];

  for (const group of duplicateGroups) {
    const winner = pickWinner(group, linkedCounts);
    const losers = group.filter((s) => s.id !== winner.id);
    toDeactivate.push(...losers.map((s) => s.id));

    resolvedGroups.push({
      teacherId: winner.teacherId,
      dayOfWeek: winner.dayOfWeek,
      startTime: normalizeTime(winner.startTime),
      endTime: normalizeTime(winner.endTime),
      keptScheduleId: winner.id,
      removedScheduleIds: losers.map((s) => s.id),
    });
  }

  if (toDeactivate.length > 0) {
    await prisma.schedule.updateMany({
      where: { id: { in: toDeactivate } },
      data: { isActive: false },
    });
  }

  const fullTeachers = await prisma.teacher.findMany({
    where: { teacherType: 'FULL_TEACHER', isApproved: true },
    select: {
      id: true,
      user: { select: { firstName: true, lastName: true, email: true } },
      schedules: {
        where: { isActive: true },
        select: { id: true, dayOfWeek: true, startTime: true, endTime: true },
      },
    },
  });

  const teachersWithoutActive = fullTeachers.filter((t) => t.schedules.length === 0);
  let createdSchedules = 0;

  for (const teacher of teachersWithoutActive) {
    const rows = DEFAULT_SLOTS.map((slot) => ({
      teacherId: teacher.id,
      dayOfWeek: slot.dayOfWeek,
      startTime: slot.startTime,
      endTime: slot.endTime,
      isActive: true,
    }));

    const created = await prisma.schedule.createMany({ data: rows });
    createdSchedules += created.count;
  }

  const sampleTeachers = teachersWithoutActive.slice(0, 10).map((t) => ({
    teacherId: t.id,
    name: `${t.user?.firstName || ''} ${t.user?.lastName || ''}`.trim(),
    email: t.user?.email || null,
  }));

  console.log(JSON.stringify({
    scannedActiveSchedules: schedules.length,
    duplicateGroupsFound: duplicateGroups.length,
    schedulesDeactivated: toDeactivate.length,
    duplicateResolutions: resolvedGroups,
    approvedFullTeachers: fullTeachers.length,
    teachersWithoutActiveSchedules: teachersWithoutActive.length,
    createdSchedules,
    defaultSlotsPerTeacher: DEFAULT_SLOTS,
    teachersPatchedSample: sampleTeachers,
  }, null, 2));
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
