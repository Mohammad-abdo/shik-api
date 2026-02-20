const express = require('express');
const router = express.Router();
const sitePageService = require('../services/sitePageService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

// Public: get single page by slug (for displaying on frontend)
/**
 * @openapi
 * /api/pages/by-slug/{slug}:
 *   get:
 *     tags: [pages]
 *     summary: GET /api/pages/by-slug/{slug}
 *     parameters:
 *       - in: path
 *         name: slug
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
/**
 * @openapi
 * /api/pages/:
 *   get:
 *     tags: [pages]
 *     summary: GET /api/pages/
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
router.get('/', jwtAuth, permissions(['content.read']), async (req, res, next) => {
  try {
    const pages = await sitePageService.getAll();
    res.json(pages);
  } catch (e) {
    next(e);
  }
});

// Admin: get one by slug
/**
 * @openapi
 * /api/pages/{slug}:
 *   get:
 *     tags: [pages]
 *     summary: GET /api/pages/{slug}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: slug
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
/**
 * @openapi
 * /api/pages/{slug}:
 *   patch:
 *     tags: [pages]
 *     summary: PATCH /api/pages/{slug}
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
 *         name: slug
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
router.patch('/:slug', jwtAuth, permissions(['content.approve', 'content.review']), async (req, res, next) => {
  try {
    const page = await sitePageService.updateBySlug(req.params.slug, req.body);
    res.json(page);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
