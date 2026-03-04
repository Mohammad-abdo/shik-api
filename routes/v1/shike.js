const express = require('express');
const router = express.Router();
const sheikhMobileRoutes = require('./sheikh-mobile');

// Base path: /api/v1/shike/mobile
router.use('/mobile', sheikhMobileRoutes);

module.exports = router;
