const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

/**
 * @openapi
 * /api/bookings:
 *   post:
 *     tags: [bookings]
 *     summary: Create booking
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
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/', async (req, res, next) => {
  try {
    const booking = await bookingService.create(req.user.id, req.body);
    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/my-bookings:
 *   get:
 *     tags: [bookings]
 *     summary: List my bookings
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/my-bookings', async (req, res, next) => {
  try {
    const { status } = req.query;
    if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
      if (teacher) {
        const bookings = await bookingService.findByTeacher(teacher.id, status);
        return res.json(bookings);
      }
    }
    const bookings = await bookingService.findByStudent(req.user.id, status);
    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/teacher/{teacherId}/subscription-packages:
 *   get:
 *     tags: [bookings]
 *     summary: Get subscription packages for teacher
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Packages
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/teacher/:teacherId/subscription-packages', async (req, res, next) => {
  try {
    const result = await bookingService.getSubscriptionPackagesForStudent(req.user.id, req.params.teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/{id}:
 *   get:
 *     tags: [bookings]
 *     summary: Get booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking
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
router.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.findOne(req.params.id, req.user.id, req.user.role);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/{id}/confirm:
 *   post:
 *     tags: [bookings]
 *     summary: Confirm booking (teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Confirmed
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
router.post('/:id/confirm', async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher) {
      const err = new Error('Teacher profile not found');
      err.statusCode = 400;
      return next(err);
    }
    const booking = await bookingService.confirm(req.params.id, teacher.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/{id}/cancel:
 *   post:
 *     tags: [bookings]
 *     summary: Cancel booking
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Canceled
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
router.post('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await bookingService.cancel(req.params.id, req.user.id, req.user.role);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/bookings/{id}/reject:
 *   post:
 *     tags: [bookings]
 *     summary: Reject booking (teacher)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Rejected
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
router.post('/:id/reject', async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher) {
      const err = new Error('Teacher profile not found');
      err.statusCode = 400;
      return next(err);
    }
    const booking = await bookingService.reject(req.params.id, teacher.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
