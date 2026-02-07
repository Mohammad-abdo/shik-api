const express = require('express');
const router = express.Router();
const quranSheikhsService = require('../../services/quranSheikhsService');
const { jwtAuth } = require('../../middleware/jwtAuth');
const { optionalJwtAuth } = require('../../middleware/jwtAuth');

function getLang(req) {
  const accept = req.headers['accept-language'] || '';
  return accept.startsWith('ar') ? 'ar' : 'en';
}

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const search = req.query.search;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhs(page, limit, search, lang);
    res.json({ status: true, message: 'Sheikhs retrieved successfully', data });
  } catch (e) {
    next(e);
  }
});

router.get('/:id', optionalJwtAuth, async (req, res, next) => {
  try {
    const studentId = req.user?.id;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhById(req.params.id, studentId, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

router.get('/:id/reviews', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const lang = getLang(req);
    const data = await quranSheikhsService.getSheikhReviews(req.params.id, page, limit, lang);
    res.json({ status: true, data });
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reviews', jwtAuth, async (req, res, next) => {
  try {
    await quranSheikhsService.addSheikhReview(req.params.id, req.user.id, req.body);
    res.json({ status: true, message: 'Review added successfully' });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
