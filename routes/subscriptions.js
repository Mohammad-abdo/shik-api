const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

router.post('/packages', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.createPackage(req.body);
    res.status(201).json(pkg);
  } catch (e) {
    next(e);
  }
});

router.get('/packages', async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const packages = await subscriptionService.getAllPackages(activeOnly);
    res.json(packages);
  } catch (e) {
    next(e);
  }
});

router.get('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await subscriptionService.getPackageById(req.params.id);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

router.put('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.updatePackage(req.params.id, req.body);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

router.delete('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const result = await subscriptionService.deletePackage(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/subscribe', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.subscribe(req.user.id, req.body);
    res.status(201).json(sub);
  } catch (e) {
    next(e);
  }
});

router.get('/my-subscriptions', jwtAuth, async (req, res, next) => {
  try {
    const subs = await subscriptionService.getMySubscriptions(req.user.id);
    res.json(subs);
  } catch (e) {
    next(e);
  }
});

router.get('/my-active', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.getMyActive(req.user.id);
    res.json(sub || {});
  } catch (e) {
    next(e);
  }
});

router.post('/cancel/:id', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancel(req.params.id, req.user.id);
    res.json(sub);
  } catch (e) {
    next(e);
  }
});

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
