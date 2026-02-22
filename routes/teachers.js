const express = require('express');
const router = express.Router();
const { prisma } = require('../lib/prisma');
const teacherService = require('../services/teacherService');
const courseService = require('../services/courseService');
const { jwtAuth } = require('../middleware/jwtAuth');
const roles = require('../middleware/roles');

/**
 * @openapi
 * /api/teachers/:
 *   get:
 *     tags: [teachers]
 *     summary: GET /api/teachers/
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
    const specialties = req.query.specialties ? req.query.specialties.split(',') : undefined;
    const minRating = req.query.minRating ? parseFloat(req.query.minRating) : undefined;
    const search = req.query.search;
    const teachers = await teacherService.findAll({ specialties, minRating, search });
    res.json(teachers);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{id}/courses:
 *   get:
 *     tags: [teachers]
 *     summary: GET /api/teachers/{id}/courses
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

/**
 * @openapi
 * /api/teachers/profile/me:
 *   get:
 *     tags: [teachers]
 *     summary: GET /api/teachers/profile/me
 *     security:
 *       - bearerAuth: []
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

/**
 * @openapi
 * /api/teachers/{id}/availability:
 *   get:
 *     tags: [teachers]
 *     summary: GET /api/teachers/{id}/availability
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

/**
 * @openapi
 * /api/teachers/{id}:
 *   get:
 *     tags: [teachers]
 *     summary: GET /api/teachers/{id}
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
router.get('/:id', async (req, res, next) => {
  try {
    const teacher = await teacherService.findOne(req.params.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/:
 *   post:
 *     tags: [teachers]
 *     summary: POST /api/teachers/
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
router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const teacher = await teacherService.create(req.user.id, req.body);
    res.status(201).json(teacher);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{id}:
 *   put:
 *     tags: [teachers]
 *     summary: PUT /api/teachers/{id}
 *     security:
 *       - bearerAuth: []
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
router.put('/:id', jwtAuth, async (req, res, next) => {
  try {
    const teacher = await teacherService.update(req.params.id, req.user.id, req.body);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{id}/approve:
 *   post:
 *     tags: [teachers]
 *     summary: POST /api/teachers/{id}/approve
 *     security:
 *       - bearerAuth: []
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
router.post('/:id/approve', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    const teacher = await teacherService.approveTeacher(req.params.id, req.user.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{id}/reject:
 *   delete:
 *     tags: [teachers]
 *     summary: DELETE /api/teachers/{id}/reject
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
router.delete('/:id/reject', jwtAuth, roles('ADMIN', 'SUPER_ADMIN'), async (req, res, next) => {
  try {
    await teacherService.rejectTeacher(req.params.id);
    res.json({ message: 'Teacher rejected' });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/me/schedules:
 *   post:
 *     tags: [teachers]
 *     summary: Add available schedule slots for the current teacher
 *     description: |
 *       Creates one or multiple available time slots for the authenticated teacher (sheikh).
 *       Students can then book sessions within these slots.
 *       You can send either a single slot object or a `slots` array.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             oneOf:
 *               - type: object
 *                 required: [dayOfWeek, startTime, endTime]
 *                 properties:
 *                   dayOfWeek:
 *                     type: integer
 *                     minimum: 0
 *                     maximum: 6
 *                     example: 1
 *                   startTime:
 *                     type: string
 *                     example: "10:00"
 *                   endTime:
 *                     type: string
 *                     example: "12:00"
 *               - type: object
 *                 required: [slots]
 *                 properties:
 *                   slots:
 *                     type: array
 *                     items:
 *                       type: object
 *                       required: [dayOfWeek, startTime, endTime]
 *                       properties:
 *                         dayOfWeek:
 *                           type: integer
 *                           minimum: 0
 *                           maximum: 6
 *                           example: 1
 *                         startTime:
 *                           type: string
 *                           example: "10:00"
 *                         endTime:
 *                           type: string
 *                           example: "12:00"
 *           examples:
 *             singleSlot:
 *               summary: Add one slot
 *               value:
 *                 dayOfWeek: 1
 *                 startTime: "10:00"
 *                 endTime: "12:00"
 *             multipleSlots:
 *               summary: Add multiple slots at once
 *               value:
 *                 slots:
 *                   - dayOfWeek: 0
 *                     startTime: "09:00"
 *                     endTime: "11:00"
 *                   - dayOfWeek: 2
 *                     startTime: "18:00"
 *                     endTime: "20:00"
 *     responses:
 *       201:
 *         description: Schedule slots created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       404:
 *         description: Teacher profile not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 *       409:
 *         description: Overlapping slots
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/me/schedules', jwtAuth, async (req, res, next) => {
  try {
    const result = await teacherService.createMySchedules(req.user.id, req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{id}/schedules:
 *   post:
 *     tags: [teachers]
 *     summary: POST /api/teachers/{id}/schedules
 *     security:
 *       - bearerAuth: []
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
router.post('/:id/schedules', jwtAuth, async (req, res, next) => {
  try {
    const schedule = await teacherService.createSchedule(req.params.id, req.user.id, req.body);
    res.status(201).json(schedule);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{teacherId}/schedules/{scheduleId}:
 *   put:
 *     tags: [teachers]
 *     summary: PUT /api/teachers/{teacherId}/schedules/{scheduleId}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
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
router.put('/:teacherId/schedules/:scheduleId', jwtAuth, async (req, res, next) => {
  try {
    const schedule = await teacherService.updateSchedule(req.params.scheduleId, req.params.teacherId, req.user.id, req.body);
    res.json(schedule);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/teachers/{teacherId}/schedules/{scheduleId}:
 *   delete:
 *     tags: [teachers]
 *     summary: DELETE /api/teachers/{teacherId}/schedules/{scheduleId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: teacherId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: scheduleId
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
router.delete('/:teacherId/schedules/:scheduleId', jwtAuth, async (req, res, next) => {
  try {
    const result = await teacherService.deleteSchedule(req.params.scheduleId, req.params.teacherId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
