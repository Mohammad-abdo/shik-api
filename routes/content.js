const express = require('express');
const router = express.Router();
const multer = require('multer');
const contentService = require('../services/contentService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

const upload = multer({ storage: multer.memoryStorage() });

/**
 * @openapi
 * /api/content/:
 *   get:
 *     tags: [content]
 *     summary: GET /api/content/
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
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await contentService.getAllContent(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/content/:
 *   post:
 *     tags: [content]
 *     summary: POST /api/content/
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
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
router.post('/', jwtAuth, upload.single('file'), async (req, res, next) => {
  try {
    const content = await contentService.create(req.user.id, req.body, req.file);
    res.status(201).json(content);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/content/pending:
 *   get:
 *     tags: [content]
 *     summary: GET /api/content/pending
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

/**
 * @openapi
 * /api/content/my-content:
 *   get:
 *     tags: [content]
 *     summary: GET /api/content/my-content
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

/**
 * @openapi
 * /api/content/{id}:
 *   get:
 *     tags: [content]
 *     summary: GET /api/content/{id}
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
    const content = await contentService.getById(req.params.id);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/content/{id}/approve:
 *   post:
 *     tags: [content]
 *     summary: POST /api/content/{id}/approve
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
router.post('/:id/approve', jwtAuth, permissions(['content.approve']), async (req, res, next) => {
  try {
    const content = await contentService.approve(req.params.id, req.user.id);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/content/{id}/reject:
 *   post:
 *     tags: [content]
 *     summary: POST /api/content/{id}/reject
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
router.post('/:id/reject', jwtAuth, permissions(['content.approve']), async (req, res, next) => {
  try {
    const content = await contentService.reject(req.params.id, req.user.id, req.body.reason);
    res.json(content);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/content/{id}:
 *   delete:
 *     tags: [content]
 *     summary: DELETE /api/content/{id}
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
    const result = await contentService.deleteContent(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
