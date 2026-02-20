const express = require('express');
const router = express.Router();
const financeService = require('../services/financeService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/finance/statistics:
 *   get:
 *     tags: [finance]
 *     summary: GET /api/finance/statistics
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
router.get('/statistics', jwtAuth, permissions(['payments.view']), async (req, res, next) => {
  try {
    const stats = await financeService.getStatistics();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/payouts:
 *   get:
 *     tags: [finance]
 *     summary: GET /api/finance/payouts
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
router.get('/payouts', jwtAuth, async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await financeService.getPayouts(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/payouts/{id}/approve:
 *   post:
 *     tags: [finance]
 *     summary: POST /api/finance/payouts/{id}/approve
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
router.post('/payouts/:id/approve', jwtAuth, permissions(['payments.manage']), async (req, res, next) => {
  try {
    const payout = await financeService.approvePayout(req.params.id, req.user.id);
    res.json(payout);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/payouts/{id}/reject:
 *   post:
 *     tags: [finance]
 *     summary: POST /api/finance/payouts/{id}/reject
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
router.post('/payouts/:id/reject', jwtAuth, permissions(['payments.manage']), async (req, res, next) => {
  try {
    const payout = await financeService.rejectPayout(req.params.id, req.user.id, req.body.reason);
    res.json(payout);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/payouts/{id}/complete:
 *   post:
 *     tags: [finance]
 *     summary: POST /api/finance/payouts/{id}/complete
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
router.post('/payouts/:id/complete', jwtAuth, permissions(['payments.manage']), async (req, res, next) => {
  try {
    const payout = await financeService.completePayout(req.params.id, req.user.id);
    res.json(payout);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/wallet:
 *   get:
 *     tags: [finance]
 *     summary: GET /api/finance/wallet
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
router.get('/wallet', jwtAuth, async (req, res, next) => {
  try {
    const wallet = await financeService.getWallet(req.user.id);
    res.json(wallet);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/wallet/transactions:
 *   get:
 *     tags: [finance]
 *     summary: GET /api/finance/wallet/transactions
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
router.get('/wallet/transactions', jwtAuth, async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await financeService.getWalletTransactions(req.user.id, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/finance/wallet/payout-request:
 *   post:
 *     tags: [finance]
 *     summary: POST /api/finance/wallet/payout-request
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
router.post('/wallet/payout-request', jwtAuth, async (req, res, next) => {
  try {
    const payout = await financeService.createPayoutRequest(req.user.id, req.body);
    res.status(201).json(payout);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
