const express = require('express');
const multer = require('multer');
const router = express.Router();
const sheikhMobileService = require('../../services/sheikhMobileService');
const authService = require('../../services/authService');
const fileUploadService = require('../../services/fileUploadService');
const { jwtAuth } = require('../../middleware/jwtAuth');
const roles = require('../../middleware/roles');
const { asyncHandler } = require('../../lib/asyncHandler');

const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });
const uploadVideo = multer({ storage: multer.memoryStorage(), limits: { fileSize: 150 * 1024 * 1024 } });

// ─── Public (no auth) ─────────────────────────────────────────────────────
router.post('/register', asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.register(req.body);
  res.status(201).json(result);
}));

router.post('/login', asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.login(req.body);
  res.json(result);
}));

// ─── OTP ──────────────────────────────────────────────────────────────────
router.post('/send-login-otp', asyncHandler(async (req, res) => {
  const { method, identifier } = req.body;
  const result = await authService.sendLoginOtp(method, identifier);
  res.json(result);
}));

router.post('/resend-otp', asyncHandler(async (req, res) => {
  const { email, phone } = req.body;
  if (phone) {
    await authService.sendLoginOtp('phone', phone);
    return res.json({ success: true, message: 'OTP resent to phone' });
  }
  if (email) {
    await authService.sendLoginOtp('email', email);
    return res.json({ success: true, message: 'OTP resent to email' });
  }
  const err = new Error('Email or phone is required');
  err.statusCode = 400;
  throw err;
}));

// ─── Forgot / Reset Password ─────────────────────────────────────────────
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const result = req.body.student_phone
    ? await authService.mobileForgotPassword(req.body)
    : await authService.forgotPassword(req.body);
  res.json(result);
}));

router.post('/reset-password', asyncHandler(async (req, res) => {
  const result = req.body.password_confirmation
    ? await authService.mobileResetPassword(req.body)
    : await authService.resetPassword(req.body);
  res.json(result);
}));

// About & Privacy (public)
router.get('/about', asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getAbout();
  res.json(data);
}));

router.get('/privacy-policy', asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getPrivacyPolicy();
  res.json(data);
}));

// ─── Protected (sheikh only) ─────────────────────────────────────────────────
const sheikhAuth = [jwtAuth, roles('TEACHER')];

router.post('/logout', sheikhAuth, (req, res) => {
  res.json({ success: true, message: 'Logged out' });
});

router.delete('/delete-account', sheikhAuth, asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.deleteAccount(req.user.id);
  res.json(result);
}));

router.get('/profile', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getProfile(req.user.id);
  res.json(data);
}));

router.put('/profile', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.updateProfile(req.user.id, req.body);
  res.json(data);
}));

// ─── File Upload (image / video) ──────────────────────────────────────────
router.post('/upload/image', sheikhAuth, uploadImage.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file, 'images');
    res.status(201).json({ success: true, url });
  } catch (e) { next(e); }
});

router.post('/upload/video', sheikhAuth, uploadVideo.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file, 'videos', true);
    res.status(201).json({ success: true, url });
  } catch (e) { next(e); }
});

router.get('/stats/students-count', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getStudentsCount(req.user.id);
  res.json(data);
}));

router.get('/stats/today-sessions-count', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getTodaySessionsCount(req.user.id);
  res.json(data);
}));

router.get('/my-students', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getMyStudents(req.user.id);
  res.json(data);
}));

router.get('/my-students/:studentId', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getStudentDetails(req.user.id, req.params.studentId);
  res.json(data);
}));

router.get('/today-sessions', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getTodaySessions(req.user.id);
  res.json(data);
}));

router.get('/my-sessions', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getMySessions(req.user.id);
  res.json(data);
}));

// ─── تقييم الجلسة: تفاصيل، حفظ، مراجعة، تقرير (مطابق لصفحة الحجوزات) ─────
router.get('/session/:sessionId/details', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getSessionDetails(req.user.id, req.params.sessionId);
  res.json(data);
}));

router.post('/session/:sessionId/memorization', sheikhAuth, asyncHandler(async (req, res) => {
  const record = await sheikhMobileService.addMemorization(
    req.user.id,
    req.params.sessionId,
    req.body
  );
  res.status(201).json(record);
}));

router.post('/session/:sessionId/revision', sheikhAuth, asyncHandler(async (req, res) => {
  const record = await sheikhMobileService.addRevision(
    req.user.id,
    req.params.sessionId,
    req.body
  );
  res.status(201).json(record);
}));

router.post('/session/:sessionId/report', sheikhAuth, asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.addSessionReport(
    req.user.id,
    req.params.sessionId,
    req.body
  );
  res.status(201).json(result);
}));

router.get('/wallet', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getWallet(req.user.id);
  res.json(data);
}));

router.post('/wallet/withdraw', sheikhAuth, asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.requestWithdraw(req.user.id, req.body.amount);
  res.status(201).json(result);
}));

module.exports = router;
