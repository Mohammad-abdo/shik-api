const express = require('express');
const router = express.Router();
const examService = require('../services/examService');
const { jwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/exams/:
 *   post:
 *     tags: [exams]
 *     summary: POST /api/exams/
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
    const exam = await examService.createExam(req.body, req.user.id);
    res.status(201).json(exam);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}/questions:
 *   post:
 *     tags: [exams]
 *     summary: POST /api/exams/{id}/questions
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
router.post('/:id/questions', jwtAuth, async (req, res, next) => {
  try {
    const question = await examService.addQuestion(req.params.id, req.body, req.user.id);
    res.status(201).json(question);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}/publish:
 *   post:
 *     tags: [exams]
 *     summary: POST /api/exams/{id}/publish
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
router.post('/:id/publish', jwtAuth, async (req, res, next) => {
  try {
    const exam = await examService.publishExam(req.params.id, req.user.id);
    res.json(exam);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}:
 *   delete:
 *     tags: [exams]
 *     summary: DELETE /api/exams/{id}
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
router.delete('/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.deleteExam(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}:
 *   get:
 *     tags: [exams]
 *     summary: GET /api/exams/{id}
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
router.get('/:id', jwtAuth, async (req, res, next) => {
  try {
    const exam = await examService.getExam(req.params.id, req.user.id);
    res.json(exam);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}/submit:
 *   post:
 *     tags: [exams]
 *     summary: POST /api/exams/{id}/submit
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
router.post('/:id/submit', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.submitExam(req.params.id, req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{id}/results:
 *   get:
 *     tags: [exams]
 *     summary: GET /api/exams/{id}/results
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
router.get('/:id/results', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.getResults(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/{examId}/submissions/{submissionId}/grade:
 *   put:
 *     tags: [exams]
 *     summary: PUT /api/exams/{examId}/submissions/{submissionId}/grade
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
 *         name: examId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: submissionId
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
router.put('/:examId/submissions/:submissionId/grade', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.gradeExam(req.params.examId, req.params.submissionId, req.user.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/student/my-exams:
 *   get:
 *     tags: [exams]
 *     summary: GET /api/exams/student/my-exams
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
router.get('/student/my-exams', jwtAuth, async (req, res, next) => {
  try {
    const exams = await examService.getStudentMyExams(req.user.id);
    res.json(exams);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/exams/teacher/my-exams:
 *   get:
 *     tags: [exams]
 *     summary: GET /api/exams/teacher/my-exams
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
router.get('/teacher/my-exams', jwtAuth, async (req, res, next) => {
  try {
    const exams = await examService.getTeacherMyExams(req.user.id);
    res.json(exams);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
