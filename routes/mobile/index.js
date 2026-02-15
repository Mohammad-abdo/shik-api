const express = require('express');
const router = express.Router();
const quranSheikhsRoutes = require('../v1/quranSheikhs');

router.use('/quran-sheikhs', quranSheikhsRoutes);

module.exports = router;
