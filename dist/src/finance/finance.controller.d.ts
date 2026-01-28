import { FinanceService } from './finance.service';
import { WalletService } from './wallet.service';
import { RejectPayoutDto, CreatePayoutRequestDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class FinanceController {
    private readonly financeService;
    private readonly walletService;
    private readonly prisma;
    constructor(financeService: FinanceService, walletService: WalletService, prisma: PrismaService);
    getStatistics(): Promise<{
        totalRevenue: number;
        totalPayouts: number;
        pendingPayouts: number;
        netRevenue: number;
        totalTeachers: number;
        activeWallets: number;
    }>;
    getPayouts(status?: string, teacherId?: string, page?: string, limit?: string): Promise<{
        payouts: ({
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
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    approvePayout(id: string, user: any): Promise<{
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
    rejectPayout(id: string, user: any, dto: RejectPayoutDto): Promise<{
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
    completePayout(id: string): Promise<{
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
    getWallet(user: any): Promise<{
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
    getWalletTransactions(user: any, page?: string, limit?: string): Promise<{
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
    createPayoutRequest(user: any, dto: CreatePayoutRequestDto): Promise<{
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
}
