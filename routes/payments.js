const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');
const Stripe = require('stripe');
const fawryService = require('../services/fawry');

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

/**
 * @openapi
 * /api/payments/bookings/{bookingId}/intent:
 *   post:
 *     tags: [payments]
 *     summary: Create Stripe payment intent for booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/bookings/:bookingId/intent', jwtAuth, async (req, res, next) => {
  try {
    const result = await createPaymentIntent(req.params.bookingId, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/payments/bookings/{bookingId}:
 *   get:
 *     tags: [payments]
 *     summary: Get payment for booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Payment
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const payment = await prisma.payment.findUnique({
      where: { bookingId: req.params.bookingId },
      include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
    });
    res.json(payment);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/payments/bookings/{bookingId}/refund:
 *   post:
 *     tags: [payments]
 *     summary: Refund booking payment
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Refunded
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/bookings/:bookingId/refund', jwtAuth, async (req, res, next) => {
  try {
    const payment = await refundPayment(req.params.bookingId, req.body?.amount);
    res.json(payment);
  } catch (e) {
    next(e);
  }
});

// ---------- Fawry Pay (Express Checkout Link for mobile) ----------
const FAWRY_MERCHANT_CODE = (process.env.FAWRY_MERCHANT_CODE || '').trim();
const FAWRY_SECURE_KEY = (process.env.FAWRY_SECURE_KEY || '').trim();
const FAWRY_RETURN_URL_BASE = (process.env.FAWRY_RETURN_URL_BASE || '').trim();
const BASE_URL = process.env.BASE_URL || '';

// Optional: GET so you can verify Fawry routes are deployed (no auth)
/**
 * @openapi
 * /api/payments/fawry:
 *   get:
 *     tags: [payments]
 *     summary: Check Fawry availability
 *     responses:
 *       200:
 *         description: Availability
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
router.get('/fawry', (req, res) => {
  res.json({
    available: true,
    configured: !!(FAWRY_MERCHANT_CODE && FAWRY_SECURE_KEY),
    payAtFawryEnabled: process.env.FAWRY_PAYATFAWRY_ENABLED === 'true',
    endpoints: {
      checkoutLink: 'POST /api/payments/fawry/checkout-link',
      referenceNumber: 'POST /api/payments/fawry/reference-number',
      webhook: 'POST /api/payments/fawry/webhook',
      status: 'GET /api/payments/fawry/status/:merchantRefNum',
    },
  });
});

/**
 * @openapi
 * /api/payments/fawry/checkout-link:
 *   post:
 *     tags: [payments]
 *     summary: Create Fawry checkout link
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/fawry/checkout-link', jwtAuth, async (req, res, next) => {
  try {
    if (!FAWRY_MERCHANT_CODE || !FAWRY_SECURE_KEY) {
      const e = new Error('Fawry is not configured');
      e.statusCode = 503;
      return next(e);
    }
    const { bookingId, returnUrl, language, paymentMethod, mobileNumber } = req.body || {};
    if (!bookingId) {
      const e = new Error('bookingId is required');
      e.statusCode = 400;
      return next(e);
    }
    const finalReturnUrl = returnUrl || FAWRY_RETURN_URL_BASE;
    if (!finalReturnUrl) {
      const e = new Error('returnUrl or FAWRY_RETURN_URL_BASE is required');
      e.statusCode = 400;
      return next(e);
    }

    let booking;
    if (bookingId === 'test-booking-id') {
      const dummyStudent = {
        id: req.user.id,
        firstName: 'Test',
        lastName: 'User',
        email: 'test@example.com',
        phone: '+201234567890'
      };
      booking = {
        id: 'test-booking-id',
        status: 'CONFIRMED',
        studentId: req.user.id,
        totalPrice: 50.00, // Fixed: Float expected
        student: dummyStudent
      };
    } else {
      booking = await prisma.booking.findUnique({
        where: { id: bookingId },
        include: { student: true, teacher: { include: { user: true } } },
      });
    }
    if (!booking) {
      const e = new Error('Booking not found');
      e.statusCode = 404;
      return next(e);
    }
    if (booking.status !== 'CONFIRMED') {
      const e = new Error('Booking must be confirmed before payment');
      e.statusCode = 400;
      return next(e);
    }
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (booking.studentId !== req.user.id && !isAdmin) {
      const e = new Error('You can only pay for your own booking');
      e.statusCode = 403;
      return next(e);
    }

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      const e = new Error('Payment already completed');
      e.statusCode = 400;
      return next(e);
    }
    if (!booking.totalPrice || Number(booking.totalPrice) <= 0) {
      const e = new Error('Booking total price must be greater than zero');
      e.statusCode = 400;
      return next(e);
    }

    const numericRef = () => String(Math.floor(Math.random() * 900000000) + 100000000);
    // Always generate new ref to avoid 9929 (Ticket value is invalid) if details changed
    const finalMerchantRefNum = numericRef();

    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalPrice,
        currency: process.env.STRIPE_CURRENCY || 'EGP',
        status: 'PENDING',
        paymentMethod: paymentMethod || 'FAWRY',
        merchantRefNum: finalMerchantRefNum,
      },
      update: { paymentMethod: paymentMethod || 'FAWRY', merchantRefNum: finalMerchantRefNum },
    });

    const student = booking.student;
    const customerName = [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email;
    const useTestPayload = process.env.FAWRY_USE_TEST_PAYLOAD === 'true' || process.env.FAWRY_USE_TEST_PAYLOAD === '1';

    const customerProfileId = useTestPayload ? '1212' : (String(student.id || booking.studentId || '0').replace(/\D/g, '').slice(0, 10) || '0');
    const chargeItems = useTestPayload
      ? [
        { itemId: '6b5fdea340e31b3b0339d4d4ae5', description: 'Product Description', price: 50.00, quantity: 2 },
        { itemId: '97092dd9e9c07888c7eef36', description: 'Product Description', price: 75.25, quantity: 3 },
      ]
      : [
        {
          itemId: booking.id.replace(/-/g, ''),
          description: `Booking ${booking.date ? new Date(booking.date).toLocaleDateString() : ''} - ${booking.duration}min`,
          price: Number(booking.totalPrice),
          quantity: 1,
        },
      ];

    const paymentExpiry = String(Date.now() + 60 * 60 * 1000);
    const orderWebHookUrl = process.env.FAWRY_ORDER_WEBHOOK_URL || (BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/api/payments/fawry/webhook` : undefined);

    // Choose mobile number: override, then profile, then fallback
    const studentMobile = mobileNumber || student.phone || student.student_phone || '';
    const cleanMobile = String(studentMobile).replace(/\s+/g, '');

    const chargeRequest = fawryService.buildChargeRequest({
      merchantCode: FAWRY_MERCHANT_CODE,
      merchantRefNum: String(finalMerchantRefNum),
      customerMobile: cleanMobile,
      customerEmail: student.email,
      customerName: useTestPayload ? 'Customer Name' : customerName,
      customerProfileId,
      returnUrl: useTestPayload ? 'https://developer.fawrystaging.com' : finalReturnUrl,
      chargeItems,
      language: language === 'en-gb' ? 'en-gb' : 'ar-eg',
      secureKey: FAWRY_SECURE_KEY,
      paymentExpiry,
      orderWebHookUrl: useTestPayload ? undefined : orderWebHookUrl,
      paymentMethod, // اختياري: CARD | PayAtFawry | MWALLET | VALU | CashOnDelivery، الافتراضي CARD
    });

    const result = await fawryService.createCharge(chargeRequest);
    const responseData = {
      paymentUrl: result.paymentUrl,
      paymentQr: result.paymentQr,
      merchantRefNum: finalMerchantRefNum,
      paymentId: payment.id,
      originalResponse: result.originalResponse,
      ...(result.expiresAt && { expiresAt: result.expiresAt }),
    };
    console.log('Sending Response to Frontend:', responseData); // Verify this matches expectations
    res.status(201).json(responseData);
  } catch (e) {
    const status = e.statusCode || e.status || 502;
    const body = {
      success: false,
      message: e.message || 'Fawry request failed',
      data: e.fawryResponse ? { fawryResponse: e.fawryResponse } : null,
      statusCode: status,
    };
    res.status(status).json(body);
  }
});

// PayAtFawry - Generate reference number for payment at Fawry stores
/**
 * @openapi
 * /api/payments/fawry/reference-number:
 *   post:
 *     tags: [payments]
 *     summary: Create PayAtFawry reference number
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/fawry/reference-number', jwtAuth, async (req, res, next) => {
  try {
    if (!FAWRY_MERCHANT_CODE || !FAWRY_SECURE_KEY) {
      const e = new Error('Fawry is not configured');
      e.statusCode = 503;
      return next(e);
    }

    const isPayAtFawryEnabled = process.env.FAWRY_PAYATFAWRY_ENABLED === 'true';
    if (!isPayAtFawryEnabled) {
      const e = new Error('PayAtFawry is not enabled');
      e.statusCode = 503;
      return next(e);
    }

    const { bookingId, expiryHours, language } = req.body || {};
    if (!bookingId) {
      const e = new Error('bookingId is required');
      e.statusCode = 400;
      return next(e);
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
      include: { student: true, teacher: { include: { user: true } } },
    });
    if (!booking) {
      const e = new Error('Booking not found');
      e.statusCode = 404;
      return next(e);
    }
    if (booking.status !== 'CONFIRMED') {
      const e = new Error('Booking must be confirmed before payment');
      e.statusCode = 400;
      return next(e);
    }
    const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
    if (booking.studentId !== req.user.id && !isAdmin) {
      const e = new Error('You can only pay for your own booking');
      e.statusCode = 403;
      return next(e);
    }

    const existingPayment = await prisma.payment.findUnique({ where: { bookingId } });
    if (existingPayment && existingPayment.status === 'COMPLETED') {
      const e = new Error('Payment already completed');
      e.statusCode = 400;
      return next(e);
    }
    if (!booking.totalPrice || Number(booking.totalPrice) <= 0) {
      const e = new Error('Booking total price must be greater than zero');
      e.statusCode = 400;
      return next(e);
    }

    // Generate merchant reference number
    const numericRef = () => String(Math.floor(Math.random() * 900000000) + 100000000);
    const finalMerchantRefNum = numericRef();

    // Calculate expiry time
    // Priority: request parameter > env variable > default (24 hours)
    const defaultExpiryHours = parseInt(process.env.FAWRY_PAYATFAWRY_EXPIRY_HOURS || '24', 10);
    const finalExpiryHours = expiryHours || defaultExpiryHours;
    const expiryTimestamp = Date.now() + (finalExpiryHours * 60 * 60 * 1000);
    const paymentExpiry = String(expiryTimestamp);

    const payment = await prisma.payment.upsert({
      where: { bookingId },
      create: {
        bookingId,
        amount: booking.totalPrice,
        currency: process.env.FAWRY_CURRENCY || 'EGP',
        status: 'PENDING',
        paymentMethod: 'PayAtFawry',
        merchantRefNum: finalMerchantRefNum,
      },
      update: {
        paymentMethod: 'PayAtFawry',
        merchantRefNum: finalMerchantRefNum
      },
    });

    const student = booking.student;
    const customerName = [student.firstName, student.lastName].filter(Boolean).join(' ') || student.email;
    const customerProfileId = String(student.id || booking.studentId || '0').replace(/\D/g, '').slice(0, 10) || '0';

    const chargeItems = [
      {
        itemId: booking.id.replace(/-/g, ''),
        description: `Booking ${booking.date ? new Date(booking.date).toLocaleDateString() : ''} - ${booking.duration}min`,
        price: Number(booking.totalPrice),
        quantity: 1,
      },
    ];

    const orderWebHookUrl = process.env.FAWRY_ORDER_WEBHOOK_URL || (BASE_URL ? `${BASE_URL.replace(/\/$/, '')}/api/payments/fawry/webhook` : undefined);

    const chargeRequest = fawryService.buildChargeRequest({
      merchantCode: FAWRY_MERCHANT_CODE,
      merchantRefNum: String(finalMerchantRefNum),
      customerMobile: student.phone || student.student_phone,
      customerEmail: student.email,
      customerName,
      customerProfileId,
      chargeItems,
      language: language === 'en-gb' ? 'en-gb' : 'ar-eg',
      secureKey: FAWRY_SECURE_KEY,
      paymentExpiry,
      orderWebHookUrl,
      paymentMethod: 'PayAtFawry',
      description: `Payment for booking ${booking.id}`,
    });

    const result = await fawryService.createCharge(chargeRequest);

    res.status(201).json({
      referenceNumber: result.referenceNumber,
      merchantRefNum: finalMerchantRefNum,
      paymentId: payment.id,
      amount: booking.totalPrice,
      currency: process.env.FAWRY_CURRENCY || 'EGP',
      expiresAt: result.expiresAt || new Date(expiryTimestamp).toISOString(),
      expiryHours: finalExpiryHours,
      instructions: {
        en: 'Visit any Fawry store and provide this reference number to complete your payment.',
        ar: 'قم بزيارة أي فرع من فروع فوري وقدم رقم المرجع هذا لإتمام الدفع.'
      }
    });
  } catch (e) {
    const status = e.statusCode || e.status || 502;
    const body = {
      success: false,
      message: e.message || 'Fawry PayAtFawry request failed',
      data: e.fawryResponse ? { fawryResponse: e.fawryResponse } : null,
      statusCode: status,
    };
    res.status(status).json(body);
  }
});

/**
 * @openapi
 * /api/payments/fawry/webhook:
 *   post:
 *     tags: [payments]
 *     summary: Fawry webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Invalid signature
 */
router.post('/fawry/webhook', async (req, res, next) => {
  try {
    const secureKey = process.env.FAWRY_SECURE_KEY;
    if (!secureKey) {
      return res.status(503).send();
    }
    const payload = req.body || {};
    const valid = fawryService.verifyWebhookSignature(payload, secureKey);
    if (!valid) {
      return res.status(400).send();
    }

    const merchantRefNum = payload.merchantRefNumber || payload.merchantRefNum;
    if (!merchantRefNum) {
      return res.status(200).send();
    }

    const payment = await prisma.payment.findFirst({
      where: { merchantRefNum },
      include: { booking: true },
    });
    if (!payment) {
      return res.status(200).send();
    }

    const orderStatus = (payload.orderStatus || '').toUpperCase();
    let newStatus = payment.status;
    if (orderStatus === 'PAID') {
      newStatus = 'COMPLETED';
    } else if (['FAILED', 'EXPIRED', 'CANCELED', 'CANCELLED'].includes(orderStatus)) {
      newStatus = 'FAILED';
    }

    await prisma.payment.update({
      where: { id: payment.id },
      data: {
        status: newStatus,
        fawryRefNumber: payload.fawryRefNumber || payment.fawryRefNumber,
      },
    });

    res.status(200).send();
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/payments/fawry/status/{merchantRefNum}:
 *   get:
 *     tags: [payments]
 *     summary: Get Fawry payment status
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: merchantRefNum
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Status
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       403:
 *         description: Forbidden
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/fawry/status/:merchantRefNum', jwtAuth, async (req, res, next) => {
  try {
    const { merchantRefNum } = req.params;

    // Query Fawry API directly for live status
    const fawryStatus = await fawryService.getPaymentStatus(merchantRefNum);

    // Also try to find local payment record (may not exist for test payments)
    const payment = await prisma.payment.findFirst({
      where: { merchantRefNum },
      include: { booking: true },
    });

    // If we have a local payment, check ownership
    if (payment) {
      const isAdmin = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';
      if (payment.booking && payment.booking.studentId !== req.user.id && !isAdmin) {
        const e = new Error('You can only view your own payment');
        e.statusCode = 403;
        return next(e);
      }
    }

    res.json({
      // Fawry live status
      fawryStatus,
      // Local DB info (if exists)
      localPayment: payment ? {
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        fawryRefNumber: payment.fawryRefNumber,
        paymentId: payment.id,
      } : null,
    });
  } catch (e) {
    next(e);
  }
});

// ---------- Stripe webhook ----------
/**
 * @openapi
 * /api/payments/webhook:
 *   post:
 *     tags: [payments]
 *     summary: Stripe webhook
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: OK
 *       400:
 *         description: Signature verification failed
 */
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
