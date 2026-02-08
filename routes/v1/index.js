const express = require('express');
const router = express.Router();
const quranSheikhsRoutes = require('./quranSheikhs');
const bookingsRoutes = require('./bookings');
const studentRoutes = require('./student');
const coursesRoutes = require('./courses');
const enrollmentsRoutes = require('./enrollments');

router.use('/quran-sheikhs', quranSheikhsRoutes);
router.use('/bookings', bookingsRoutes);
router.use('/student', studentRoutes);
router.use('/courses', coursesRoutes);
router.use('/enrollments', enrollmentsRoutes);

module.exports = router;
