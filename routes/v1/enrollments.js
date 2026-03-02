const express = require('express');
const {
  enrollInCourse,
  createCourseFawryReference,
  getStudentEnrollments,
  checkEnrollment
} = require('../../services/enrollmentService');
const { startLesson, completeLesson, getCourseProgress } = require('../../services/videoProgressService');
const { authenticateToken } = require('../../middleware/auth');
const { sendResponse, sendErrorResponse } = require('../../utils/response');

const router = express.Router();

/**
 * @route POST /api/v1/enrollments/:courseId/enroll
 * @desc Enroll student in a course
 * @access Private (Student)
 * @body { sheikId?: string }
 */
/**
 * @openapi
 * /api/v1/enrollments/{courseId}/enroll:
 *   post:
 *     tags: [enrollments]
 *     summary: Subscribe student to the full course (الدورة كاملة)
 *     description: الاشتراك هنا يكون للدورة كاملة (الكورس كله) وليس لدرس منفصل.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               sheikId:
 *                 type: string
 *                 description: Optional sheikh/teacher identifier in this course.
 *                 example: clxsheikh123
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
router.post('/:courseId/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sheikId } = req.body;
    const studentId = req.user.id;
    const bypassPayment = req.user.role === 'ADMIN' || req.user.role === 'SUPER_ADMIN';

    const enrollment = await enrollInCourse(courseId, studentId, sheikId, { bypassPayment });

    sendResponse(res, 201, 'Successfully enrolled in course', enrollment);
  } catch (error) {
    console.error('Enroll in course error:', error);
    sendErrorResponse(res, error.statusCode || 500, error.message || 'Failed to enroll in course');
  }
});

/**
 * @route POST /api/v1/enrollments/:courseId/fawry/reference-number
 * @desc Create Fawry reference number for course enrollment
 * @access Private (Student)
 */
/**
 * @openapi
 * /api/v1/enrollments/{courseId}/fawry/reference-number:
 *   post:
 *     tags: [enrollments]
 *     summary: Create Fawry reference for full-course subscription (اشتراك دورة)
 *     description: ينشئ رقم فوري لدفع اشتراك الدورة كاملة (الكورس كامل) وليس درسًا منفردًا.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: courseId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               expiryHours:
 *                 type: integer
 *                 example: 24
 *               language:
 *                 type: string
 *                 enum: [ar-eg, en-gb]
 *                 example: ar-eg
 *     responses:
 *       201:
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
 *       402:
 *         description: Payment required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/:courseId/fawry/reference-number', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { expiryHours, language } = req.body || {};

    const result = await createCourseFawryReference(courseId, req.user, { expiryHours, language });
    sendResponse(res, 201, 'Course Fawry payment initialized successfully', result);
  } catch (error) {
    console.error('Create course Fawry reference error:', error);
    sendErrorResponse(
      res,
      error.statusCode || 500,
      error.message || 'Failed to initialize Fawry payment for course'
    );
  }
});

/**
 * @route GET /api/v1/enrollments/my-courses
 * @desc Get student's enrolled courses
 * @access Private (Student)
 * @query { page?: number, limit?: number }
 */
/**
 * @openapi
 * /api/v1/enrollments/my-courses:
 *   get:
 *     tags: [enrollments]
 *     summary: GET /api/v1/enrollments/my-courses
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
router.get('/my-courses', authenticateToken, async (req, res) => {
  try {
    const studentId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;

    const result = await getStudentEnrollments(studentId, page, limit);

    sendResponse(res, 200, 'Student enrollments retrieved successfully', result);
  } catch (error) {
    console.error('Get student enrollments error:', error);
    sendErrorResponse(res, 500, 'Failed to retrieve enrollments');
  }
});

/**
 * @route GET /api/v1/enrollments/:courseId/status
 * @desc Check if student is enrolled in course
 * @access Private (Student)
 */
/**
 * @openapi
 * /api/v1/enrollments/{courseId}/status:
 *   get:
 *     tags: [enrollments]
 *     summary: GET /api/v1/enrollments/{courseId}/status
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
router.get('/:courseId/status', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const enrollment = await checkEnrollment(courseId, studentId);

    if (enrollment) {
      sendResponse(res, 200, 'Student is enrolled', {
        isEnrolled: true,
        enrollment: {
          id: enrollment.id,
          status: enrollment.status,
          progress: enrollment.progress,
          enrolledAt: enrollment.enrolledAt,
          completedAt: enrollment.completedAt
        }
      });
    } else {
      sendResponse(res, 200, 'Student is not enrolled', {
        isEnrolled: false,
        enrollment: null
      });
    }
  } catch (error) {
    console.error('Check enrollment error:', error);
    sendErrorResponse(res, 500, 'Failed to check enrollment status');
  }
});

/**
 * @route POST /api/v1/enrollments/lessons/:lessonId/start
 * @desc Start watching a lesson
 * @access Private (Student)
 * @body { videoId?: string }
 */
/**
 * @openapi
 * /api/v1/enrollments/lessons/{lessonId}/start:
 *   post:
 *     tags: [enrollments]
 *     summary: Start watching lesson inside an already subscribed course
 *     description: هذا endpoint لتتبع التقدم فقط، ويتطلب اشتراكًا مسبقًا في الدورة كاملة.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: Optional video id if lesson contains multiple videos.
 *                 example: clxvideo123
 *     parameters:
 *       - in: path
 *         name: lessonId
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
router.post('/lessons/:lessonId/start', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { videoId } = req.body;
    const userId = req.user.id;

    const progress = await startLesson(lessonId, userId, videoId);

    sendResponse(res, 200, 'Lesson started successfully', progress);
  } catch (error) {
    console.error('Start lesson error:', error);
    sendErrorResponse(res, error.statusCode || 500, error.message || 'Failed to start lesson');
  }
});

/**
 * @route POST /api/v1/enrollments/lessons/:lessonId/complete
 * @desc Complete a lesson
 * @access Private (Student)
 * @body { videoId?: string, watchDurationSeconds?: number }
 */
/**
 * @openapi
 * /api/v1/enrollments/lessons/{lessonId}/complete:
 *   post:
 *     tags: [enrollments]
 *     summary: Mark lesson as completed inside an already subscribed course
 *     description: هذا endpoint لتسجيل إنهاء الدرس ضمن دورة مشترك فيها مسبقًا.
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               videoId:
 *                 type: string
 *                 description: Optional video id if lesson contains multiple videos.
 *                 example: clxvideo123
 *               watchDurationSeconds:
 *                 type: integer
 *                 description: Optional watched duration in seconds.
 *                 example: 1800
 *     parameters:
 *       - in: path
 *         name: lessonId
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
router.post('/lessons/:lessonId/complete', authenticateToken, async (req, res) => {
  try {
    const { lessonId } = req.params;
    const { videoId, watchDurationSeconds } = req.body;
    const userId = req.user.id;

    const result = await completeLesson(lessonId, userId, videoId, watchDurationSeconds);

    sendResponse(res, 200, 'Lesson completed successfully', result);
  } catch (error) {
    console.error('Complete lesson error:', error);
    sendErrorResponse(res, error.statusCode || 500, error.message || 'Failed to complete lesson');
  }
});

/**
 * @route GET /api/v1/enrollments/:courseId/progress
 * @desc Get student's progress in a course
 * @access Private (Student)
 */
/**
 * @openapi
 * /api/v1/enrollments/{courseId}/progress:
 *   get:
 *     tags: [enrollments]
 *     summary: GET /api/v1/enrollments/{courseId}/progress
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
router.get('/:courseId/progress', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;

    const progress = await getCourseProgress(courseId, userId);

    sendResponse(res, 200, 'Course progress retrieved successfully', progress);
  } catch (error) {
    console.error('Get course progress error:', error);
    sendErrorResponse(res, error.statusCode || 500, error.message || 'Failed to get course progress');
  }
});

module.exports = router;
