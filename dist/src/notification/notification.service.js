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
var NotificationService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");
let NotificationService = NotificationService_1 = class NotificationService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.logger = new common_1.Logger(NotificationService_1.name);
        try {
            this.fcmApp = admin.initializeApp({
                credential: admin.credential.cert({
                    projectId: this.config.get('FCM_PROJECT_ID'),
                }),
            });
        }
        catch (error) {
            console.warn('Firebase not configured, push notifications disabled');
        }
        this.emailTransporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST'),
            port: this.config.get('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASS'),
            },
        });
    }
    async createNotification(userId, type, title, message, data, sentById) {
        const notification = await this.prisma.notification.create({
            data: {
                userId,
                type: type,
                title,
                message,
                data: data || {},
                sentById,
            },
        });
        await this.sendPushNotification(userId, title, message, data);
        const importantTypes = [
            client_1.NotificationType.BOOKING_CONFIRMED,
            client_1.NotificationType.BOOKING_CANCELLED,
            client_1.NotificationType.PAYMENT_RECEIVED,
        ];
        if (importantTypes.includes(type)) {
            await this.sendEmailNotification(userId, title, message);
        }
        return notification;
    }
    async getUserNotifications(userId, unreadOnly = false) {
        const where = { userId };
        if (unreadOnly) {
            where.isRead = false;
        }
        return this.prisma.notification.findMany({
            where,
            include: {
                sentBy: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                    },
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
            take: 50,
        });
    }
    async markAsRead(notificationId, userId) {
        const notification = await this.prisma.notification.findUnique({
            where: { id: notificationId },
        });
        if (!notification || notification.userId !== userId) {
            throw new Error('Notification not found or access denied');
        }
        return this.prisma.notification.update({
            where: { id: notificationId },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async markAllAsRead(userId) {
        return this.prisma.notification.updateMany({
            where: {
                userId,
                isRead: false,
            },
            data: {
                isRead: true,
                readAt: new Date(),
            },
        });
    }
    async sendPushNotification(userId, title, body, data) {
        if (!this.fcmApp) {
            return;
        }
        try {
        }
        catch (error) {
            console.error('Error sending push notification:', error);
        }
    }
    async sendEmailNotification(userId, subject, message) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user || !user.email) {
            return;
        }
        try {
            await this.emailTransporter.sendMail({
                from: this.config.get('SMTP_FROM'),
                to: user.email,
                subject: `Shaykhi: ${subject}`,
                html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>${subject}</h2>
            <p>${message}</p>
            <p>Best regards,<br>The Shaykhi Team</p>
          </div>
        `,
            });
        }
        catch (error) {
            console.error('Error sending email notification:', error);
        }
    }
    async sendNotification(dto, sentById) {
        const userIds = dto.userIds || (dto.userId ? [dto.userId] : []);
        if (userIds.length === 0) {
            throw new common_1.BadRequestException('No users specified');
        }
        const notifications = await Promise.all(userIds.map((userId) => this.createNotification(userId, dto.type, dto.title, dto.message, dto.data, sentById)));
        return { notifications, count: notifications.length };
    }
    async broadcastNotification(dto, sentById) {
        const where = {};
        if (dto.roles && dto.roles.length > 0) {
            where.role = { in: dto.roles };
        }
        const users = await this.prisma.user.findMany({
            where,
            select: { id: true },
        });
        const notifications = await Promise.all(users.map((user) => this.createNotification(user.id, dto.type, dto.title, dto.message, dto.data, sentById)));
        return { notifications, count: notifications.length };
    }
};
exports.NotificationService = NotificationService;
exports.NotificationService = NotificationService = NotificationService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], NotificationService);
//# sourceMappingURL=notification.service.js.map