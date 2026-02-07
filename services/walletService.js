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
      data: { teacherId, balance: 0, pendingBalance: 0, totalEarned: 0 },
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

module.exports = { getOrCreateWallet, creditWallet };
