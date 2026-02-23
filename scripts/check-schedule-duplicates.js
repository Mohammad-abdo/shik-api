require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  const schedules = await prisma.schedule.findMany({
    where: { isActive: true },
    select: { teacherId: true, dayOfWeek: true, startTime: true, endTime: true },
  });

  const map = new Map();
  for (const s of schedules) {
    const key = [
      s.teacherId,
      s.dayOfWeek,
      String(s.startTime).slice(0, 5),
      String(s.endTime).slice(0, 5),
    ].join('|');
    map.set(key, (map.get(key) || 0) + 1);
  }

  const duplicates = Array.from(map.entries()).filter(([, count]) => count > 1);
  console.log(JSON.stringify({
    activeSchedules: schedules.length,
    duplicateTimeGroups: duplicates.length,
    duplicates: duplicates.slice(0, 10),
  }, null, 2));
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
