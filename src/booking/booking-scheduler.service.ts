import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';

@Injectable()
export class BookingSchedulerService {
  private readonly logger = new Logger(BookingSchedulerService.name);

  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  // Run every hour to check for upcoming bookings
  @Cron(CronExpression.EVERY_HOUR)
  async sendBookingReminders() {
    this.logger.log('Checking for upcoming bookings...');

    const oneHourFromNow = new Date();
    oneHourFromNow.setHours(oneHourFromNow.getHours() + 1);

    const upcomingBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: new Date(),
          lte: oneHourFromNow,
        },
      },
      include: {
        student: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const booking of upcomingBookings) {
      // Send reminder to student
      await this.notificationService.createNotification(
        booking.studentId,
        'SESSION_REMINDER',
        'تذكير بالجلسة',
        `لديك جلسة مع ${booking.teacher.user.firstName} ${booking.teacher.user.lastName} خلال ساعة`,
        { bookingId: booking.id },
      );

      // Send reminder to teacher
      await this.notificationService.createNotification(
        booking.teacher.userId,
        'SESSION_REMINDER',
        'تذكير بالجلسة',
        `لديك جلسة مع ${booking.student.firstName} ${booking.student.lastName} خلال ساعة`,
        { bookingId: booking.id },
      );
    }

    this.logger.log(`Sent ${upcomingBookings.length} booking reminders`);
  }

  // Run every 15 minutes to check for no-shows
  @Cron('*/15 * * * *')
  async handleNoShows() {
    this.logger.log('Checking for no-shows...');

    const now = new Date();
    const fifteenMinutesAgo = new Date(now.getTime() - 15 * 60 * 1000);

    const noShowBookings = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          lte: fifteenMinutesAgo,
        },
        session: null, // No session created means no-show
      },
      include: {
        student: true,
        teacher: {
          include: {
            user: true,
          },
        },
      },
    });

    for (const booking of noShowBookings) {
      // Auto-cancel after 15 minutes of no-show
      await this.prisma.booking.update({
        where: { id: booking.id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancelledBy: 'SYSTEM',
        },
      });

      // Notify both parties
      await this.notificationService.createNotification(
        booking.studentId,
        'BOOKING_CANCELLED',
        'تم إلغاء الحجز',
        'تم إلغاء الحجز تلقائياً بسبب عدم الحضور',
        { bookingId: booking.id },
      );

      await this.notificationService.createNotification(
        booking.teacher.userId,
        'BOOKING_CANCELLED',
        'تم إلغاء الحجز',
        'تم إلغاء الحجز تلقائياً بسبب عدم حضور الطالب',
        { bookingId: booking.id },
      );
    }

    this.logger.log(`Handled ${noShowBookings.length} no-shows`);
  }

  // Auto-create session when booking time arrives
  @Cron('*/5 * * * *')
  async autoCreateSessions() {
    this.logger.log('Checking for sessions to create...');

    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const bookingsToStart = await this.prisma.booking.findMany({
      where: {
        status: 'CONFIRMED',
        date: {
          gte: fiveMinutesAgo,
          lte: now,
        },
        session: null,
        payment: {
          status: 'COMPLETED',
        },
      },
    });

    for (const booking of bookingsToStart) {
      // Create session automatically
      const roomId = `room_${booking.id}_${Date.now()}`;

      await this.prisma.session.create({
        data: {
          bookingId: booking.id,
          type: 'VIDEO',
          roomId,
          startedAt: new Date(),
        },
      });

      this.logger.log(`Auto-created session for booking ${booking.id}`);
    }
  }
}

