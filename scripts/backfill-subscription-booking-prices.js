require('dotenv').config();
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function main() {
  const zeroSubscriptionBookings = await prisma.booking.findMany({
    where: {
      type: 'SUBSCRIPTION',
      totalPrice: 0,
      subscriptionId: { not: null },
    },
    select: {
      id: true,
      subscriptionId: true,
    },
  });

  const bySubscription = new Map();
  for (const b of zeroSubscriptionBookings) {
    const key = b.subscriptionId;
    if (!key) continue;
    if (!bySubscription.has(key)) bySubscription.set(key, []);
    bySubscription.get(key).push(b.id);
  }

  const subscriptionIds = Array.from(bySubscription.keys());
  const subs = subscriptionIds.length
    ? await prisma.studentSubscription.findMany({
        where: { id: { in: subscriptionIds } },
        select: {
          id: true,
          package: { select: { price: true, monthlyPrice: true } },
          payment: { select: { amount: true, status: true } },
        },
      })
    : [];

  const subMap = new Map(subs.map((s) => [s.id, s]));

  let updated = 0;
  let touchedSubscriptions = 0;

  for (const [subId, bookingIds] of bySubscription.entries()) {
    const sub = subMap.get(subId);
    if (!sub) continue;

    const paymentAmount = Number(sub.payment?.amount || 0);
    const packageAmount = Number(sub.package?.price || sub.package?.monthlyPrice || 0);
    const totalAmount = paymentAmount > 0 ? paymentAmount : packageAmount;
    if (!(totalAmount > 0)) continue;

    const perSession = Number((totalAmount / bookingIds.length).toFixed(2));
    if (!(perSession > 0)) continue;

    const result = await prisma.booking.updateMany({
      where: { id: { in: bookingIds } },
      data: { price: perSession, totalPrice: perSession },
    });

    if (result.count > 0) {
      touchedSubscriptions += 1;
      updated += result.count;
    }
  }

  console.log(JSON.stringify({
    zeroSubscriptionBookings: zeroSubscriptionBookings.length,
    subscriptionsScanned: subscriptionIds.length,
    subscriptionsUpdated: touchedSubscriptions,
    bookingsUpdated: updated,
  }, null, 2));
}

main()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
