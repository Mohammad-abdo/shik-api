const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

router.use(jwtAuth);

/**
 * @openapi
 * /api/notifications/send:
 *   post:
 *     tags: [notifications]
 *     summary: POST /api/notifications/send
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
router.post('/send', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const result = await notificationService.sendNotification(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/notifications/broadcast:
 *   post:
 *     tags: [notifications]
 *     summary: POST /api/notifications/broadcast
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
router.post('/broadcast', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const result = await notificationService.broadcastNotification(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/notifications/:
 *   get:
 *     tags: [notifications]
 *     summary: GET /api/notifications/
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
    const unreadOnly = req.query.unreadOnly === 'true';
    const limit = req.query.limit ? parseInt(req.query.limit, 10) : undefined;
    const offset = req.query.offset ? parseInt(req.query.offset, 10) : undefined;
    const notifications = await notificationService.getUserNotifications(req.user.id, { unreadOnly, limit, offset });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

// Must be before /:id/read so "read-all" is not captured as id
router.put('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
router.patch('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/:id/read', async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});
router.patch('/:id/read', async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
