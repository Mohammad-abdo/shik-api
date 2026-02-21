const express = require('express');
const router = express.Router();
const courseV1Service = require('../../services/courseV1Service');
const { jwtAuth } = require('../../middleware/jwtAuth');

// Endpoint 1: GET /v1/courses/{courseId}
// تفاصيل الدورة + قائمة المشايخ مع عدد الدروس لكل شيخ
/**
 * @openapi
 * /api/v1/courses/{courseId}:
 *   get:
 *     tags: [courses]
 *     summary: GET /api/v1/courses/{courseId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
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
router.get('/:courseId', jwtAuth, async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const course = await courseV1Service.getCourseWithSheikhs(courseId);

    res.status(200).json({
      status: true,
      message: 'تم جلب بيانات الدورة بنجاح',
      data: { course }
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint 2: GET /v1/courses/{courseId}/sheikhs/{sheikhId}
// تفاصيل الشيخ في سياق الدورة
/**
 * @openapi
 * /api/v1/courses/{courseId}/sheikhs/{sheikhId}:
 *   get:
 *     tags: [courses]
 *     summary: GET /api/v1/courses/{courseId}/sheikhs/{sheikhId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sheikhId
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
router.get('/:courseId/sheikhs/:sheikhId', jwtAuth, async (req, res, next) => {
  try {
    const { courseId, sheikhId } = req.params;
    const sheikh = await courseV1Service.getSheikhInCourseContext(courseId, sheikhId);

    res.status(200).json({
      status: true,
      message: 'تم جلب بيانات الشيخ بنجاح',
      data: { sheikh }
    });
  } catch (error) {
    next(error);
  }
});

// Endpoint 3: GET /v1/courses/{courseId}/sheikhs/{sheikhId}/lessons
// دروس الشيخ في الدورة مع pagination وفلتر
/**
 * @openapi
 * /api/v1/courses/{courseId}/sheikhs/{sheikhId}/lessons:
 *   get:
 *     tags: [courses]
 *     summary: GET /api/v1/courses/{courseId}/sheikhs/{sheikhId}/lessons
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: sheikhId
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
router.get('/:courseId/sheikhs/:sheikhId/lessons', jwtAuth, async (req, res, next) => {
  try {
    const { courseId, sheikhId } = req.params;
    const { page = 1, limit = 20, isFree } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      isFree: isFree ? isFree === 'true' : undefined,
      userId: req.user.id
    };

    const result = await courseV1Service.getSheikhLessonsInCourse(courseId, sheikhId, options);

    res.status(200).json({
      status: true,
      message: 'تم جلب الدروس بنجاح',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;