const express = require('express');
const { enrollInCourse, getStudentEnrollments, checkEnrollment } = require('../../services/enrollmentService');
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
router.post('/:courseId/enroll', authenticateToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    const { sheikId } = req.body;
    const studentId = req.user.id;

    const enrollment = await enrollInCourse(courseId, studentId, sheikId);

    sendResponse(res, 201, 'Successfully enrolled in course', enrollment);
  } catch (error) {
    console.error('Enroll in course error:', error);
    sendErrorResponse(res, error.statusCode || 500, error.message || 'Failed to enroll in course');
  }
});

/**
 * @route GET /api/v1/enrollments/my-courses
 * @desc Get student's enrolled courses
 * @access Private (Student)
 * @query { page?: number, limit?: number }
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