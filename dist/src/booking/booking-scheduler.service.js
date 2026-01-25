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
var BookingSchedulerService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingSchedulerService = void 0;
const common_1 = require("@nestjs/common");
const schedule_1 = require("@nestjs/schedule");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
let BookingSchedulerService = BookingSchedulerService_1 = class BookingSchedulerService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
        this.logger = new common_1.Logger(BookingSchedulerService_1.name);
    }
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
            await this.notificationService.createNotification(booking.studentId, 'SESSION_REMINDER', 'تذكير بالجلسة', `لديك جلسة مع ${booking.teacher.user.firstName} ${booking.teacher.user.lastName} خلال ساعة`, { bookingId: booking.id });
            await this.notificationService.createNotification(booking.teacher.userId, 'SESSION_REMINDER', 'تذكير بالجلسة', `لديك جلسة مع ${booking.student.firstName} ${booking.student.lastName} خلال ساعة`, { bookingId: booking.id });
        }
        this.logger.log(`Sent ${upcomingBookings.length} booking reminders`);
    }
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
                session: null,
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
            await this.prisma.booking.update({
                where: { id: booking.id },
                data: {
                    status: 'CANCELLED',
                    cancelledAt: new Date(),
                    cancelledBy: 'SYSTEM',
                },
            });
            await this.notificationService.createNotification(booking.studentId, 'BOOKING_CANCELLED', 'تم إلغاء الحجز', 'تم إلغاء الحجز تلقائياً بسبب عدم الحضور', { bookingId: booking.id });
            await this.notificationService.createNotification(booking.teacher.userId, 'BOOKING_CANCELLED', 'تم إلغاء الحجز', 'تم إلغاء الحجز تلقائياً بسبب عدم حضور الطالب', { bookingId: booking.id });
        }
        this.logger.log(`Handled ${noShowBookings.length} no-shows`);
    }
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
};
exports.BookingSchedulerService = BookingSchedulerService;
__decorate([
    (0, schedule_1.Cron)(schedule_1.CronExpression.EVERY_HOUR),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingSchedulerService.prototype, "sendBookingReminders", null);
__decorate([
    (0, schedule_1.Cron)('*/15 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingSchedulerService.prototype, "handleNoShows", null);
__decorate([
    (0, schedule_1.Cron)('*/5 * * * *'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingSchedulerService.prototype, "autoCreateSessions", null);
exports.BookingSchedulerService = BookingSchedulerService = BookingSchedulerService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], BookingSchedulerService);
//# sourceMappingURL=booking-scheduler.service.js.map