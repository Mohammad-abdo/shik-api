const express = require('express');
const router = express.Router();
const notificationService = require('../services/notificationService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

router.use(jwtAuth);

router.post('/send', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const result = await notificationService.sendNotification(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/broadcast', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const result = await notificationService.broadcastNotification(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const unreadOnly = req.query.unreadOnly === 'true';
    const notifications = await notificationService.getUserNotifications(req.user.id, unreadOnly);
    res.json(notifications);
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

router.put('/read-all', async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
