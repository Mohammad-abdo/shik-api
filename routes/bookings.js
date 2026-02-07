const express = require('express');
const router = express.Router();
const bookingService = require('../services/bookingService');
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

router.post('/', async (req, res, next) => {
  try {
    const booking = await bookingService.create(req.user.id, req.body);
    res.status(201).json(booking);
  } catch (e) {
    next(e);
  }
});

router.get('/my-bookings', async (req, res, next) => {
  try {
    const { status } = req.query;
    if (req.user.role === 'TEACHER') {
      const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
      if (teacher) {
        const bookings = await bookingService.findByTeacher(teacher.id, status);
        return res.json(bookings);
      }
    }
    const bookings = await bookingService.findByStudent(req.user.id, status);
    res.json(bookings);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const booking = await bookingService.findOne(req.params.id, req.user.id, req.user.role);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/confirm', async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher) {
      const err = new Error('Teacher profile not found');
      err.statusCode = 400;
      return next(err);
    }
    const booking = await bookingService.confirm(req.params.id, teacher.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/cancel', async (req, res, next) => {
  try {
    const booking = await bookingService.cancel(req.params.id, req.user.id, req.user.role);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reject', async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({ where: { userId: req.user.id } });
    if (!teacher) {
      const err = new Error('Teacher profile not found');
      err.statusCode = 400;
      return next(err);
    }
    const booking = await bookingService.reject(req.params.id, teacher.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
