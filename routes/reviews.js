const express = require('express');
const router = express.Router();
const reviewService = require('../services/reviewService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.post('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const review = await reviewService.create(req.params.bookingId, req.user.id, req.body);
    res.status(201).json(review);
  } catch (e) {
    next(e);
  }
});

router.get('/teachers/:teacherId', async (req, res, next) => {
  try {
    const reviews = await reviewService.findByTeacher(req.params.teacherId);
    res.json(reviews);
  } catch (e) {
    next(e);
  }
});

router.put('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const review = await reviewService.update(req.params.bookingId, req.user.id, req.body);
    res.json(review);
  } catch (e) {
    next(e);
  }
});

router.delete('/bookings/:bookingId', jwtAuth, async (req, res, next) => {
  try {
    const result = await reviewService.deleteReview(req.params.bookingId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
