import { PrismaService } from '../prisma/prisma.service';
import { CreateReviewDto } from './dto';
export declare class ReviewService {
    private prisma;
    constructor(prisma: PrismaService);
    create(bookingId: string, studentId: string, dto: CreateReviewDto): Promise<{
        student: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        teacherId: string;
        studentId: string;
        bookingId: string;
        comment: string | null;
    }>;
    findByTeacher(teacherId: string): Promise<({
        booking: {
            id: string;
            date: Date;
        };
        student: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        teacherId: string;
        studentId: string;
        bookingId: string;
        comment: string | null;
    })[]>;
    update(bookingId: string, studentId: string, dto: CreateReviewDto): Promise<{
        student: {
            id: string;
            firstName: string;
            lastName: string;
            avatar: string;
        };
    } & {
        id: string;
        createdAt: Date;
        updatedAt: Date;
        rating: number;
        teacherId: string;
        studentId: string;
        bookingId: string;
        comment: string | null;
    }>;
    delete(bookingId: string, studentId: string): Promise<{
        message: string;
    }>;
    private updateTeacherRating;
}
