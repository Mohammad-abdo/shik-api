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
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const notification_service_1 = require("../notification/notification.service");
const client_1 = require("@prisma/client");
let BookingService = class BookingService {
    constructor(prisma, notificationService) {
        this.prisma = prisma;
        this.notificationService = notificationService;
    }
    async create(studentId, dto) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { id: dto.teacherId },
            include: { user: true },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        if (!teacher.isApproved) {
            throw new common_1.BadRequestException('Teacher is not approved');
        }
        const price = teacher.hourlyRate * dto.duration;
        const discount = dto.discount || 0;
        const totalPrice = price - discount;
        const booking = await this.prisma.booking.create({
            data: {
                studentId,
                teacherId: dto.teacherId,
                date: new Date(dto.date),
                startTime: dto.startTime,
                duration: dto.duration,
                price,
                discount,
                totalPrice,
                notes: dto.notes,
                status: client_1.BookingStatus.PENDING,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
            },
        });
        await this.notificationService.createNotification(teacher.userId, 'BOOKING_REQUEST', 'New Booking Request', `You have a new booking request from ${booking.student.firstName} ${booking.student.lastName}`, { bookingId: booking.id });
        return booking;
    }
    async findOne(id, userId, userRole) {
        const booking = await this.prisma.booking.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        avatar: true,
                        phone: true,
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
                                avatar: true,
                                phone: true,
                            },
                        },
                    },
                },
                payment: true,
                session: true,
                review: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You do not have access to this booking');
        }
        return booking;
    }
    async findByStudent(studentId, status) {
        const where = { studentId };
        if (status) {
            where.status = status;
        }
        return this.prisma.booking.findMany({
            where,
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                    },
                },
                payment: true,
                session: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }
    async findByTeacher(teacherId, status) {
        const where = { teacherId };
        if (status) {
            where.status = status;
        }
        return this.prisma.booking.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        avatar: true,
                        email: true,
                    },
                },
                payment: true,
                session: true,
            },
            orderBy: {
                date: 'desc',
            },
        });
    }
    async confirm(bookingId, teacherId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacher: true,
                student: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You can only confirm your own bookings');
        }
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Booking is not in pending status');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CONFIRMED,
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
        await this.notificationService.createNotification(booking.studentId, 'BOOKING_CONFIRMED', 'Booking Confirmed', `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been confirmed`, { bookingId: updated.id });
        return updated;
    }
    async cancel(bookingId, userId, userRole) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacher: true,
                student: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You can only cancel your own bookings');
        }
        if (booking.status === client_1.BookingStatus.COMPLETED || booking.status === client_1.BookingStatus.CANCELLED) {
            throw new common_1.BadRequestException('Cannot cancel this booking');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.CANCELLED,
                cancelledAt: new Date(),
                cancelledBy: userId,
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
        const notifyUserId = booking.studentId === userId ? booking.teacher.userId : booking.studentId;
        const notifyName = booking.studentId === userId
            ? `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`
            : `${updated.student.firstName} ${updated.student.lastName}`;
        await this.notificationService.createNotification(notifyUserId, 'BOOKING_CANCELLED', 'Booking Cancelled', `Your booking with ${notifyName} has been cancelled`, { bookingId: updated.id });
        return updated;
    }
    async reject(bookingId, teacherId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacher: true,
                student: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
            throw new common_1.ForbiddenException('You can only reject your own bookings');
        }
        if (booking.status !== client_1.BookingStatus.PENDING) {
            throw new common_1.BadRequestException('Booking is not in pending status');
        }
        const updated = await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: client_1.BookingStatus.REJECTED,
                cancelledAt: new Date(),
                cancelledBy: userId,
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
        await this.notificationService.createNotification(booking.studentId, 'BOOKING_REJECTED', 'Booking Rejected', `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been rejected`, { bookingId: updated.id });
        return updated;
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        notification_service_1.NotificationService])
], BookingService);
//# sourceMappingURL=booking.service.js.map