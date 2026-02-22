const express = require('express');
const router = express.Router();
const studentSubscriptionService = require('../services/studentSubscriptionService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/student-subscriptions/packages:
 *   post:
 *     tags: [student-subscriptions]
 *     summary: POST /api/student-subscriptions/packages
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
    const pkg = await studentSubscriptionService.createPackage(req.body, req.user.id);
    res.status(201).json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages:
 *   get:
 *     tags: [student-subscriptions]
 *     summary: GET /api/student-subscriptions/packages
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
    const packages = await studentSubscriptionService.getAllPackages(activeOnly);
    res.json(packages);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   get:
 *     tags: [student-subscriptions]
 *     summary: GET /api/student-subscriptions/packages/{id}
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
    const pkg = await studentSubscriptionService.getPackageById(req.params.id);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   put:
 *     tags: [student-subscriptions]
 *     summary: PUT /api/student-subscriptions/packages/{id}
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
    const pkg = await studentSubscriptionService.updatePackage(req.params.id, req.body);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   delete:
 *     tags: [student-subscriptions]
 *     summary: DELETE /api/student-subscriptions/packages/{id}
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
    const result = await studentSubscriptionService.deletePackage(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/subscribe:
 *   post:
 *     tags: [student-subscriptions]
 *     summary: POST /api/student-subscriptions/subscribe
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
    const sub = await studentSubscriptionService.subscribe(req.user.id, req.body);
    res.status(201).json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/my-subscriptions:
 *   get:
 *     tags: [student-subscriptions]
 *     summary: GET /api/student-subscriptions/my-subscriptions
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
    const subs = await studentSubscriptionService.getMySubscriptions(req.user.id);
    res.json(subs);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/my-active:
 *   get:
 *     tags: [student-subscriptions]
 *     summary: GET /api/student-subscriptions/my-active
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
    const sub = await studentSubscriptionService.getMyActive(req.user.id);
    res.json(sub || {});
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/cancel/{id}:
 *   post:
 *     tags: [student-subscriptions]
 *     summary: POST /api/student-subscriptions/cancel/{id}
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
    const sub = await studentSubscriptionService.cancel(req.params.id, req.user.id);
    res.json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/admin/all:
 *   get:
 *     tags: [student-subscriptions]
 *     summary: GET /api/student-subscriptions/admin/all
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
    const result = await studentSubscriptionService.getAllAdmin(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
