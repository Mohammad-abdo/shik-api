import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';

@Injectable()
export class ReviewService {
  constructor(private prisma: PrismaService) {}

  async create(bookingId: string, studentId: string, dto: CreateReviewDto) {
    // Verify booking exists and belongs to student
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacher: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.studentId !== studentId) {
      throw new ForbiddenException('You can only review your own bookings');
    }

    if (booking.status !== 'COMPLETED') {
      throw new BadRequestException('Booking must be completed before leaving a review');
    }

    // Check if review already exists
    const existingReview = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (existingReview) {
      throw new BadRequestException('Review already exists for this booking');
    }

    // Create review
    const review = await this.prisma.review.create({
      data: {
        bookingId,
        studentId,
        teacherId: booking.teacherId,
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update teacher rating
    await this.updateTeacherRating(booking.teacherId);

    return review;
  }

  async findByTeacher(teacherId: string) {
    return this.prisma.review.findMany({
      where: { teacherId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
        booking: {
          select: {
            id: true,
            date: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async update(bookingId: string, studentId: string, dto: CreateReviewDto) {
    const review = await this.prisma.review.findUnique({
      where: { bookingId },
      include: {
        booking: true,
      },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.studentId !== studentId) {
      throw new ForbiddenException('You can only update your own reviews');
    }

    const updated = await this.prisma.review.update({
      where: { bookingId },
      data: {
        rating: dto.rating,
        comment: dto.comment,
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    // Update teacher rating
    await this.updateTeacherRating(review.teacherId);

    return updated;
  }

  async delete(bookingId: string, studentId: string) {
    const review = await this.prisma.review.findUnique({
      where: { bookingId },
    });

    if (!review) {
      throw new NotFoundException('Review not found');
    }

    if (review.studentId !== studentId) {
      throw new ForbiddenException('You can only delete your own reviews');
    }

    const teacherId = review.teacherId;

    await this.prisma.review.delete({
      where: { bookingId },
    });

    // Update teacher rating
    await this.updateTeacherRating(teacherId);

    return { message: 'Review deleted successfully' };
  }

  private async updateTeacherRating(teacherId: string) {
    const reviews = await this.prisma.review.findMany({
      where: { teacherId },
      select: { rating: true },
    });

    if (reviews.length === 0) {
      await this.prisma.teacher.update({
        where: { id: teacherId },
        data: {
          rating: 0,
          totalReviews: 0,
        },
      });
      return;
    }

    const averageRating =
      reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;

    await this.prisma.teacher.update({
      where: { id: teacherId },
      data: {
        rating: averageRating,
        totalReviews: reviews.length,
      },
    });
  }
}



