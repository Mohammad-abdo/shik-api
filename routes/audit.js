const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/audit/logs:
 *   get:
 *     tags: [audit]
 *     summary: GET /api/audit/logs
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
router.get('/logs', jwtAuth, permissions(['reports.view']), async (req, res, next) => {
  try {
    const filters = {
      userId: req.query.userId,
      entity: req.query.entity,
      entityId: req.query.entityId,
      action: req.query.action,
      startDate: req.query.startDate ? new Date(req.query.startDate) : undefined,
      endDate: req.query.endDate ? new Date(req.query.endDate) : undefined,
      page: req.query.page ? parseInt(req.query.page, 10) : 1,
      limit: req.query.limit ? parseInt(req.query.limit, 10) : 50,
    };
    const result = await auditService.getLogs(filters);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
///كسم المشايخ