import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePaymentIntentDto } from './dto';
export declare class PaymentService {
    private prisma;
    private config;
    private stripe;
    constructor(prisma: PrismaService, config: ConfigService);
    createPaymentIntent(bookingId: string, dto: CreatePaymentIntentDto): Promise<{
        paymentIntentId: string;
        clientSecret: string;
        payment: {
            id: string;
            status: import(".prisma/client").$Enums.PaymentStatus;
            createdAt: Date;
            updatedAt: Date;
            bookingId: string;
            amount: number;
            currency: string;
            paymentMethod: string | null;
            stripePaymentId: string | null;
            stripeIntentId: string | null;
            receiptUrl: string | null;
            refundedAt: Date | null;
            refundAmount: number | null;
        };
    }>;
    handleWebhook(signature: string, payload: Buffer): Promise<{
        received: boolean;
    }>;
    private handlePaymentSuccess;
    private handlePaymentFailure;
    getPayment(bookingId: string): Promise<{
        booking: {
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                introVideoUrl: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            student: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.BookingStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            studentId: string;
            date: Date;
            startTime: string;
            duration: number;
            price: number;
            discount: number;
            totalPrice: number;
            notes: string | null;
            cancelledAt: Date | null;
            cancelledBy: string | null;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        amount: number;
        currency: string;
        paymentMethod: string | null;
        stripePaymentId: string | null;
        stripeIntentId: string | null;
        receiptUrl: string | null;
        refundedAt: Date | null;
        refundAmount: number | null;
    }>;
    refundPayment(bookingId: string, amount?: number): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.PaymentStatus;
        createdAt: Date;
        updatedAt: Date;
        bookingId: string;
        amount: number;
        currency: string;
        paymentMethod: string | null;
        stripePaymentId: string | null;
        stripeIntentId: string | null;
        receiptUrl: string | null;
        refundedAt: Date | null;
        refundAmount: number | null;
    }>;
}
