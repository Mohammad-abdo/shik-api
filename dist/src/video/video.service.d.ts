import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
export declare class VideoService {
    private prisma;
    private config;
    private readonly appId;
    private readonly appCertificate;
    constructor(prisma: PrismaService, config: ConfigService);
    createSession(bookingId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        updatedAt: Date;
        duration: number | null;
        type: import(".prisma/client").$Enums.SessionType;
        bookingId: string;
        startedAt: Date | null;
        roomId: string;
        agoraToken: string | null;
        endedAt: Date | null;
        recordingUrl: string | null;
    } | {
        token: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        duration: number | null;
        type: import(".prisma/client").$Enums.SessionType;
        bookingId: string;
        startedAt: Date | null;
        roomId: string;
        agoraToken: string | null;
        endedAt: Date | null;
        recordingUrl: string | null;
    }>;
    getSessionToken(bookingId: string, userId: string): Promise<{
        roomId: string;
        token: string;
        appId: string;
    }>;
    endSession(bookingId: string, userId: string): Promise<{
        message: string;
        duration: number;
    }>;
    getSessionHistory(userId: string, limit?: number): Promise<({
        booking: {
            teacher: {
                user: {
                    id: string;
                    firstName: string;
                    lastName: string;
                    avatar: string;
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
            student: {
                id: string;
                firstName: string;
                lastName: string;
                avatar: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        duration: number | null;
        type: import(".prisma/client").$Enums.SessionType;
        bookingId: string;
        startedAt: Date | null;
        roomId: string;
        agoraToken: string | null;
        endedAt: Date | null;
        recordingUrl: string | null;
    })[]>;
    private generateAgoraToken;
}
