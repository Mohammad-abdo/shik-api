const express = require('express');
const router = express.Router();
const studentSessionsService = require('../../services/studentSessionsService');
const studentCoursesService = require('../../services/studentCoursesService');
const quranSheikhsService = require('../../services/quranSheikhsService');
const courseV1Service = require('../../services/courseV1Service');
const notificationService = require('../../services/notificationService');
const { jwtAuth } = require('../../middleware/jwtAuth');

function getLang(req) {
  const accept = req.headers['accept-language'] || '';
  return accept.startsWith('ar') ? 'ar' : 'en';
}

/**
 * @openapi
 * /api/v1/student/search/sheikhs:
 *   get:
 *     tags: [student]
 *     summary: Search sheikhs (student flow) with pagination
 *     description: Returns a paginated list of bookable Quran sheikhs (FULL_TEACHER). Optional search by name (English or Arabic). Requires student JWT.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by sheikh name (English or Arabic)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Alias for q
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 10 }
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of bookable sheikhs
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: 'Sheikhs search completed' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sheikhs:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           title: { type: string }
 *                           specialization: { type: string }
 *                           image: { type: string, nullable: true }
 *                           rating: { type: number }
 *                           starting_price: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         current_page: { type: integer }
 *                         total_pages: { type: integer }
 *                         total_items: { type: integer }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/search/sheikhs', jwtAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 10));
    const search = req.query.q || req.query.search || '';
    const lang = getLang(req);
    const data = await quranSheikhsService.getBookableSheikhsNotInCourses(page, limit, search || undefined, lang);
    res.json({ status: true, message: 'Sheikhs search completed', data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/search/courses:
 *   get:
 *     tags: [student]
 *     summary: Search courses (student flow) with pagination
 *     description: Returns a paginated list of published courses. Optional search by title or description (English or Arabic). Requires student JWT.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: q
 *         schema: { type: string }
 *         description: Search by course title or description (English or Arabic)
 *       - in: query
 *         name: search
 *         schema: { type: string }
 *         description: Alias for q
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 message: { type: string, example: 'Courses search completed' }
 *                 data:
 *                   type: object
 *                   properties:
 *                     courses:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           name: { type: string }
 *                           description: { type: string }
 *                           image: { type: string, nullable: true }
 *                           price: { type: string }
 *                           duration: { type: string, nullable: true }
 *                           lessonsCount: { type: integer }
 *                           studentsCount: { type: integer }
 *                           rating: { type: number, nullable: true }
 *                           sheikhs: { type: array, items: { type: object } }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *                         hasNextPage: { type: boolean }
 *                         hasPrevPage: { type: boolean }
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.get('/search/courses', jwtAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const search = req.query.q || req.query.search || '';
    const data = await courseV1Service.searchCourses({
      page,
      limit,
      search: search || undefined,
      status: 'PUBLISHED',
    });
    res.json({ status: true, message: 'Courses search completed', data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/notifications:
 *   get:
 *     tags: [student]
 *     summary: Get my notifications (student flow) with pagination
 *     description: Returns the authenticated student's notifications. Supports unread-only filter and pagination.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: unreadOnly
 *         schema: { type: boolean }
 *         description: If true, return only unread notifications
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *     responses:
 *       200:
 *         description: List of notifications (array)
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id: { type: string }
 *                   userId: { type: string }
 *                   type: { type: string }
 *                   title: { type: string }
 *                   message: { type: string }
 *                   data: {}
 *                   relatedId: { type: string, nullable: true }
 *                   isRead: { type: boolean }
 *                   readAt: { type: string, nullable: true }
 *                   createdAt: { type: string }
 *       401:
 *         description: Unauthorized
 */
router.get('/notifications', jwtAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const unreadOnly = req.query.unreadOnly === 'true';
    const offset = (page - 1) * limit;
    const notifications = await notificationService.getUserNotifications(req.user.id, { unreadOnly, limit, offset });
    res.json(notifications);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/notifications/read-all:
 *   patch:
 *     tags: [student]
 *     summary: Mark all my notifications as read
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
router.patch('/notifications/read-all', jwtAuth, async (req, res, next) => {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    res.json({ status: true, ...result });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/notifications/{id}/read:
 *   patch:
 *     tags: [student]
 *     summary: Mark one notification as read
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.patch('/notifications/:id/read', jwtAuth, async (req, res, next) => {
  try {
    const result = await notificationService.markAsRead(req.user.id, req.params.id);
    res.json({ status: true, ...result });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/notifications/{id}:
 *   delete:
 *     tags: [student]
 *     summary: Delete one of my notifications
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema: { type: string }
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Notification not found
 */
router.delete('/notifications/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await notificationService.deleteNotification(req.params.id, req.user.id);
    res.json({ status: true, ...result });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/my-courses:
 *   get:
 *     tags: [student]
 *     summary: Get my enrolled courses (FULL details with lessons, videos, sheikhs, progress)
 *     description: |
 *       Returns the authenticated student's enrolled courses with COMPLETE details:
 *       - Course info (name, description, full_description, image, price, level, category, rating, etc.)
 *       - All lessons with their videos (title, video_url, thumbnail, duration, order)
 *       - Per-video watch progress and completion status
 *       - All sheikhs teaching the course (name, image, bio, specialization, rating, experience)
 *       - Student progress (progress_percentage, completed_videos, completed_at)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Full details of enrolled courses
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       name: { type: string }
 *                       name_ar: { type: string, nullable: true }
 *                       description: { type: string }
 *                       full_description: { type: string }
 *                       image: { type: string, nullable: true }
 *                       intro_video_url: { type: string, nullable: true }
 *                       intro_video_thumbnail: { type: string, nullable: true }
 *                       price: { type: number }
 *                       duration: { type: string, nullable: true }
 *                       category: { type: string, nullable: true }
 *                       level: { type: string, nullable: true, enum: [BEGINNER, INTERMEDIATE, ADVANCED] }
 *                       status: { type: string }
 *                       is_featured: { type: boolean }
 *                       rating: { type: number }
 *                       total_reviews: { type: integer }
 *                       total_lessons: { type: integer }
 *                       total_videos: { type: integer }
 *                       students_count: { type: integer }
 *                       progress_percentage: { type: integer }
 *                       completed_videos: { type: integer }
 *                       enrollment_date: { type: string }
 *                       completed_at: { type: string, nullable: true }
 *                       sheikhs:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             name: { type: string }
 *                             image: { type: string, nullable: true }
 *                             bio: { type: string }
 *                             specialization: { type: string }
 *                             rating: { type: number }
 *                             experience: { type: integer }
 *                       lessons:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id: { type: string }
 *                             title: { type: string }
 *                             description: { type: string }
 *                             order: { type: integer }
 *                             duration_minutes: { type: integer }
 *                             is_free: { type: boolean }
 *                             is_completed: { type: boolean }
 *                             videos_count: { type: integer }
 *                             videos:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id: { type: string }
 *                                   title: { type: string }
 *                                   video_url: { type: string }
 *                                   thumbnail_url: { type: string, nullable: true }
 *                                   duration_seconds: { type: integer }
 *                                   order: { type: integer }
 *                                   is_completed: { type: boolean }
 *                                   watch_progress: { type: integer }
 *       401:
 *         description: Unauthorized
 */
router.get('/my-courses', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getMyCourses(req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/my-bookings:
 *   get:
 *     tags: [student]
 *     summary: Get all my bookings (with sheikh details and subscription status)
 *     description: Returns all bookings for the authenticated student, including sheikh details and whether the student is currently subscribed to each sheikh.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Paginated list of student bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     bookings:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           id: { type: string }
 *                           date: { type: string }
 *                           startTime: { type: string }
 *                           duration: { type: integer }
 *                           status: { type: string, enum: [PENDING, CONFIRMED, COMPLETED, CANCELLED, REJECTED] }
 *                           totalPrice: { type: number }
 *                           sheikh:
 *                             type: object
 *                             properties:
 *                               id: { type: string }
 *                               name: { type: string }
 *                               image: { type: string, nullable: true }
 *                               specialization: { type: string }
 *                               rating: { type: number }
 *                               is_subscribed: { type: boolean, description: 'Whether the student is currently subscribed to this sheikh' }
 *                           sessions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 id: { type: string }
 *                                 scheduledDate: { type: string }
 *                                 startTime: { type: string }
 *                                 endTime: { type: string }
 *                                 status: { type: string }
 *                                 meetingLink: { type: string, nullable: true }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *                         hasNextPage: { type: boolean }
 *                         hasPrevPage: { type: boolean }
 *       401:
 *         description: Unauthorized
 */
router.get('/my-bookings', jwtAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const lang = getLang(req);
    const data = await studentSessionsService.getMyBookings(req.user.id, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/sessions:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/sessions
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
router.get('/sessions', jwtAuth, async (req, res, next) => {
  try {
    const month = parseInt(req.query.month) || new Date().getMonth() + 1;
    const year = parseInt(req.query.year) || new Date().getFullYear();
    const lang = getLang(req);
    const data = await studentSessionsService.getMySessions(req.user.id, month, year, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/sessions/{id}/report:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/sessions/{id}/report
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
router.get('/sessions/:id/report', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentSessionsService.getSessionReport(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/courses:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/courses
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
router.get('/courses', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getMyCourses(req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/courses/{id}:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/courses/{id}
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
router.get('/courses/:id', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getCourseDetails(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/reports:
 *   get:
 *     tags: [student]
 *     summary: GET /api/v1/student/reports
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
router.get('/reports', jwtAuth, async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const lang = getLang(req);
    const data = await studentSessionsService.getMyReports(req.user.id, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/v1/student/reports/sheikh/{sheikhId}:
 *   get:
 *     tags: [student]
 *     summary: Get all reports from a specific sheikh for the authenticated student
 *     description: Returns paginated session reports that a specific sheikh has written for the student, including memorization progress, revisions, and ratings.
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: sheikhId
 *         required: true
 *         schema: { type: string }
 *         description: The teacher/sheikh ID
 *       - in: query
 *         name: page
 *         schema: { type: integer, default: 1 }
 *         description: Page number (1-based)
 *       - in: query
 *         name: limit
 *         schema: { type: integer, default: 20 }
 *         description: Items per page (max 100)
 *     responses:
 *       200:
 *         description: Reports from the specified sheikh
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status: { type: boolean, example: true }
 *                 data:
 *                   type: object
 *                   properties:
 *                     sheikh:
 *                       type: object
 *                       properties:
 *                         id: { type: string }
 *                         name: { type: string }
 *                         image: { type: string, nullable: true }
 *                         specialization: { type: string }
 *                     reports:
 *                       type: array
 *                       items:
 *                         type: object
 *                         properties:
 *                           report_id: { type: string }
 *                           session_id: { type: string }
 *                           date: { type: string }
 *                           day_name: { type: string }
 *                           time: { type: string }
 *                           rating: { type: integer, nullable: true }
 *                           content: { type: object }
 *                           memorizations:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 surah: { type: string }
 *                                 from_ayah: { type: integer }
 *                                 to_ayah: { type: integer }
 *                                 is_full_surah: { type: boolean }
 *                           revisions:
 *                             type: array
 *                             items:
 *                               type: object
 *                               properties:
 *                                 type: { type: string }
 *                                 range_type: { type: string }
 *                                 from_surah: { type: string }
 *                                 to_surah: { type: string }
 *                     pagination:
 *                       type: object
 *                       properties:
 *                         page: { type: integer }
 *                         limit: { type: integer }
 *                         total: { type: integer }
 *                         totalPages: { type: integer }
 *                         hasNextPage: { type: boolean }
 *                         hasPrevPage: { type: boolean }
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Sheikh not found
 */
router.get('/reports/sheikh/:sheikhId', jwtAuth, async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const lang = getLang(req);
    const data = await studentSessionsService.getReportsBySheikh(req.user.id, req.params.sheikhId, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
