const express = require('express');
const router = express.Router();
const auditService = require('../services/auditService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

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
