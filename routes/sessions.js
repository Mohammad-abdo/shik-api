const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const sessionReportService = require('../services/sessionReportService');
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

async function getSessionAndCheckAccess(sessionId, userId) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { booking: { include: { student: true, teacher: { include: { user: true } } } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const isStudent = session.booking.studentId === userId;
  const isTeacher = session.booking.teacher?.userId === userId;
  if (!isStudent && !isTeacher) throw Object.assign(new Error('You do not have access to this session'), { statusCode: 403 });
  return { session, isTeacher };
}

/**
 * @openapi
 * /api/sessions/:
 *   get:
 *     tags: [sessions]
 *     summary: GET /api/sessions/
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
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 20, 100);
    const result = await sessionService.getMySessions(req.user.id, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/sessions/bookings/{bookingId}:
 *   post:
 *     tags: [sessions]
 *     summary: POST /api/sessions/bookings/{bookingId}
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
router.post('/bookings/:bookingId', async (req, res, next) => {
  try {
    const session = await sessionService.create(req.params.bookingId, { ...req.body, userId: req.user.id });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/sessions/bookings/{bookingId}:
 *   get:
 *     tags: [sessions]
 *     summary: GET /api/sessions/bookings/{bookingId}
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
router.get('/bookings/:bookingId', async (req, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/sessions/bookings/{bookingId}/start:
 *   post:
 *     tags: [sessions]
 *     summary: POST /api/sessions/bookings/{bookingId}/start
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
router.post('/bookings/:bookingId/start', async (req, res, next) => {
  try {
    const session = await sessionService.startSession(req.params.bookingId);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/sessions/bookings/{bookingId}/end:
 *   post:
 *     tags: [sessions]
 *     summary: POST /api/sessions/bookings/{bookingId}/end
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
router.post('/bookings/:bookingId/end', async (req, res, next) => {
  try {
    const session = await sessionService.endSession(req.params.bookingId, req.body.recordingUrl);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

// ─── Session memorization, revision, report (by sessionId) ───────────────────

router.get('/:sessionId/details', async (req, res, next) => {
  try {
    const { session } = await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const details = await sessionReportService.getSessionDetails(req.params.sessionId);
    res.json(details);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/memorization', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const record = await sessionReportService.saveMemorization(req.params.sessionId, req.body);
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/memorization', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const list = await sessionReportService.getMemorizations(req.params.sessionId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/revision', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const record = await sessionReportService.saveRevision(req.params.sessionId, req.body);
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/revisions', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const list = await sessionReportService.getRevisions(req.params.sessionId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/report', async (req, res, next) => {
  try {
    const { session, isTeacher } = await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    if (!isTeacher) throw Object.assign(new Error('Only the teacher can submit the session report'), { statusCode: 403 });
    const record = await sessionReportService.saveReport(
      req.params.sessionId,
      session.booking.teacherId,
      session.booking.studentId,
      req.body
    );
    res.json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/report', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id);
    const report = await sessionReportService.getReport(req.params.sessionId);
    res.json(report || {});
  } catch (e) {
    next(e);
  }
});

module.exports = router;
