import { Injectable, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);
  private fcmApp: admin.app.App;
  private emailTransporter;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize Firebase Admin
    try {
      this.fcmApp = admin.initializeApp({
        credential: admin.credential.cert({
          projectId: this.config.get<string>('FCM_PROJECT_ID'),
          // Add other Firebase credentials if needed
        }),
      });
    } catch {
      this.logger.warn('Firebase not configured, push notifications disabled');
    }

    // Initialize email transporter
    this.emailTransporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  async createNotification(
    userId: string,
    type: NotificationType | string,
    title: string,
    message: string,
    data?: any,
    sentById?: string,
  ) {
    const notification = await this.prisma.notification.create({
      data: {
        userId,
        type: type as NotificationType,
        title,
        message,
        data: data || {},
        sentById,
      },
    });

    // Send push notification
    await this.sendPushNotification(userId, title, message, data);

    // Send email notification for important events
    const importantTypes: (NotificationType | string)[] = [
      NotificationType.BOOKING_CONFIRMED,
      NotificationType.BOOKING_CANCELLED,
      NotificationType.PAYMENT_RECEIVED,
    ];
    if (importantTypes.includes(type as NotificationType)) {
      await this.sendEmailNotification(userId, title, message);
    }

    return notification;
  }

  async getUserNotifications(userId: string, unreadOnly: boolean = false) {
    const where: any = { userId };
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

  async markAsRead(notificationId: string, userId: string) {
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

  async markAllAsRead(userId: string) {
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

  private async sendPushNotification(userId: string, title: string, body: string, data?: any) {
    if (!this.fcmApp) {
      return;
    }

    // Get user's FCM token from database (you would need to add this field)
    // For now, this is a placeholder
    try {
      // In a real implementation, you would store FCM tokens in the user model
      // const user = await this.prisma.user.findUnique({ where: { id: userId } });
      // if (user.fcmToken) {
      //   await admin.messaging().send({
      //     token: user.fcmToken,
      //     notification: { title, body },
      //     data: data || {},
      //   });
      // }
    } catch (error) {
      this.logger.warn('Error sending push notification', error instanceof Error ? error.message : String(error));
    }
  }

  private async sendEmailNotification(userId: string, subject: string, message: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user || !user.email) {
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: this.config.get<string>('SMTP_FROM'),
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
    } catch (error) {
      this.logger.warn('Error sending email notification', error instanceof Error ? error.message : String(error));
    }
  }

  async sendNotification(dto: any, sentById: string) {
    const userIds = dto.userIds || (dto.userId ? [dto.userId] : []);
    
    if (userIds.length === 0) {
      throw new BadRequestException('No users specified');
    }

    const notifications = await Promise.all(
      userIds.map((userId: string) =>
        this.createNotification(
          userId,
          dto.type,
          dto.title,
          dto.message,
          dto.data,
          sentById,
        ),
      ),
    );

    return { notifications, count: notifications.length };
  }

  async broadcastNotification(dto: any, sentById: string) {
    const where: any = {};
    
    if (dto.roles && dto.roles.length > 0) {
      where.role = { in: dto.roles };
    }

    const users = await this.prisma.user.findMany({
      where,
      select: { id: true },
    });

    const notifications = await Promise.all(
      users.map((user) =>
        this.createNotification(
          user.id,
          dto.type,
          dto.title,
          dto.message,
          dto.data,
          sentById,
        ),
      ),
    );

    return { notifications, count: notifications.length };
  }
}

