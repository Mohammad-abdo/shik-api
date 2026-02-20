const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/subscriptions/packages:
 *   post:
 *     tags: [subscriptions]
 *     summary: POST /api/subscriptions/packages
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
router.post('/packages', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.createPackage(req.body);
    res.status(201).json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/packages:
 *   get:
 *     tags: [subscriptions]
 *     summary: GET /api/subscriptions/packages
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
router.get('/packages', async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const packages = await subscriptionService.getAllPackages(activeOnly);
    res.json(packages);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/packages/{id}:
 *   get:
 *     tags: [subscriptions]
 *     summary: GET /api/subscriptions/packages/{id}
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
router.get('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await subscriptionService.getPackageById(req.params.id);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/packages/{id}:
 *   put:
 *     tags: [subscriptions]
 *     summary: PUT /api/subscriptions/packages/{id}
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
router.put('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.updatePackage(req.params.id, req.body);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/packages/{id}:
 *   delete:
 *     tags: [subscriptions]
 *     summary: DELETE /api/subscriptions/packages/{id}
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
router.delete('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const result = await subscriptionService.deletePackage(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/subscribe:
 *   post:
 *     tags: [subscriptions]
 *     summary: POST /api/subscriptions/subscribe
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
router.post('/subscribe', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.subscribe(req.user.id, req.body);
    res.status(201).json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/my-subscriptions:
 *   get:
 *     tags: [subscriptions]
 *     summary: GET /api/subscriptions/my-subscriptions
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
router.get('/my-subscriptions', jwtAuth, async (req, res, next) => {
  try {
    const subs = await subscriptionService.getMySubscriptions(req.user.id);
    res.json(subs);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/my-active:
 *   get:
 *     tags: [subscriptions]
 *     summary: GET /api/subscriptions/my-active
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
router.get('/my-active', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.getMyActive(req.user.id);
    res.json(sub || {});
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/cancel/{id}:
 *   post:
 *     tags: [subscriptions]
 *     summary: POST /api/subscriptions/cancel/{id}
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
router.post('/cancel/:id', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancel(req.params.id, req.user.id);
    res.json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/subscriptions/admin/all:
 *   get:
 *     tags: [subscriptions]
 *     summary: GET /api/subscriptions/admin/all
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
router.get('/admin/all', jwtAuth, permissions(['subscriptions.read']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await subscriptionService.getAllAdmin(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
