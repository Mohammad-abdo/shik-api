const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { jwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/reviews:
 *   get:
 *     tags: [reviews]
 *     summary: GET /api/reviews (all or filter by type)
 *     parameters:
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *           enum: [SHEIKH, COURSE, BOOKING]
 *     responses:
 *       200:
 *         description: List of reviews with user and related entity; averageByType
 */
router.get('/', async (req, res, next) => {
  try {
    const type = req.query.type || undefined;
    const page = req.query.page ? parseInt(req.query.page, 10) : undefined;
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const includeSuspended = req.query.includeSuspended === 'true' || req.query.includeSuspended === '1';
    const result = await reviewService.getAll({ type, page, limit, includeSuspended });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/reviews/bookings/{bookingId}:
 *   post:
 *     tags: [reviews]
 *     summary: POST /api/reviews/bookings/{bookingId}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
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
router.post('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const review = await reviewService.create(req.params.bookingId, req.user.id, req.body);
    res.status(201).json(review);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/reviews/teachers/{teacherId}:
 *   get:
 *     tags: [reviews]
 *     summary: GET /api/reviews/teachers/{teacherId}
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
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
router.get('/teachers/:teacherId', async (req, res, next) => {
  try {
    const reviews = await reviewService.findByTeacher(req.params.teacherId);
    res.json(reviews);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/reviews/bookings/{bookingId}:
 *   put:
 *     tags: [reviews]
 *     summary: PUT /api/reviews/bookings/{bookingId}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     parameters:
 *       - in: path
 *         name: bookingId
 *         required: true
 *         schema:
 *           type: string
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
router.put('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const review = await reviewService.update(req.params.bookingId, req.user.id, req.body);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/reviews/bookings/{bookingId}:
 *   delete:
 *     tags: [reviews]
 *     summary: DELETE /api/reviews/bookings/{bookingId}
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
router.delete('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.params.bookingId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** GET /reviews/:id - get single review */
router.get('/:id', async (req, res, next) => {
  try {
    const review = await reviewService.getById(req.params.id);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/** PUT /reviews/:id - update review (owner or admin) */
router.put('/:id', jwtAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const review = await reviewService.updateById(req.params.id, req.body || {}, req.user.id, isAdmin);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/** DELETE /reviews/:id - delete review (owner or admin) */
router.delete('/:id', jwtAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const result = await reviewService.deleteById(req.params.id, req.user.id, isAdmin);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/** PATCH /reviews/:id/suspend - suspend review (admin only) */
router.patch('/:id/suspend', jwtAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const review = await reviewService.suspend(req.params.id, isAdmin);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

/** PATCH /reviews/:id/activate - activate suspended review (admin only) */
router.patch('/:id/activate', jwtAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === 'ADMIN' || req.user?.role === 'SUPER_ADMIN';
    const review = await reviewService.activate(req.params.id, isAdmin);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
