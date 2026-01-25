"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WalletService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let WalletService = class WalletService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.platformFeePercentage = parseFloat(this.config.get('PLATFORM_FEE_PERCENTAGE') || '20');
    }
    async getOrCreateWallet(teacherId) {
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
    async creditWallet(teacherId, amount, bookingId, paymentId) {
        const wallet = await this.getOrCreateWallet(teacherId);
        const platformFee = (amount * this.platformFeePercentage) / 100;
        const teacherEarning = amount - platformFee;
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
        await this.prisma.platformRevenue.create({
            data: {
                bookingId,
                amount: platformFee,
                teacherEarning,
            },
        });
        return updatedWallet;
    }
    async debitWallet(teacherId, amount, description) {
        const wallet = await this.getOrCreateWallet(teacherId);
        if (wallet.balance < amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
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
    async getWalletTransactions(teacherId, page = 1, limit = 20) {
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
    async createPayoutRequest(teacherId, amount) {
        const wallet = await this.getOrCreateWallet(teacherId);
        if (wallet.balance < amount) {
            throw new common_1.BadRequestException('Insufficient wallet balance');
        }
        const pendingPayout = await this.prisma.payoutRequest.findFirst({
            where: {
                teacherId,
                status: 'PENDING',
            },
        });
        if (pendingPayout) {
            throw new common_1.BadRequestException('You already have a pending payout request');
        }
        await this.debitWallet(teacherId, amount, `Payout request for ${amount}`);
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
    async approvePayout(payoutId, adminId) {
        const payout = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: {
                wallet: true,
            },
        });
        if (!payout) {
            throw new common_1.NotFoundException('Payout request not found');
        }
        if (payout.status !== 'PENDING') {
            throw new common_1.BadRequestException('Payout request is not pending');
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
    async rejectPayout(payoutId, adminId, reason) {
        const payout = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: {
                wallet: true,
            },
        });
        if (!payout) {
            throw new common_1.NotFoundException('Payout request not found');
        }
        if (payout.status !== 'PENDING') {
            throw new common_1.BadRequestException('Payout request is not pending');
        }
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
    async completePayout(payoutId) {
        const payout = await this.prisma.payoutRequest.findUnique({
            where: { id: payoutId },
            include: {
                wallet: true,
            },
        });
        if (!payout) {
            throw new common_1.NotFoundException('Payout request not found');
        }
        if (payout.status !== 'APPROVED') {
            throw new common_1.BadRequestException('Payout request is not approved');
        }
        const updated = await this.prisma.payoutRequest.update({
            where: { id: payoutId },
            data: {
                status: 'COMPLETED',
                processedAt: new Date(),
            },
        });
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
};
exports.WalletService = WalletService;
exports.WalletService = WalletService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], WalletService);
//# sourceMappingURL=wallet.service.js.map