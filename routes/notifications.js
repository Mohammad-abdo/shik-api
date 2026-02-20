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
    const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/notifications/{id}/read:
 *   put:
 *     tags: [notifications]
 *     summary: PUT /api/notifications/{id}/read
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
router.put('/:id/read', async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/notifications/read-all:
 *   put:
 *     tags: [notifications]
 *     summary: PUT /api/notifications/read-all
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
router.put('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
