const express = require('express');
const router = express.Router();
const teacherService = require('../services/teacherService');
const courseService = require('../services/courseService');
const { jwtAuth } = require('../middleware/jwtAuth');
const roles = require('../middleware/roles');

router.get('/', async (req, res, next) => {
  try {
    const specialties = req.query.specialties ? req.query.specialties.split(',') : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
    const search = req.query.search;
    const teachers = await teacherService.findAll({ specialties, minRating, search });
    res.json(teachers);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/courses', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const result = await courseService.findAll(page, limit, 'PUBLISHED', req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/profile/me', jwtAuth, async (req, res, next) => {
  try {
    const teacher = await prisma.teacher.findUnique({
      where: { userId: req.user.id },
      include: {
        user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } },
        schedules: { where: { isActive: true } },
      },
    });
    if (!teacher) {
      const e = new Error('Teacher profile not found');
      e.statusCode = 404;
      return next(e);
    }
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/availability', async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;
    if (!startDate || !endDate) {
      const err = new Error('startDate and endDate are required');
      err.statusCode = 400;
      throw err;
    }
    const result = await teacherService.getAvailability(req.params.id, startDate, endDate);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const teacher = await teacherService.findOne(req.params.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const teacher = await teacherService.create(req.user.id, req.body);
    res.status(201).json(teacher);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', jwtAuth, async (req, res, next) => {
  try {
    const teacher = await teacherService.update(req.params.id, req.user.id, req.body);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/approve', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const teacher = await teacherService.approveTeacher(req.params.id, req.user.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/reject', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await teacherService.rejectTeacher(req.params.id);
    res.json({ message: 'Teacher rejected' });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/schedules', jwtAuth, async (req, res, next) => {
  try {
    const schedule = await teacherService.createSchedule(req.params.id, req.user.id, req.body);
    res.status(201).json(schedule);
  } catch (e) {
    next(e);
  }
});

router.put('/:teacherId/schedules/:scheduleId', jwtAuth, async (req, res, next) => {
  try {
    const schedule = await teacherService.updateSchedule(req.params.scheduleId, req.params.teacherId, req.user.id, req.body);
    res.json(schedule);
  } catch (e) {
    next(e);
  }
});

router.delete('/:teacherId/schedules/:scheduleId', jwtAuth, async (req, res, next) => {
  try {
    const result = await teacherService.deleteSchedule(req.params.scheduleId, req.params.teacherId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
