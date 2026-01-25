import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateBookingDto } from './dto';
import { NotificationService } from '../notification/notification.service';
import { BookingStatus } from '@prisma/client';

@Injectable()
export class BookingService {
  constructor(
    private prisma: PrismaService,
    private notificationService: NotificationService,
  ) {}

  async create(studentId: string, dto: CreateBookingDto) {
    // Verify teacher exists and is approved
    const teacher = await this.prisma.teacher.findUnique({
      where: { id: dto.teacherId },
      include: { user: true },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (!teacher.isApproved) {
      throw new BadRequestException('Teacher is not approved');
    }

    // Calculate price
    const price = teacher.hourlyRate * dto.duration;
    const discount = dto.discount || 0;
    const totalPrice = price - discount;

    // Create booking
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
        status: BookingStatus.PENDING,
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

    // Notify teacher
    await this.notificationService.createNotification(
      teacher.userId,
      'BOOKING_REQUEST' as any,
      'New Booking Request',
      `You have a new booking request from ${booking.student.firstName} ${booking.student.lastName}`,
      { bookingId: booking.id },
    );

    return booking;
  }

  async findOne(id: string, userId: string, userRole: string) {
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
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
      throw new ForbiddenException('You do not have access to this booking');
    }

    return booking;
  }

  async findByStudent(studentId: string, status?: BookingStatus) {
    const where: any = { studentId };
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

  async findByTeacher(teacherId: string, status?: BookingStatus) {
    const where: any = { teacherId };
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

  async confirm(bookingId: string, teacherId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
      throw new ForbiddenException('You can only confirm your own bookings');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in pending status');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CONFIRMED,
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

    // Notify student
    await this.notificationService.createNotification(
      booking.studentId,
      'BOOKING_CONFIRMED' as any,
      'Booking Confirmed',
      `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been confirmed`,
      { bookingId: updated.id },
    );

    return updated;
  }

  async cancel(bookingId: string, userId: string, userRole: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    // Check permissions
    if (userRole !== 'ADMIN' && booking.studentId !== userId && booking.teacher.userId !== userId) {
      throw new ForbiddenException('You can only cancel your own bookings');
    }

    if (booking.status === BookingStatus.COMPLETED || booking.status === BookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot cancel this booking');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.CANCELLED,
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

    // Notify the other party
    const notifyUserId = booking.studentId === userId ? booking.teacher.userId : booking.studentId;
    const notifyName =
      booking.studentId === userId
        ? `${updated.teacher.user.firstName} ${updated.teacher.user.lastName}`
        : `${updated.student.firstName} ${updated.student.lastName}`;

    await this.notificationService.createNotification(
      notifyUserId,
      'BOOKING_CANCELLED' as any,
      'Booking Cancelled',
      `Your booking with ${notifyName} has been cancelled`,
      { bookingId: updated.id },
    );

    return updated;
  }

  async reject(bookingId: string, teacherId: string, userId: string) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.teacherId !== teacherId || booking.teacher.userId !== userId) {
      throw new ForbiddenException('You can only reject your own bookings');
    }

    if (booking.status !== BookingStatus.PENDING) {
      throw new BadRequestException('Booking is not in pending status');
    }

    const updated = await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: BookingStatus.REJECTED,
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

    // Notify student
    await this.notificationService.createNotification(
      booking.studentId,
      'BOOKING_REJECTED' as any,
      'Booking Rejected',
      `Your booking with ${updated.teacher.user.firstName} ${updated.teacher.user.lastName} has been rejected`,
      { bookingId: updated.id },
    );

    return updated;
  }
}
