const { prisma } = require('../lib/prisma');

const platformFeePercentage = parseFloat(process.env.PLATFORM_FEE_PERCENTAGE || '20');

async function getOrCreateWallet(teacherId) {
  let wallet = await prisma.teacherWallet.findUnique({
    where: { teacherId },
    include: {
      transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
    },
  });
  if (!wallet) {
    wallet = await prisma.teacherWallet.create({
      data: { teacherId, balance: 0, pendingBalance: 0, totalEarned: 0, totalHours: 0 },
      include: {
        transactions: { orderBy: { createdAt: 'desc' }, take: 10 },
      },
    });
  }
  return wallet;
}

async function creditWallet(teacherId, amount, bookingId, paymentId) {
  const wallet = await getOrCreateWallet(teacherId);
  const platformFee = (amount * platformFeePercentage) / 100;
  const teacherEarning = amount - platformFee;

  const updatedWallet = await prisma.teacherWallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: teacherEarning },
      totalEarned: { increment: teacherEarning },
    },
  });

  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount: teacherEarning,
      description: `Payment for booking ${bookingId}`,
      bookingId,
      paymentId,
    },
  });

  await prisma.platformRevenue.create({
    data: { bookingId, amount: platformFee, teacherEarning },
  });

  return updatedWallet;
}

/**
 * Credit teacher wallet based on actual session duration x hourly rate.
 * Called automatically when a session is marked as completed (endSession).
 *
 * @param {string} bookingId
 * @returns {Promise<object>} updated wallet
 */
async function creditFromSession(bookingId) {
  // Load session and teacher info
  const session = await prisma.session.findUnique({
    where: { bookingId },
    include: {
      booking: {
        include: {
          teacher: true,
        },
      },
    },
  });

  if (!session) {
    console.warn(`[wallet] creditFromSession: no session found for bookingId=${bookingId}`);
    return null;
  }

  const { startedAt, endedAt, booking } = session;
  const teacher = booking?.teacher;

  if (!startedAt || !endedAt) {
    console.warn(`[wallet] creditFromSession: session ${session.id} missing start/endedAt`);
    return null;
  }

  if (!teacher) {
    console.warn(`[wallet] creditFromSession: no teacher found for bookingId=${bookingId}`);
    return null;
  }

  // Calculate hours (floating point, e.g. 1.5 hours)
  const durationMs = endedAt.getTime() - startedAt.getTime();
  const hours = durationMs / (1000 * 60 * 60);

  const hourlyRate = teacher.hourlyRate || 0;
  const grossAmount = hours * hourlyRate;                           // full earning before platform fee
  const platformFee = (grossAmount * platformFeePercentage) / 100;
  const teacherEarning = grossAmount - platformFee;

  // Get or create wallet
  const wallet = await getOrCreateWallet(teacher.id);

  // Update wallet atomically
  const updatedWallet = await prisma.teacherWallet.update({
    where: { id: wallet.id },
    data: {
      balance: { increment: teacherEarning },
      totalEarned: { increment: teacherEarning },
      totalHours: { increment: hours },
    },
  });

  // Record transaction
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'SESSION_EARNING',
      amount: teacherEarning,
      description: `Session earning: ${hours.toFixed(2)}h × ${hourlyRate}/h (booking ${bookingId})`,
      bookingId,
    },
  });

  // Record platform revenue (only if not already recorded for this booking)
  const existingRevenue = await prisma.platformRevenue.findUnique({ where: { bookingId } });
  if (!existingRevenue && grossAmount > 0) {
    await prisma.platformRevenue.create({
      data: { bookingId, amount: platformFee, teacherEarning },
    });
  }

  console.log(
    `[wallet] Credited teacher ${teacher.id}: ${hours.toFixed(2)}h × ${hourlyRate} = ${grossAmount.toFixed(2)} gross → ${teacherEarning.toFixed(2)} net (fee: ${platformFee.toFixed(2)})`
  );

  return updatedWallet;
}

module.exports = { getOrCreateWallet, creditWallet, creditFromSession };
