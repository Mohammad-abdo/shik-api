const express = require('express');
const router = express.Router();
const { prisma } = require('../../lib/prisma');
const { jwtAuth } = require('../../middleware/jwtAuth');

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
    const { sheikh_id, package_id, payment_type } = req.body;
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
      if (schedule) {
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
    }
    const price = teacher.hourlyRate * (duration / 60) || teacher.hourlyRate;
    const totalPrice = payment_type === 'monthly' ? price * 4 : price;
    const booking = await prisma.booking.create({
      data: {
        studentId: req.user.id,
        teacherId: sheikh_id,
        date,
        startTime,
        duration,
        price: totalPrice,
        discount: 0,
        totalPrice,
        status: 'PENDING',
      },
    });
    const paymentUrl = process.env.PAYMENT_URL || `https://paymob.example.com/checkout?booking=${booking.id}&amount=${totalPrice}`;
    res.status(200).json({
      status: true,
      message: 'Booking initiated successfully',
      data: {
        booking_id: booking.id,
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
