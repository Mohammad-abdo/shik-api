import { NotificationService } from './notification.service';
import { SendNotificationDto, BroadcastNotificationDto } from './dto/send-notification.dto';
export declare class NotificationController {
    private readonly notificationService;
    constructor(notificationService: NotificationService);
    getNotifications(user: any, unreadOnly?: string): Promise<({
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
    markAsRead(id: string, user: any): Promise<{
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
    markAllAsRead(user: any): Promise<import(".prisma/client").Prisma.BatchPayload>;
    sendNotification(dto: SendNotificationDto, user: any): Promise<{
        notifications: any[];
        count: number;
    }>;
    broadcastNotification(dto: BroadcastNotificationDto, user: any): Promise<{
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
