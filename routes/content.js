const express = require('express');
const router = express.Router();
const multer = require('multer');
const contentService = require('../services/contentService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

const upload = multer({ storage: multer.memoryStorage() });

router.get('/', jwtAuth, permissions(['content.read']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await contentService.getAllContent(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/', jwtAuth, upload.single('file'), async (req, res, next) => {
  try {
    const content = await contentService.create(req.user.id, req.body, req.file);
    res.status(201).json(content);
  } catch (e) {
    next(e);
  }
});

router.get('/pending', jwtAuth, permissions(['content.approve']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await contentService.getPendingContent(page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/my-content', jwtAuth, async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await contentService.getMyContent(req.user.id, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/:id', jwtAuth, async (req, res, next) => {
  try {
    const content = await contentService.getById(req.params.id);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/approve', jwtAuth, permissions(['content.approve']), async (req, res, next) => {
  try {
    const content = await contentService.approve(req.params.id, req.user.id);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

router.post('/:id/reject', jwtAuth, permissions(['content.approve']), async (req, res, next) => {
  try {
    const content = await contentService.reject(req.params.id, req.user.id, req.body.reason);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await contentService.deleteContent(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
