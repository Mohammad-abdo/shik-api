const express = require('express');
const router = express.Router();
const studentSessionsService = require('../../services/studentSessionsService');
const studentCoursesService = require('../../services/studentCoursesService');
const { jwtAuth } = require('../../middleware/jwtAuth');

function getLang(req) {
  const accept = req.headers['accept-language'] || '';
  return accept.startsWith('ar') ? 'ar' : 'en';
}

/**
 * @openapi
 * /api/v1/student/sessions:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/sessions
 *     security:
 *       - bearerAuth: []
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
router.get('/sessions', jwtAuth, async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const lang = getLang(req);
    const data = await studentSessionsService.getMySessions(req.user.id, month, year, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/sessions/{id}/report:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/sessions/{id}/report
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
router.get('/sessions/:id/report', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentSessionsService.getSessionReport(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/courses:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/courses
 *     security:
 *       - bearerAuth: []
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
router.get('/courses', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getMyCourses(req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/courses/{id}:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/courses/{id}
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
router.get('/courses/:id', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getCourseDetails(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/reports:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/reports
 *     security:
 *       - bearerAuth: []
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
router.get('/reports', jwtAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const lang = getLang(req);
    const data = await studentSessionsService.getMyReports(req.user.id, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
