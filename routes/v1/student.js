const express = require('express');
const router = express.Router();
const studentSessionsService = require('../../services/studentSessionsService');
const studentCoursesService = require('../../services/studentCoursesService');
const { jwtAuth } = require('../../middleware/jwtAuth');

function getLang(req) {
  const accept = req.headers['accept-language'] || '';
  return accept.startsWith('ar') ? 'ar' : 'en';
}

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

router.get('/sessions/:id/report', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentSessionsService.getSessionReport(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

router.get('/courses', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getMyCourses(req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

router.get('/courses/:id', jwtAuth, async (req, res, next) => {
  try {
    const lang = getLang(req);
    const data = await studentCoursesService.getCourseDetails(req.params.id, req.user.id, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

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

module.exports = router;
