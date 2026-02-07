const { prisma } = require('../lib/prisma');

async function getStatistics() {
  const [totalRevenue, pendingPayouts, completedPayouts, walletBalance] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payoutRequest.count({ where: { status: 'PENDING' } }),
    prisma.payoutRequest.count({ where: { status: 'COMPLETED' } }),
    prisma.teacherWallet.aggregate({ _sum: { balance: true } }),
  ]);
  return {
    totalRevenue: totalRevenue._sum?.amount || 0,
    pendingPayouts,
    completedPayouts,
    walletBalance: walletBalance._sum?.balance || 0,
  };
}

async function getPayouts(page = 1, limit = 20, status) {
  const where = status ? { status } : {};
  const skip = (page - 1) * limit;
  const [payouts, total] = await Promise.all([
    prisma.payoutRequest.findMany({
      where,
      skip,
      take: limit,
      include: { teacher: { include: { user: true } }, wallet: true },
      orderBy: { requestedAt: 'desc' },
    }),
    prisma.payoutRequest.count({ where }),
  ]);
  return { payouts, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function approvePayout(id, adminId) {
  const payout = await prisma.payoutRequest.findUnique({ where: { id }, include: { wallet: true } });
  if (!payout) throw Object.assign(new Error('Payout not found'), { statusCode: 404 });
  if (payout.status !== 'PENDING') throw Object.assign(new Error('Payout is not pending'), { statusCode: 400 });
  return prisma.payoutRequest.update({
    where: { id },
    data: { status: 'APPROVED', approvedAt: new Date(), approvedBy: adminId },
    include: { teacher: { include: { user: true } }, wallet: true },
  });
}

async function rejectPayout(id, adminId, reason) {
  const payout = await prisma.payoutRequest.findUnique({ where: { id } });
  if (!payout) throw Object.assign(new Error('Payout not found'), { statusCode: 404 });
  return prisma.payoutRequest.update({
    where: { id },
    data: { status: 'REJECTED', rejectionReason: reason },
    include: { teacher: { include: { user: true } } },
  });
}

async function completePayout(id, adminId) {
  const payout = await prisma.payoutRequest.findUnique({ where: { id }, include: { wallet: true } });
  if (!payout) throw Object.assign(new Error('Payout not found'), { statusCode: 404 });
  if (payout.status !== 'APPROVED') throw Object.assign(new Error('Payout must be approved first'), { statusCode: 400 });
  return prisma.payoutRequest.update({
    where: { id },
    data: { status: 'COMPLETED', processedAt: new Date() },
    include: { teacher: { include: { user: true } }, wallet: true },
  });
}

async function getWallet(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const wallet = await prisma.teacherWallet.findUnique({
    where: { teacherId: teacher.id },
    include: { teacher: { include: { user: true } } },
  });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return wallet;
}

async function getWalletTransactions(teacherId, page = 1, limit = 50) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const wallet = await prisma.teacherWallet.findUnique({ where: { teacherId: teacher.id } });
  if (!wallet) return { transactions: [], pagination: { page, limit, total: 0, totalPages: 0 } };
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    prisma.walletTransaction.findMany({ where: { walletId: wallet.id }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.walletTransaction.count({ where: { walletId: wallet.id } }),
  ]);
  return { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function createPayoutRequest(teacherId, dto) {
  const teacher = await prisma.teacher.findUnique({ where: { userId: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const wallet = await prisma.teacherWallet.findUnique({ where: { teacherId: teacher.id } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  if (wallet.balance < dto.amount) throw Object.assign(new Error('Insufficient balance'), { statusCode: 400 });
  return prisma.payoutRequest.create({
    data: { teacherId: teacher.id, walletId: wallet.id, amount: dto.amount, status: 'PENDING' },
    include: { wallet: true, teacher: { include: { user: true } } },
  });
}

module.exports = { getStatistics, getPayouts, approvePayout, rejectPayout, completePayout, getWallet, getWalletTransactions, createPayoutRequest };
