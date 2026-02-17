const express = require('express');
const router = express.Router();
const sessionService = require('../services/sessionService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

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

router.post('/bookings/:bookingId', async (req, res, next) => {
  try {
    const session = await sessionService.create(req.params.bookingId, { ...req.body, userId: req.user.id });
    res.status(201).json(session);
  } catch (e) {
    next(e);
  }
});

router.get('/bookings/:bookingId', async (req, res, next) => {
  try {
    const session = await sessionService.getSession(req.params.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post('/bookings/:bookingId/start', async (req, res, next) => {
  try {
    const session = await sessionService.startSession(req.params.bookingId);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post('/bookings/:bookingId/end', async (req, res, next) => {
  try {
    const session = await sessionService.endSession(req.params.bookingId, req.body.recordingUrl);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
