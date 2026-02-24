const express = require('express');
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { jwtAuth } = require('../../middleware/jwtAuth');

function normalizePaymentType(value) {
  return String(value || '').trim().toLowerCase();
}

function getWeeklyOccurrences(paymentType) {
  const normalized = normalizePaymentType(paymentType);
  if (normalized === 'quarterly') return 12;
  if (normalized === 'monthly') return 4;
  return 1;
}

function getDefaultEndDate(startDate, paymentType) {
  const end = new Date(startDate);
  const normalized = normalizePaymentType(paymentType);
  if (normalized === 'quarterly') {
    end.setMonth(end.getMonth() + 3);
    return end;
  }
  if (normalized === 'monthly') {
    end.setMonth(end.getMonth() + 1);
    return end;
  }
  end.setDate(end.getDate() + 7);
  return end;
}

function toDateOnly(value) {
  const d = new Date(value);
  d.setHours(0, 0, 0, 0);
  return d;
}

/**
 * @openapi
 * /api/v1/bookings/:
 *   post:
 *     tags: [bookings]
 *     summary: POST /api/v1/bookings/
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
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const { sheikh_id, package_id, payment_type, subscription_end_date } = req.body;
    if (!sheikh_id) {
      const err = new Error('sheikh_id is required');
      err.statusCode = 400;
      return next(err);
    }
    const teacher = await prisma.teacher.findUnique({
      where: { id: sheikh_id },
      include: { user: true },
    });
    if (!teacher) {
      const err = new Error('Sheikh not found');
      err.statusCode = 404;
      return next(err);
    }
    if (!teacher.isApproved) {
      const err = new Error('Sheikh is not approved');
      err.statusCode = 400;
      return next(err);
    }
    let startTime = '08:00';
    let duration = 60;
    let date = new Date();
    date.setDate(date.getDate() + 1);
    if (package_id) {
      const schedule = await prisma.schedule.findFirst({
        where: { id: package_id, teacherId: sheikh_id, isActive: true },
      });
      if (!schedule) {
        const err = new Error('Invalid package_id. Expected an active schedule id for this sheikh.');
        err.statusCode = 400;
        return next(err);
      }
      startTime = schedule.startTime;
      const [sh, sm] = schedule.startTime.split(':').map(Number);
      const [eh, em] = schedule.endTime.split(':').map(Number);
      duration = (eh * 60 + em) - (sh * 60 + sm);
      const today = new Date();
      const currentDay = today.getDay();
      let daysUntil = (schedule.dayOfWeek - currentDay + 7) % 7;
      if (daysUntil === 0) daysUntil = 7;
      date.setDate(today.getDate() + daysUntil);
    }
    const singleSessionPrice = teacher.hourlyRate * (duration / 60) || teacher.hourlyRate;
    const occurrencesByType = getWeeklyOccurrences(payment_type);
    const defaultEndDate = getDefaultEndDate(date, payment_type);
    const requestedEndDate = subscription_end_date ? new Date(subscription_end_date) : null;
    const endDate = requestedEndDate && !Number.isNaN(requestedEndDate.getTime())
      ? toDateOnly(requestedEndDate)
      : toDateOnly(defaultEndDate);

    const recurrenceDates = [];
    const cursor = toDateOnly(date);
    while (cursor <= endDate) {
      recurrenceDates.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 7);
      if (recurrenceDates.length >= occurrencesByType) break;
    }

    if (recurrenceDates.length === 0) {
      recurrenceDates.push(toDateOnly(date));
    }

    const existingBookings = await prisma.booking.findMany({
      where: {
        studentId: req.user.id,
        teacherId: sheikh_id,
        date: { gte: recurrenceDates[0], lte: recurrenceDates[recurrenceDates.length - 1] },
        startTime,
        status: { notIn: ['CANCELLED', 'REJECTED'] },
      },
      select: { date: true },
    });

    const existingDateSet = new Set(existingBookings.map((b) => toDateOnly(b.date).toISOString()));
    const bookingPayload = recurrenceDates
      .filter((d) => !existingDateSet.has(toDateOnly(d).toISOString()))
      .map((d) => ({
        studentId: req.user.id,
        teacherId: sheikh_id,
        scheduleId: package_id || null,
        date: d,
        startTime,
        duration,
        price: singleSessionPrice,
        discount: 0,
        totalPrice: singleSessionPrice,
        status: 'PENDING',
      }));

    if (bookingPayload.length === 0) {
      return res.status(200).json({
        status: true,
        message: 'No new bookings created. Weekly sessions already exist for this slot.',
        data: {
          created_count: 0,
          skipped_count: recurrenceDates.length,
          booking_ids: [],
        },
      });
    }

    const created = [];
    await prisma.$transaction(async (tx) => {
      for (const item of bookingPayload) {
        const booking = await tx.booking.create({ data: item });
        created.push(booking);
      }
    });

    const totalPrice = Number((singleSessionPrice * created.length).toFixed(2));
    const paymentUrl = process.env.PAYMENT_URL || `https://paymob.example.com/checkout?booking=${created[0].id}&amount=${totalPrice}`;
    res.status(200).json({
      status: true,
      message: 'Weekly bookings initiated successfully',
      data: {
        booking_id: created[0].id,
        booking_ids: created.map((b) => b.id),
        created_count: created.length,
        skipped_count: recurrenceDates.length - created.length,
        start_date: toDateOnly(recurrenceDates[0]).toISOString().split('T')[0],
        end_date: toDateOnly(recurrenceDates[recurrenceDates.length - 1]).toISOString().split('T')[0],
        amount: totalPrice,
        currency: 'EGP',
        payment_url: paymentUrl,
      },
    });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
