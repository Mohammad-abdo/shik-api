import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import Stripe from 'stripe';
import { CreatePaymentIntentDto } from './dto';
import { PaymentStatus } from '@prisma/client';

@Injectable()
export class PaymentService {
  private stripe: Stripe;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.stripe = new Stripe(this.config.get<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2023-10-16',
    });
  }

  async createPaymentIntent(bookingId: string, dto: CreatePaymentIntentDto) {
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

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking must be confirmed before payment');
    }

    // Check if payment already exists
    const existingPayment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (existingPayment && existingPayment.status === 'COMPLETED') {
      throw new BadRequestException('Payment already completed');
    }

    // Create Stripe payment intent
    const paymentIntent = await this.stripe.paymentIntents.create({
      amount: Math.round(booking.totalPrice * 100), // Convert to cents
      currency: this.config.get<string>('STRIPE_CURRENCY') || 'usd',
      payment_method_types: ['card'],
      metadata: {
        bookingId: booking.id,
        studentId: booking.studentId,
        teacherId: booking.teacherId,
      },
    });

    // Create or update payment record
    const payment = await this.prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalPrice,
        currency: this.config.get<string>('STRIPE_CURRENCY') || 'USD',
        status: PaymentStatus.PENDING,
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

  async handleWebhook(signature: string, payload: Buffer) {
    const webhookSecret = this.config.get<string>('STRIPE_WEBHOOK_SECRET');
    let event: Stripe.Event;

    try {
      event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (err) {
      throw new BadRequestException(`Webhook signature verification failed: ${err.message}`);
    }

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSuccess(event.data.object as Stripe.PaymentIntent);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailure(event.data.object as Stripe.PaymentIntent);
        break;
      default:
        console.log(`Unhandled event type ${event.type}`);
    }

    return { received: true };
  }

  private async handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
      return;
    }

    // Update payment status
    const payment = await this.prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.COMPLETED,
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

    // Credit teacher wallet
    if (payment.booking.teacher) {
      const { WalletService } = await import('../finance/wallet.service');
      const walletService = new WalletService(
        this.prisma,
        this.config,
      );
      await walletService.creditWallet(
        payment.booking.teacherId,
        payment.amount,
        bookingId,
        payment.id,
      );
    }
  }

  private async handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
    const bookingId = paymentIntent.metadata.bookingId;

    if (!bookingId) {
      return;
    }

    await this.prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.FAILED,
      },
    });
  }

  async getPayment(bookingId: string) {
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
      throw new NotFoundException('Payment not found');
    }

    return payment;
  }

  async refundPayment(bookingId: string, amount?: number) {
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment) {
      throw new NotFoundException('Payment not found');
    }

    if (payment.status !== PaymentStatus.COMPLETED) {
      throw new BadRequestException('Payment is not completed');
    }

    if (!payment.stripePaymentId) {
      throw new BadRequestException('Stripe payment ID not found');
    }

    // Create refund in Stripe
    const refundAmount = amount ? Math.round(amount * 100) : undefined;
    const refund = await this.stripe.refunds.create({
      payment_intent: payment.stripePaymentId,
      amount: refundAmount,
    });

    // Update payment record
    const updatedPayment = await this.prisma.payment.update({
      where: { bookingId },
      data: {
        status: PaymentStatus.REFUNDED,
        refundedAt: new Date(),
        refundAmount: refund.amount / 100,
      },
    });

    return updatedPayment;
  }
}

