import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class WalletService {
    private prisma;
    private config;
    private readonly platformFeePercentage;
    constructor(prisma: PrismaService, config: ConfigService);
    getOrCreateWallet(teacherId: string): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
        }[];
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    creditWallet(teacherId: string, amount: number, bookingId: string, paymentId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    debitWallet(teacherId: string, amount: number, description: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        balance: number;
        pendingBalance: number;
        totalEarned: number;
        isActive: boolean;
    }>;
    getWalletTransactions(teacherId: string, page?: number, limit?: number): Promise<{
        transactions: {
            id: string;
            createdAt: Date;
            description: string;
            paymentId: string | null;
            type: string;
            bookingId: string | null;
            amount: number;
            walletId: string;
        }[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    createPayoutRequest(teacherId: string, amount: number): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            introVideoUrl: string | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        approvedAt: Date | null;
        approvedBy: string | null;
        teacherId: string;
        amount: number;
        walletId: string;
        requestedAt: Date;
        processedAt: Date | null;
        rejectionReason: string | null;
    }>;
    approvePayout(payoutId: string, adminId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        approvedAt: Date | null;
        approvedBy: string | null;
        teacherId: string;
        amount: number;
        walletId: string;
        requestedAt: Date;
        processedAt: Date | null;
        rejectionReason: string | null;
    }>;
    rejectPayout(payoutId: string, adminId: string, reason: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        approvedAt: Date | null;
        approvedBy: string | null;
        teacherId: string;
        amount: number;
        walletId: string;
        requestedAt: Date;
        processedAt: Date | null;
        rejectionReason: string | null;
    }>;
    completePayout(payoutId: string): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PayoutStatus;
        createdAt: Date;
        updatedAt: Date;
        approvedAt: Date | null;
        approvedBy: string | null;
        teacherId: string;
        amount: number;
        walletId: string;
        requestedAt: Date;
        processedAt: Date | null;
        rejectionReason: string | null;
    }>;
}
