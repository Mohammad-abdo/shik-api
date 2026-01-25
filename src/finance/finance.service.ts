import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class FinanceService {
  constructor(private prisma: PrismaService) {}

  async getFinanceStatistics() {
    const [
      totalRevenue,
      totalPayouts,
      pendingPayouts,
      totalTeachers,
      activeWallets,
    ] = await Promise.all([
      this.prisma.platformRevenue.aggregate({
        _sum: { amount: true },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { status: 'COMPLETED' },
        _sum: { amount: true },
      }),
      this.prisma.payoutRequest.aggregate({
        where: { status: 'PENDING' },
        _sum: { amount: true },
      }),
      this.prisma.teacher.count({
        where: { isApproved: true },
      }),
      this.prisma.teacherWallet.count({
        where: {
          balance: {
            gt: 0,
          },
        },
      }),
    ]);

    return {
      totalRevenue: totalRevenue._sum.amount || 0,
      totalPayouts: totalPayouts._sum.amount || 0,
      pendingPayouts: pendingPayouts._sum.amount || 0,
      netRevenue: (totalRevenue._sum.amount || 0) - (totalPayouts._sum.amount || 0),
      totalTeachers,
      activeWallets,
    };
  }

  async getPayouts(filters: {
    status?: string;
    teacherId?: string;
    page?: number;
    limit?: number;
  }) {
    const where: any = {};

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.teacherId) {
      where.teacherId = filters.teacherId;
    }

    const page = filters.page || 1;
    const limit = filters.limit || 20;
    const skip = (page - 1) * limit;

    const [payouts, total] = await Promise.all([
      this.prisma.payoutRequest.findMany({
        where,
        skip,
        take: limit,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.payoutRequest.count({ where }),
    ]);

    return {
      payouts,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getRevenueReport(startDate: Date, endDate: Date) {
    const revenue = await this.prisma.platformRevenue.findMany({
      where: {
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      // Note: bookingId is a scalar field, not a relation
      orderBy: {
        createdAt: 'desc',
      },
    });

    const total = revenue.reduce((sum, r) => sum + r.amount, 0);
    const teacherEarnings = revenue.reduce((sum, r) => sum + r.teacherEarning, 0);

    return {
      revenue,
      summary: {
        totalRevenue: total,
        totalTeacherEarnings: teacherEarnings,
        totalBookings: revenue.length,
        averageRevenuePerBooking: revenue.length > 0 ? total / revenue.length : 0,
      },
    };
  }

  async getTeacherEarnings(teacherId: string, startDate?: Date, endDate?: Date) {
    const wallet = await this.prisma.teacherWallet.findUnique({
      where: { teacherId },
    });

    if (!wallet) {
      return {
        totalEarned: 0,
        currentBalance: 0,
        pendingBalance: 0,
        transactions: [],
      };
    }

    const where: any = { walletId: wallet.id };
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = startDate;
      if (endDate) where.createdAt.lte = endDate;
    }

    const transactions = await this.prisma.walletTransaction.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });

    return {
      totalEarned: wallet.totalEarned,
      currentBalance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      transactions,
    };
  }
}



