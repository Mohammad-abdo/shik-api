const express = require('express');
const router = express.Router();
const examService = require('../services/examService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const exam = await examService.createExam(req.body, req.user.id);
    res.status(201).json(exam);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/questions', jwtAuth, async (req, res, next) => {
  try {
    const question = await examService.addQuestion(req.params.id, req.body, req.user.id);
    res.status(201).json(question);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/publish', jwtAuth, async (req, res, next) => {
  try {
    const exam = await examService.publishExam(req.params.id, req.user.id);
    res.json(exam);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.deleteExam(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', jwtAuth, async (req, res, next) => {
  try {
    const exam = await examService.getExam(req.params.id, req.user.id);
    res.json(exam);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/submit', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.submitExam(req.params.id, req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id/results', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.getResults(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/:examId/submissions/:submissionId/grade', jwtAuth, async (req, res, next) => {
  try {
    const result = await examService.gradeExam(req.params.examId, req.params.submissionId, req.user.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/student/my-exams', jwtAuth, async (req, res, next) => {
  try {
    const exams = await examService.getStudentMyExams(req.user.id);
    res.json(exams);
  } catch (e) {
    next(e);
  }
});

router.get('/teacher/my-exams', jwtAuth, async (req, res, next) => {
  try {
    const exams = await examService.getTeacherMyExams(req.user.id);
    res.json(exams);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
