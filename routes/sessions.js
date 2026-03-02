const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const sessionReportService = require('../services/sessionReportService');
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

async function getSessionAndCheckAccess(sessionId, userId, userRole) {
  const session = await prisma.session.findUnique({
    where: { id: sessionId },
    include: { bookingSession: { include: { booking: { include: { student: true, teacher: { include: { user: true } } } } } } },
  });
  if (!session) throw Object.assign(new Error('Session not found'), { statusCode: 404 });
  const booking = session.bookingSession?.booking;
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  const isStudent = booking.studentId === userId;
  const isTeacher = booking.teacher?.userId === userId;
  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  if (!isStudent && !isTeacher && !isAdmin) throw Object.assign(new Error('You do not have access to this session'), { statusCode: 403 });
  return { session, isTeacher, isAdmin, booking };
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
 * /api/sessions/booking-sessions/{bookingSessionId}:
 *   post:
 *     tags: [sessions]
 *     summary: POST /api/sessions/booking-sessions/{bookingSessionId} - create live session for slot
 *     parameters:
 *       - in: path
 *         name: bookingSessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Created
 *       400:
 *         description: Error
 */
router.post('/booking-sessions/:bookingSessionId', async (req, res, next) => {
  try {
    const session = await sessionService.create(req.params.bookingSessionId, { ...req.body, userId: req.user.id });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/sessions/booking-sessions/{bookingSessionId}:
 *   get:
 *     tags: [sessions]
 *     summary: GET /api/sessions/booking-sessions/{bookingSessionId}
 *     parameters:
 *       - in: path
 *         name: bookingSessionId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Success
 *       400:
 *         description: Error
 */
router.get('/booking-sessions/:bookingSessionId', async (req, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.bookingSessionId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post('/booking-sessions/:bookingSessionId/start', async (req, res, next) => {
  try {
    const session = await sessionService.startSession(req.params.bookingSessionId);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post('/booking-sessions/:bookingSessionId/end', async (req, res, next) => {
  try {
    const session = await sessionService.endSession(req.params.bookingSessionId, req.body.recordingUrl);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

// ─── Session memorization, revision, report (by sessionId) ───────────────────

router.get('/:sessionId/details', async (req, res, next) => {
  try {
    const { session } = await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const details = await sessionReportService.getSessionDetails(req.params.sessionId);
    res.json(details);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/memorization', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const record = await sessionReportService.saveMemorization(req.params.sessionId, req.body);
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/memorization', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const list = await sessionReportService.getMemorizations(req.params.sessionId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/revision', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const record = await sessionReportService.saveRevision(req.params.sessionId, req.body);
    res.status(201).json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/revisions', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const list = await sessionReportService.getRevisions(req.params.sessionId);
    res.json(list);
  } catch (e) {
    next(e);
  }
});

router.post('/:sessionId/report', async (req, res, next) => {
  try {
    const { isTeacher, isAdmin, booking } = await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    if (!isTeacher && !isAdmin) throw Object.assign(new Error('Only the teacher or admin can submit the session report'), { statusCode: 403 });
    const record = await sessionReportService.saveReport(
      req.params.sessionId,
      booking.teacherId,
      booking.studentId,
      req.body
    );
    res.json(record);
  } catch (e) {
    next(e);
  }
});

router.get('/:sessionId/report', async (req, res, next) => {
  try {
    await getSessionAndCheckAccess(req.params.sessionId, req.user.id, req.user.role);
    const report = await sessionReportService.getReport(req.params.sessionId);
    res.json(report || {});
  } catch (e) {
    next(e);
  }
});

module.exports = router;
