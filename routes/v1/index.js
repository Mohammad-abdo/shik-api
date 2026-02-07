const express = require('express');
const router = express.Router();
const quranSheikhsRoutes = require('./quranSheikhs');
const bookingsRoutes = require('./bookings');
const studentRoutes = require('./student');

router.use('/quran-sheikhs', quranSheikhsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/student', studentRoutes);

module.exports = router;
