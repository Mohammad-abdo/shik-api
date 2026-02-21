const express = require('express');
const router = express.Router();
const courseService = require('../services/courseService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');
const roles = require('../middleware/roles');
const { optionalJwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/courses:
 *   post:
 *     tags: [courses]
 *     summary: Create course
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
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const course = await courseService.create(req.body, req.user.id);
    res.status(201).json(course);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses:
 *   get:
 *     tags: [courses]
 *     summary: List courses
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *       - in: query
 *         name: teacherId
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
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

/**
 * @openapi
 * /api/courses/featured:
 *   get:
 *     tags: [courses]
 *     summary: List featured courses
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: List
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
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
/**
 * @openapi
 * /api/courses/mobile/{id}:
 *   get:
 *     tags: [courses]
 *     summary: Get course (mobile)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/mobile/:id', jwtAuth, async (req, res, next) => {
  try {
    const course = await courseService.findOne(req.params.id);
    res.json({ success: true, message: 'تم جلب بيانات الدورة بنجاح', data: { course } });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/mobile/{id}/sheikhs:
 *   get:
 *     tags: [courses]
 *     summary: Get course sheikhs (mobile)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sheikhs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
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

/**
 * @openapi
 * /api/courses/mobile/{id}/lessons:
 *   get:
 *     tags: [courses]
 *     summary: Get course lessons for playback (mobile)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sheikh_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lessons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @openapi
 * /api/courses/{id}/sheikhs:
 *   get:
 *     tags: [courses]
 *     summary: Get course sheikhs
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Sheikhs
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
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

/**
 * @openapi
 * /api/courses/{id}/lessons:
 *   get:
 *     tags: [courses]
 *     summary: Get course lessons for playback (optional auth)
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *       - in: query
 *         name: sheikh_id
 *         schema:
 *           type: string
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lessons
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
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

/**
 * @openapi
 * /api/courses/{id}:
 *   get:
 *     tags: [courses]
 *     summary: Get course
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Course
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       404:
 *         description: Not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/:id', async (req, res, next) => {
  try {
    const course = await courseService.findOne(req.params.id);
    res.json(course);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/{id}/featured:
 *   patch:
 *     tags: [courses]
 *     summary: Toggle featured
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               isFeatured:
 *                 type: boolean
 *             required: [isFeatured]
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.patch('/:id/featured', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const course = await courseService.toggleFeatured(req.params.id, req.body.isFeatured);
    res.json(course);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/{id}:
 *   put:
 *     tags: [courses]
 *     summary: Update course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Updated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.put('/:id', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const course = await courseService.update(req.params.id, req.body);
    res.json(course);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/{id}:
 *   delete:
 *     tags: [courses]
 *     summary: Delete course
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Deleted
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.delete('/:id', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const result = await courseService.deleteCourse(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/{id}/enroll:
 *   post:
 *     tags: [courses]
 *     summary: Enroll current student
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       201:
 *         description: Enrolled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/:id/enroll', jwtAuth, async (req, res, next) => {
  try {
    const enrollment = await courseService.enrollStudent(req.params.id, req.user.id);
    res.status(201).json(enrollment);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/{id}/enroll-student:
 *   post:
 *     tags: [courses]
 *     summary: Enroll student by admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               studentId:
 *                 type: string
 *             required: [studentId]
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Enrolled
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/:id/enroll-student', jwtAuth, permissions(['courses.write']), async (req, res, next) => {
  try {
    const { studentId } = req.body;
    if (!studentId) {
      const err = new Error('studentId is required');
      err.statusCode = 400;
      throw err;
    }
    const enrollment = await courseService.adminEnrollStudent(req.params.id, studentId);
    res.status(201).json(enrollment);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/courses/teacher/create:
 *   post:
 *     tags: [courses]
 *     summary: Create course as teacher
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
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 */
router.post('/teacher/create', jwtAuth, roles('TEACHER'), async (req, res, next) => {
  try {
    const course = await courseService.createTeacherCourse(req.body, req.user.id);
    res.status(201).json(course);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
