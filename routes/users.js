const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

router.get('/me', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.put('/me', async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

router.put('/me/password', async (req, res, next) => {
  try {
    const result = await userService.updatePassword(req.user.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/me', async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
