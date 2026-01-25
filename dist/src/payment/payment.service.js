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
exports.PaymentService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const stripe_1 = require("stripe");
const client_1 = require("@prisma/client");
let PaymentService = class PaymentService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.stripe = new stripe_1.default(this.config.get('STRIPE_SECRET_KEY'), {
            apiVersion: '2023-10-16',
        });
    }
    async createPaymentIntent(bookingId, dto) {
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
        if (booking.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException('Booking must be confirmed before payment');
        }
        const existingPayment = await this.prisma.payment.findUnique({
            where: { bookingId },
        });
        if (existingPayment && existingPayment.status === 'COMPLETED') {
            throw new common_1.BadRequestException('Payment already completed');
        }
        const paymentIntent = await this.stripe.paymentIntents.create({
            amount: Math.round(booking.totalPrice * 100),
            currency: this.config.get('STRIPE_CURRENCY') || 'usd',
            payment_method_types: ['card'],
            metadata: {
                bookingId: booking.id,
                studentId: booking.studentId,
                teacherId: booking.teacherId,
            },
        });
        const payment = await this.prisma.payment.upsert({
            where: { bookingId },
            create: {
                bookingId,
                amount: booking.totalPrice,
                currency: this.config.get('STRIPE_CURRENCY') || 'USD',
                status: client_1.PaymentStatus.PENDING,
                paymentMethod: dto.paymentMethod,
                stripeIntentId: paymentIntent.id,
            },
            update: {
                stripeIntentId: paymentIntent.id,
                paymentMethod: dto.paymentMethod,
            },
        });
        return {
            paymentIntentId: paymentIntent.id,
            clientSecret: paymentIntent.client_secret,
            payment,
        };
    }
    async handleWebhook(signature, payload) {
        const webhookSecret = this.config.get('STRIPE_WEBHOOK_SECRET');
        let event;
        try {
            event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
        }
        catch (err) {
            throw new common_1.BadRequestException(`Webhook signature verification failed: ${err.message}`);
        }
        switch (event.type) {
            case 'payment_intent.succeeded':
                await this.handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await this.handlePaymentFailure(event.data.object);
                break;
            default:
                console.log(`Unhandled event type ${event.type}`);
        }
        return { received: true };
    }
    async handlePaymentSuccess(paymentIntent) {
        const bookingId = paymentIntent.metadata.bookingId;
        if (!bookingId) {
            return;
        }
        const payment = await this.prisma.payment.update({
            where: { bookingId },
            data: {
                status: client_1.PaymentStatus.COMPLETED,
                stripePaymentId: paymentIntent.id,
            },
            include: {
                booking: {
                    include: {
                        teacher: true,
                    },
                },
            },
        });
        if (payment.booking.teacher) {
            const { WalletService } = await Promise.resolve().then(() => require('../finance/wallet.service'));
            const walletService = new WalletService(this.prisma, this.config);
            await walletService.creditWallet(payment.booking.teacherId, payment.amount, bookingId, payment.id);
        }
    }
    async handlePaymentFailure(paymentIntent) {
        const bookingId = paymentIntent.metadata.bookingId;
        if (!bookingId) {
            return;
        }
        await this.prisma.payment.update({
            where: { bookingId },
            data: {
                status: client_1.PaymentStatus.FAILED,
            },
        });
    }
    async getPayment(bookingId) {
        const payment = await this.prisma.payment.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true,
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
                                    },
                                },
                            },
                        },
                    },
                },
            },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        return payment;
    }
    async refundPayment(bookingId, amount) {
        const payment = await this.prisma.payment.findUnique({
            where: { bookingId },
        });
        if (!payment) {
            throw new common_1.NotFoundException('Payment not found');
        }
        if (payment.status !== client_1.PaymentStatus.COMPLETED) {
            throw new common_1.BadRequestException('Payment is not completed');
        }
        if (!payment.stripePaymentId) {
            throw new common_1.BadRequestException('Stripe payment ID not found');
        }
        const refundAmount = amount ? Math.round(amount * 100) : undefined;
        const refund = await this.stripe.refunds.create({
            payment_intent: payment.stripePaymentId,
            amount: refundAmount,
        });
        const updatedPayment = await this.prisma.payment.update({
            where: { bookingId },
            data: {
                status: client_1.PaymentStatus.REFUNDED,
                refundedAt: new Date(),
                refundAmount: refund.amount / 100,
            },
        });
        return updatedPayment;
    }
};
exports.PaymentService = PaymentService;
exports.PaymentService = PaymentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], PaymentService);
//# sourceMappingURL=payment.service.js.map