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
