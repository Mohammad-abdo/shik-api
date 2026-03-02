/**
 * Data migration: For each Session that still has bookingId (legacy column), create a
 * BookingSession from the linked Booking (using or creating a Schedule for the teacher)
 * and set Session.bookingSessionId, then clear Session.bookingId.
 *
 * Run after applying migration 20250302120000_add_booking_sessions, and before
 * 20250302120001_drop_sessions_booking_id.
 * Usage: node scripts/migrate-sessions-to-booking-sessions.js
 *
 * Uses raw SQL to read sessions.bookingId because the Prisma schema may already
 * omit the deprecated bookingId field.
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

function addMinutesToTime(timeStr, minutes) {
  const [h, m] = (timeStr || '09:00').split(':').map(Number);
  const totalM = (h * 60 + (m || 0)) + minutes;
  const nh = Math.floor(totalM / 60) % 24;
  const nm = totalM % 60;
  return `${String(nh).padStart(2, '0')}:${String(nm).padStart(2, '0')}`;
}

async function getOrCreateSchedule(teacherId, date, startTime, durationMinutes) {
  const dayOfWeek = date.getDay(); // 0 Sun, 1 Mon, ...
  const endTime = addMinutesToTime(startTime, durationMinutes);

  let schedule = await prisma.schedule.findFirst({
    where: {
      teacherId,
      dayOfWeek,
      startTime,
      isActive: true,
    },
  });

  if (!schedule) {
    schedule = await prisma.schedule.create({
      data: {
        teacherId,
        dayOfWeek,
        startTime,
        endTime,
        isActive: true,
      },
    });
  }
  return schedule;
}

async function main() {
  // Use raw query in case schema no longer has bookingId
  const sessionsWithLegacyBooking = await prisma.$queryRaw`
    SELECT s.id as sessionId, s.bookingId, s.endedAt
    FROM sessions s
    WHERE s.bookingId IS NOT NULL
  `;

  console.log(`Found ${sessionsWithLegacyBooking.length} sessions with legacy bookingId to migrate.`);

  for (const row of sessionsWithLegacyBooking) {
    const booking = await prisma.booking.findUnique({
      where: { id: row.bookingId },
      include: { teacher: true },
    });
    if (!booking) {
      console.warn(`Session ${row.sessionId} has bookingId ${row.bookingId} but booking not found, skipping.`);
      continue;
    }
    const durationMinutes = booking.duration || 120;
    const startTime = booking.startTime || '09:00';

    try {
      const schedule = await getOrCreateSchedule(
        booking.teacherId,
        booking.date,
        startTime,
        durationMinutes
      );
      const endTime = addMinutesToTime(startTime, durationMinutes);
      const slotStatus = booking.status === 'COMPLETED' || row.endedAt ? 'COMPLETED' : 'CONFIRMED';

      const existingSlot = await prisma.bookingSession.findUnique({
        where: {
          scheduleId_scheduledDate_startTime: {
            scheduleId: schedule.id,
            scheduledDate: booking.date,
            startTime,
          },
        },
      });

      let bookingSession;
      if (existingSlot) {
        bookingSession = existingSlot;
      } else {
        bookingSession = await prisma.bookingSession.create({
          data: {
            bookingId: booking.id,
            scheduleId: schedule.id,
            scheduledDate: booking.date,
            startTime,
            endTime,
            orderIndex: 0,
            status: slotStatus,
          },
        });
      }

      await prisma.$executeRaw`
        UPDATE sessions SET bookingSessionId = ${bookingSession.id}, bookingId = NULL WHERE id = ${row.sessionId}
      `;
      console.log(`Migrated session ${row.sessionId} -> bookingSession ${bookingSession.id}`);
    } catch (e) {
      console.error(`Failed to migrate session ${row.sessionId}:`, e.message);
    }
  }

  console.log('Migration complete.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
