const express = require('express');
const router = express.Router();
const quranSheikhsRoutes = require('./quranSheikhs');
const bookingsRoutes = require('./bookings');
const studentRoutes = require('./student');
const coursesRoutes = require('./courses');
const enrollmentsRoutes = require('./enrollments');
const mobileHeroRoutes = require('./mobile-hero');
const shikeRoutes = require('./shike');

router.use('/quran-sheikhs', quranSheikhsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/student', studentRoutes);
router.use('/courses', coursesRoutes);
router.use('/enrollments', enrollmentsRoutes);
router.use('/baners', mobileHeroRoutes);
router.use('/shike', shikeRoutes);

module.exports = router;
