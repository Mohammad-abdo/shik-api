import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto';
export declare class ReviewController {
    private readonly reviewService;
    constructor(reviewService: ReviewService);
    create(bookingId: string, user: any, dto: CreateReviewDto): Promise<{
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
    update(bookingId: string, user: any, dto: CreateReviewDto): Promise<{
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
    delete(bookingId: string, user: any): Promise<{
        message: string;
    }>;
}
