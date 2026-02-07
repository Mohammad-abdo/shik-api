const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');
const roles = require('../middleware/roles');
const { optionalJwtAuth } = require('../middleware/jwtAuth');

router.post('/', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const course = await courseService.create(req.body, req.user.id);
    res.status(201).json(course);
  } catch (e) {
    next(e);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await courseService.findAll(page, limit, req.query.status, req.query.teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/featured', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const result = await courseService.findAll(page, limit, 'PUBLISHED', undefined, true);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Mobile routes (same as :id but under /mobile prefix for app compatibility)
router.get('/mobile/:id', jwtAuth, async (req, res, next) => {
  try {
    const course = await courseService.findOne(req.params.id);
    res.json({ success: true, message: 'تم جلب بيانات الدورة بنجاح', data: { course } });
  } catch (e) {
    next(e);
  }
});

router.get('/mobile/:id/sheikhs', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const result = await courseService.findCourseSheikhs(req.params.id, page, limit);
    res.json({ success: true, message: 'تم جلب شيوخ الدورة بنجاح', data: result });
  } catch (e) {
    next(e);
  }
});

router.get('/mobile/:id/lessons', jwtAuth, async (req, res, next) => {
  try {
    const data = await courseService.getCourseLessonsForPlayback(req.params.id, {
      userId: req.user?.id ?? null,
      sheikh_id: req.query.sheikh_id,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    });
    res.json({ success: true, message: 'Lessons retrieved successfully', data });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/sheikhs', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 10;
    const result = await courseService.findCourseSheikhs(req.params.id, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/lessons', optionalJwtAuth, async (req, res, next) => {
  try {
    const data = await courseService.getCourseLessonsForPlayback(req.params.id, {
      userId: req.user?.id ?? null,
      sheikh_id: req.query.sheikh_id,
      page: req.query.page ? parseInt(req.query.page) : 1,
      limit: req.query.limit ? parseInt(req.query.limit) : 20,
    });
    res.json({ success: true, message: 'Lessons retrieved successfully', data });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const course = await courseService.findOne(req.params.id);
    res.json(course);
  } catch (e) {
    next(e);
  }
});

router.put('/:id', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const course = await courseService.update(req.params.id, req.body);
    res.json(course);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/enroll', jwtAuth, async (req, res, next) => {
  try {
    const enrollment = await courseService.enrollStudent(req.params.id, req.user.id);
    res.status(201).json(enrollment);
  } catch (e) {
    next(e);
  }
});

router.post('/teacher/create', jwtAuth, roles('TEACHER'), async (req, res, next) => {
  try {
    const course = await courseService.createTeacherCourse(req.body, req.user.id);
    res.status(201).json(course);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
