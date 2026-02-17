const express = require('express');
const router = express.Router();
const videoService = require('../services/videoService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.post('/session/create', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.createSession(req.body.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.get('/session/token/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.getSessionToken(req.params.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.post('/session/end', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.endSession(req.body.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

router.get('/session/history', jwtAuth, async (req, res, next) => {
  try {
    const session = await videoService.getSessionHistory(req.query.bookingId, req.user.id);
    res.json(session);
  } catch (e) {
    next(e);
  }
});

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

router.get('/videos/:video_id/access', jwtAuth, async (req, res, next) => {
  try {
    const result = await videoService.getVideoAccess(req.params.video_id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/videos/:video_id/start', jwtAuth, async (req, res, next) => {
  try {
    const { lesson_id, course_id } = req.body;
    const result = await videoService.startWatching(req.params.video_id, req.user.id, lesson_id, course_id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/videos/:video_id/complete', jwtAuth, async (req, res, next) => {
  try {
    const { lesson_id, course_id, duration } = req.body;
    const result = await videoService.completeVideo(req.params.video_id, req.user.id, lesson_id, course_id, duration);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/courses/:course_id/progress', jwtAuth, async (req, res, next) => {
  try {
    const result = await videoService.getCourseProgress(req.params.course_id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
