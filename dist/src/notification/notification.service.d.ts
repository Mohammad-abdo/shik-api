import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
export declare class NotificationService {
    private prisma;
    private config;
    private readonly logger;
    private fcmApp;
    private emailTransporter;
    constructor(prisma: PrismaService, config: ConfigService);
    createNotification(userId: string, type: NotificationType | string, title: string, message: string, data?: any, sentById?: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        readAt: Date | null;
        sentById: string | null;
    }>;
    getUserNotifications(userId: string, unreadOnly?: boolean): Promise<({
        sentBy: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        readAt: Date | null;
        sentById: string | null;
    })[]>;
    markAsRead(notificationId: string, userId: string): Promise<{
        id: string;
        createdAt: Date;
        userId: string;
        data: string | null;
        title: string;
        type: import(".prisma/client").$Enums.NotificationType;
        message: string;
        isRead: boolean;
        readAt: Date | null;
        sentById: string | null;
    }>;
    markAllAsRead(userId: string): Promise<import(".prisma/client").Prisma.BatchPayload>;
    private sendPushNotification;
    private sendEmailNotification;
    sendNotification(dto: any, sentById: string): Promise<{
        notifications: any[];
        count: number;
    }>;
    broadcastNotification(dto: any, sentById: string): Promise<{
        notifications: {
            id: string;
            createdAt: Date;
            userId: string;
            data: string | null;
            title: string;
            type: import(".prisma/client").$Enums.NotificationType;
            message: string;
            isRead: boolean;
            readAt: Date | null;
            sentById: string | null;
        }[];
        count: number;
    }>;
}
