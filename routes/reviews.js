const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { jwtAuth } = require('../middleware/jwtAuth');

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

module.exports = router;
