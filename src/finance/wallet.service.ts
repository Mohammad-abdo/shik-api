import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WalletService {
  private readonly platformFeePercentage: number;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Platform fee percentage (e.g., 20%)
    this.platformFeePercentage = parseFloat(
      this.config.get<string>('PLATFORM_FEE_PERCENTAGE') || '20',
    );
  }

  async getOrCreateWallet(teacherId: string) {
    let wallet = await this.prisma.teacherWallet.findUnique({
      where: { teacherId },
      include: {
        transactions: {
          orderBy: {
            createdAt: 'desc',
          },
          take: 10,
        },
      },
    });

    if (!wallet) {
      wallet = await this.prisma.teacherWallet.create({
        data: {
          teacherId,
          balance: 0,
          pendingBalance: 0,
          totalEarned: 0,
        },
        include: {
          transactions: {
            orderBy: {
              createdAt: 'desc',
            },
            take: 10,
          },
        },
      });
    }

    return wallet;
  }

  async creditWallet(teacherId: string, amount: number, bookingId: string, paymentId: string) {
    const wallet = await this.getOrCreateWallet(teacherId);

    // Calculate platform fee and teacher earning
    const platformFee = (amount * this.platformFeePercentage) / 100;
    const teacherEarning = amount - platformFee;

    // Update wallet
    const updatedWallet = await this.prisma.teacherWallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          increment: teacherEarning,
        },
        totalEarned: {
          increment: teacherEarning,
        },
      },
    });

    // Create transaction record
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'CREDIT',
        amount: teacherEarning,
        description: `Payment for booking ${bookingId}`,
        bookingId,
        paymentId,
      },
    });

    // Record platform revenue
    await this.prisma.platformRevenue.create({
      data: {
        bookingId,
        amount: platformFee,
        teacherEarning,
      },
    });

    return updatedWallet;
  }

  async debitWallet(teacherId: string, amount: number, description: string) {
    const wallet = await this.getOrCreateWallet(teacherId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Update wallet
    const updatedWallet = await this.prisma.teacherWallet.update({
      where: { id: wallet.id },
      data: {
        balance: {
          decrement: amount,
        },
        pendingBalance: {
          increment: amount,
        },
      },
    });

    // Create transaction record
    await this.prisma.walletTransaction.create({
      data: {
        walletId: wallet.id,
        type: 'DEBIT',
        amount,
        description,
      },
    });

    return updatedWallet;
  }

  async getWalletTransactions(teacherId: string, page: number = 1, limit: number = 20) {
    const wallet = await this.getOrCreateWallet(teacherId);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      this.prisma.walletTransaction.findMany({
        where: { walletId: wallet.id },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.walletTransaction.count({
        where: { walletId: wallet.id },
      }),
    ]);

    return {
      transactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async createPayoutRequest(teacherId: string, amount: number) {
    const wallet = await this.getOrCreateWallet(teacherId);

    if (wallet.balance < amount) {
      throw new BadRequestException('Insufficient wallet balance');
    }

    // Check for existing pending payout
    const pendingPayout = await this.prisma.payoutRequest.findFirst({
      where: {
        teacherId,
        status: 'PENDING',
      },
    });

    if (pendingPayout) {
      throw new BadRequestException('You already have a pending payout request');
    }

    // Debit from wallet
    await this.debitWallet(teacherId, amount, `Payout request for ${amount}`);

    // Create payout request
    const payoutRequest = await this.prisma.payoutRequest.create({
      data: {
        teacherId,
        walletId: wallet.id,
        amount,
        status: 'PENDING',
      },
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
    });

    return payoutRequest;
  }

  async approvePayout(payoutId: string, adminId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout request is not pending');
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: 'APPROVED',
        approvedAt: new Date(),
        approvedBy: adminId,
      },
    });

    return updated;
  }

  async rejectPayout(payoutId: string, adminId: string, reason: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== 'PENDING') {
      throw new BadRequestException('Payout request is not pending');
    }

    // Return money to wallet balance
    await this.prisma.teacherWallet.update({
      where: { id: payout.walletId },
      data: {
        balance: {
          increment: payout.amount,
        },
        pendingBalance: {
          decrement: payout.amount,
        },
      },
    });

    const updated = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: 'REJECTED',
        approvedAt: new Date(),
        approvedBy: adminId,
        rejectionReason: reason,
      },
    });

    return updated;
  }

  async completePayout(payoutId: string) {
    const payout = await this.prisma.payoutRequest.findUnique({
      where: { id: payoutId },
      include: {
        wallet: true,
      },
    });

    if (!payout) {
      throw new NotFoundException('Payout request not found');
    }

    if (payout.status !== 'APPROVED') {
      throw new BadRequestException('Payout request is not approved');
    }

    const updated = await this.prisma.payoutRequest.update({
      where: { id: payoutId },
      data: {
        status: 'COMPLETED',
        processedAt: new Date(),
      },
    });

    // Update wallet pending balance
    await this.prisma.teacherWallet.update({
      where: { id: payout.walletId },
      data: {
        pendingBalance: {
          decrement: payout.amount,
        },
      },
    });

    return updated;
  }
}



