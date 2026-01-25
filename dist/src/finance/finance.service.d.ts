import { PrismaService } from '../prisma/prisma.service';
export declare class FinanceService {
    private prisma;
    constructor(prisma: PrismaService);
    getFinanceStatistics(): Promise<{
        totalRevenue: number;
        totalPayouts: number;
        pendingPayouts: number;
        netRevenue: number;
        totalTeachers: number;
        activeWallets: number;
    }>;
    getPayouts(filters: {
        status?: string;
        teacherId?: string;
        page?: number;
        limit?: number;
    }): Promise<{
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
                introVideoUrl: string | null;
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
    getRevenueReport(startDate: Date, endDate: Date): Promise<{
        revenue: {
            id: string;
            createdAt: Date;
            bookingId: string;
            amount: number;
            teacherEarning: number;
        }[];
        summary: {
            totalRevenue: number;
            totalTeacherEarnings: number;
            totalBookings: number;
            averageRevenuePerBooking: number;
        };
    }>;
    getTeacherEarnings(teacherId: string, startDate?: Date, endDate?: Date): Promise<{
        totalEarned: number;
        currentBalance: number;
        pendingBalance: number;
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
    }>;
}
