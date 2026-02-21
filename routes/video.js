const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const { jwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/video/session/create:
 *   post:
 *     tags: [video]
 *     summary: POST /api/video/session/create
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
router.post('/session/create', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.createSession(req.body.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/session/token/{bookingId}:
 *   get:
 *     tags: [video]
 *     summary: GET /api/video/session/token/{bookingId}
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
router.get('/session/token/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.getSessionToken(req.params.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/session/end:
 *   post:
 *     tags: [video]
 *     summary: POST /api/video/session/end
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
router.post('/session/end', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.endSession(req.body.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/session/history:
 *   get:
 *     tags: [video]
 *     summary: GET /api/video/session/history
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
router.get('/session/history', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.getSessionHistory(req.query.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/session/test-token:
 *   get:
 *     tags: [video]
 *     summary: GET /api/video/session/test-token
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
router.get('/session/test-token', jwtAuth, async (req, res, next) => {
  try {
    const channelName = req.query.channelName || `test-${Date.now()}`;
    const uid = req.query.uid || 1;
    const result = videoService.getTestToken(channelName, uid);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/videos/{video_id}/access:
 *   get:
 *     tags: [video]
 *     summary: GET /api/video/videos/{video_id}/access
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: video_id
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
router.get('/videos/:video_id/access', jwtAuth, async (req, res, next) => {
  try {
    const result = await videoService.getVideoAccess(req.params.video_id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/videos/{video_id}/start:
 *   post:
 *     tags: [video]
 *     summary: POST /api/video/videos/{video_id}/start
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
 *         name: video_id
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
router.post('/videos/:video_id/start', jwtAuth, async (req, res, next) => {
  try {
    const { lesson_id, course_id } = req.body;
    const result = await videoService.startWatching(req.params.video_id, req.user.id, lesson_id, course_id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/videos/{video_id}/complete:
 *   post:
 *     tags: [video]
 *     summary: POST /api/video/videos/{video_id}/complete
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
 *         name: video_id
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
router.post('/videos/:video_id/complete', jwtAuth, async (req, res, next) => {
  try {
    const { lesson_id, course_id, duration } = req.body;
    const result = await videoService.completeVideo(req.params.video_id, req.user.id, lesson_id, course_id, duration);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/video/courses/{course_id}/progress:
 *   get:
 *     tags: [video]
 *     summary: GET /api/video/courses/{course_id}/progress
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: course_id
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
router.get('/courses/:course_id/progress', jwtAuth, async (req, res, next) => {
  try {
    const result = await videoService.getCourseProgress(req.params.course_id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
