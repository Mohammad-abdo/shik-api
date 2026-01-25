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
exports.FinanceService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let FinanceService = class FinanceService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async getFinanceStatistics() {
        const [totalRevenue, totalPayouts, pendingPayouts, totalTeachers, activeWallets,] = await Promise.all([
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
    async getPayouts(filters) {
        const where = {};
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
    async getRevenueReport(startDate, endDate) {
        const revenue = await this.prisma.platformRevenue.findMany({
            where: {
                createdAt: {
                    gte: startDate,
                    lte: endDate,
                },
            },
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
    async getTeacherEarnings(teacherId, startDate, endDate) {
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
        const where = { walletId: wallet.id };
        if (startDate || endDate) {
            where.createdAt = {};
            if (startDate)
                where.createdAt.gte = startDate;
            if (endDate)
                where.createdAt.lte = endDate;
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
};
exports.FinanceService = FinanceService;
exports.FinanceService = FinanceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], FinanceService);
//# sourceMappingURL=finance.service.js.map