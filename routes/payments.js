const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');
const Stripe = require('stripe');

const stripeSecret = process.env.STRIPE_SECRET_KEY;
const stripe = stripeSecret ? new Stripe(stripeSecret, { apiVersion: '2023-10-16' }) : null;

async function createPaymentIntent(bookingId, dto) {
  if (!stripe) throw Object.assign(new Error('Stripe not configured'), { statusCode: 500 });
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId },
    include: { teacher: true, student: true },
  });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  if (booking.status !== 'CONFIRMED') throw Object.assign(new Error('Booking must be confirmed before payment'), { statusCode: 400 });
  const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
  if (existingPayment && existingPayment.status === 'COMPLETED') {
    throw Object.assign(new Error('Payment already completed'), { statusCode: 400 });
  }
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(booking.totalPrice * 100),
    currency: process.env.STRIPE_CURRENCY || 'usd',
    payment_method_types: ['card'],
    metadata: { bookingId: booking.id, studentId: booking.studentId, teacherId: booking.teacherId },
  });
  const payment = await prisma.payment.upsert({
    where: { bookingId },
    create: {
      bookingId,
      amount: booking.totalPrice,
      currency: process.env.STRIPE_CURRENCY || 'USD',
      status: 'PENDING',
      paymentMethod: dto.paymentMethod,
      stripeIntentId: paymentIntent.id,
    },
    update: { stripeIntentId: paymentIntent.id, paymentMethod: dto.paymentMethod },
  });
  return { paymentIntentId: paymentIntent.id, clientSecret: paymentIntent.client_secret, payment };
}

async function getPayment(bookingId) {
  const payment = await prisma.payment.findUnique({
    where: { bookingId },
    include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
  });
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  return payment;
}

async function refundPayment(bookingId, amount) {
  if (!stripe) throw Object.assign(new Error('Stripe not configured'), { statusCode: 500 });
  const payment = await prisma.payment.findUnique({ where: { bookingId } });
  if (!payment) throw Object.assign(new Error('Payment not found'), { statusCode: 404 });
  if (payment.status !== 'COMPLETED') throw Object.assign(new Error('Payment is not completed'), { statusCode: 400 });
  const stripeId = payment.stripePaymentId || payment.stripeIntentId;
  if (!stripeId) throw Object.assign(new Error('Stripe payment ID not found'), { statusCode: 400 });
  const refundAmount = amount != null ? Math.round(amount * 100) : undefined;
  const refund = await stripe.refunds.create({
    payment_intent: stripeId,
    amount: refundAmount,
  });
  const updatedPayment = await prisma.payment.update({
    where: { bookingId },
    data: {
      status: 'REFUNDED',
      refundedAt: new Date(),
      refundAmount: refund.amount / 100,
    },
  });
  return updatedPayment;
}

router.post('/bookings/:bookingId/intent', jwtAuth, async (req, res, next) => {
  try {
    const result = await createPaymentIntent(req.params.bookingId, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const payment = await getPayment(req.params.bookingId);
    res.json(payment);
  } catch (e) {
    next(e);
  }
});

router.post('/bookings/:bookingId/refund', jwtAuth, async (req, res, next) => {
  try {
    const payment = await refundPayment(req.params.bookingId, req.body?.amount);
    res.json(payment);
  } catch (e) {
    next(e);
  }
});

router.post('/webhook', async (req, res, next) => {
  try {
    if (!stripe) return res.status(500).json({ error: 'Stripe not configured' });
    const sig = req.headers['stripe-signature'];
    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
    const payload = req.rawBody || Buffer.from(JSON.stringify(req.body));
    let event;
    try {
      event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);
    } catch (err) {
      const e = new Error(`Webhook signature verification failed: ${err.message}`);
      e.statusCode = 400;
      return next(e);
    }
    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object;
      await prisma.payment.updateMany({
        where: { stripeIntentId: paymentIntent.id },
        data: { status: 'COMPLETED' },
      });
    }
    res.json({ received: true });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
