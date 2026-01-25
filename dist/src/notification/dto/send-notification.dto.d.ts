import { NotificationType } from '@prisma/client';
export declare enum NotificationChannel {
    EMAIL = "EMAIL",
    SMS = "SMS",
    PUSH = "PUSH",
    IN_APP = "IN_APP"
}
export declare class SendNotificationDto {
    userId?: string;
    userIds?: string[];
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    channels?: NotificationChannel[];
}
export declare class BroadcastNotificationDto {
    type: NotificationType;
    title: string;
    message: string;
    data?: any;
    channels?: NotificationChannel[];
    roles?: string[];
}
