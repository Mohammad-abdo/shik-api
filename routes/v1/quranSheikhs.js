const express = require('express');
const router = express.Router();
const quranSheikhsService = require('../../services/quranSheikhsService');
const { jwtAuth } = require('../../middleware/jwtAuth');
const { optionalJwtAuth } = require('../../middleware/jwtAuth');

function getLang(req) {
  const accept = req.headers['accept-language'] || '';
  return accept.startsWith('ar') ? 'ar' : 'en';
}

/**
 * @openapi
 * /api/v1/quran-sheikhs/:
 *   get:
 *     tags: [quran-sheikhs]
 *     summary: GET /api/v1/quran-sheikhs/
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
router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhs(page, limit, search, lang);
    res.json({ status: true, message: 'Sheikhs retrieved successfully', data });
  } catch (e) {
    next(e);
  }
});

/** المشايخ الذين ليسوا داخل أي دورة والذين يمكن الحجز معهم */
/**
 * @openapi
 * /api/v1/quran-sheikhs/bookable:
 *   get:
 *     tags: [quran-sheikhs]
 *     summary: GET /api/v1/quran-sheikhs/bookable
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
router.get('/bookable', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const lang = getLang(req);
    const data = await quranSheikhsService.getBookableSheikhsNotInCourses(page, limit, search, lang);
    res.json({ status: true, message: 'Bookable sheikhs (not in courses) retrieved successfully', data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/quran-sheikhs/me/schedules:
 *   post:
 *     tags: [quran-sheikhs]
 *     summary: Add available schedule slots for the current sheikh
 *     description: |
 *       Creates one or multiple available time slots for the authenticated sheikh.
 *       Students can then book sessions within these slots.
 *       You can send either a single slot object or a `slots` array.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [dayOfWeek, startTime, endTime]
 *                 properties:
 *                   dayOfWeek:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 6
 *                     example: 1
 *                   startTime:
 *                     type: string
 *                     example: "10:00"
 *                   endTime:
 *                     type: string
 *                     example: "12:00"
 *               - type: object
 *                 required: [slots]
 *                 properties:
 *                   slots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required: [dayOfWeek, startTime, endTime]
 *                       properties:
 *                         dayOfWeek:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                           example: 1
 *                         startTime:
 *                           type: string
 *                           example: "10:00"
 *                         endTime:
 *                           type: string
 *                           example: "12:00"
 *           examples:
 *             singleSlot:
 *               summary: Add one slot
 *               value:
 *                 dayOfWeek: 1
 *                 startTime: "10:00"
 *                 endTime: "12:00"
 *             multipleSlots:
 *               summary: Add multiple slots at once
 *               value:
 *                 slots:
 *                   - dayOfWeek: 0
 *                     startTime: "09:00"
 *                     endTime: "11:00"
 *                   - dayOfWeek: 2
 *                     startTime: "18:00"
 *                     endTime: "20:00"
 *     responses:
 *       201:
 *         description: Schedule slots created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       404:
 *         description: Sheikh profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       409:
 *         description: Overlapping slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/me/schedules', jwtAuth, async (req, res, next) => {
  try {
    const result = await quranSheikhsService.createMySchedules(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/quran-sheikhs/{id}:
 *   get:
 *     tags: [quran-sheikhs]
 *     summary: GET /api/v1/quran-sheikhs/{id}
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id', optionalJwtAuth, async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhById(req.params.id, studentId, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/quran-sheikhs/{id}/reviews:
 *   get:
 *     tags: [quran-sheikhs]
 *     summary: GET /api/v1/quran-sheikhs/{id}/reviews
 *     parameters:
 *       - in: path
 *         name: id
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
router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhReviews(req.params.id, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/quran-sheikhs/{id}/reviews:
 *   post:
 *     tags: [quran-sheikhs]
 *     summary: POST /api/v1/quran-sheikhs/{id}/reviews
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
 *         name: id
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
router.post('/:id/reviews', jwtAuth, async (req, res, next) => {
  try {
    await quranSheikhsService.addSheikhReview(req.params.id, req.user.id, req.body);
    res.json({ status: true, message: 'Review added successfully' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
