const express = require('express');
const router = express.Router();
const sitePageService = require('../services/sitePageService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

// Public: get single page by slug (for displaying on frontend)
router.get('/by-slug/:slug', async (req, res, next) => {
  try {
    const page = await sitePageService.getBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (e) {
    next(e);
  }
});

// Admin: list all site pages
router.get('/', jwtAuth, permissions(['content.read']), async (req, res, next) => {
  try {
    const pages = await sitePageService.getAll();
    res.json(pages);
  } catch (e) {
    next(e);
  }
});

// Admin: get one by slug
router.get('/:slug', jwtAuth, permissions(['content.read']), async (req, res, next) => {
  try {
    const page = await sitePageService.getBySlug(req.params.slug);
    if (!page) {
      return res.status(404).json({ message: 'Page not found' });
    }
    res.json(page);
  } catch (e) {
    next(e);
  }
});

// Admin: update page content
router.patch('/:slug', jwtAuth, permissions(['content.approve', 'content.review']), async (req, res, next) => {
  try {
    const page = await sitePageService.updateBySlug(req.params.slug, req.body);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
