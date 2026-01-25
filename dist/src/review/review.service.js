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
exports.ReviewService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let ReviewService = class ReviewService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async create(bookingId, studentId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacher: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.studentId !== studentId) {
            throw new common_1.ForbiddenException('You can only review your own bookings');
        }
        if (booking.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Booking must be completed before leaving a review');
        }
        const existingReview = await this.prisma.review.findUnique({
            where: { bookingId },
        });
        if (existingReview) {
            throw new common_1.BadRequestException('Review already exists for this booking');
        }
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
        await this.updateTeacherRating(booking.teacherId);
        return review;
    }
    async findByTeacher(teacherId) {
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
    async update(bookingId, studentId, dto) {
        const review = await this.prisma.review.findUnique({
            where: { bookingId },
            include: {
                booking: true,
            },
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.studentId !== studentId) {
            throw new common_1.ForbiddenException('You can only update your own reviews');
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
        await this.updateTeacherRating(review.teacherId);
        return updated;
    }
    async delete(bookingId, studentId) {
        const review = await this.prisma.review.findUnique({
            where: { bookingId },
        });
        if (!review) {
            throw new common_1.NotFoundException('Review not found');
        }
        if (review.studentId !== studentId) {
            throw new common_1.ForbiddenException('You can only delete your own reviews');
        }
        const teacherId = review.teacherId;
        await this.prisma.review.delete({
            where: { bookingId },
        });
        await this.updateTeacherRating(teacherId);
        return { message: 'Review deleted successfully' };
    }
    async updateTeacherRating(teacherId) {
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
        const averageRating = reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length;
        await this.prisma.teacher.update({
            where: { id: teacherId },
            data: {
                rating: averageRating,
                totalReviews: reviews.length,
            },
        });
    }
};
exports.ReviewService = ReviewService;
exports.ReviewService = ReviewService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], ReviewService);
//# sourceMappingURL=review.service.js.map