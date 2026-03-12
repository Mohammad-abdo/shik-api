const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const sheikhMobileService = require('../../services/sheikhMobileService');
const authService = require('../../services/authService');
const fileUploadService = require('../../services/fileUploadService');
const { jwtAuth } = require('../../middleware/jwtAuth');
const roles = require('../../middleware/roles');
const { asyncHandler } = require('../../lib/asyncHandler');
const jwtLib = require('../../lib/jwt');

const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: 15 * 1024 * 1024 } });

const videoTempDir = path.join(fileUploadService.UPLOADS_BASE, '_tmp');
if (!fs.existsSync(videoTempDir)) fs.mkdirSync(videoTempDir, { recursive: true });
const uploadVideo = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, videoTempDir),
    filename: (_req, file, cb) => cb(null, `tmp_${Date.now()}_${file.originalname}`),
  }),
  limits: { fileSize: 5 * 1024 * 1024 * 1024 },
});

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
    const url = fileUploadService.uploadVideoFromDisk(req.file, 'videos');
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

// ─── Schedules (المواعيد) ─────────────────────────────────────────────────────
const scheduleGetHandler = asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getMySchedules(req.user.id);
  res.json(data);
});

const schedulePostHandler = asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.addMySchedules(req.user.id, req.body);
  res.status(201).json(result);
});

const schedulePutHandler = asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.updateMySchedule(req.user.id, req.params.scheduleId, req.body);
  res.json(result);
});

const scheduleDeleteHandler = asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.deleteMySchedule(req.user.id, req.params.scheduleId);
  res.json(result);
});

router.get('/my-schedules', sheikhAuth, scheduleGetHandler);
router.post('/my-schedules', sheikhAuth, schedulePostHandler);
router.put('/my-schedules/:scheduleId', sheikhAuth, schedulePutHandler);
router.delete('/my-schedules/:scheduleId', sheikhAuth, scheduleDeleteHandler);

router.get('/teachers/me/schedules', sheikhAuth, scheduleGetHandler);
router.post('/teachers/me/schedules', sheikhAuth, schedulePostHandler);
router.put('/teachers/me/schedules/:scheduleId', sheikhAuth, schedulePutHandler);
router.delete('/teachers/me/schedules/:scheduleId', sheikhAuth, scheduleDeleteHandler);

// Same handlers for path pattern: /teachers/:teacherId/schedules (app sends teacherId in URL)
router.get('/teachers/:teacherId/schedules', sheikhAuth, scheduleGetHandler);
router.post('/teachers/:teacherId/schedules', sheikhAuth, schedulePostHandler);
router.put('/teachers/:teacherId/schedules/:scheduleId', sheikhAuth, schedulePutHandler);
router.delete('/teachers/:teacherId/schedules/:scheduleId', sheikhAuth, scheduleDeleteHandler);

// ─── اختبار المواعيد من داخل السيرفر (بيانات فعلية، يعمل فقط في التطوير) ───
if (process.env.NODE_ENV !== 'production') {
  router.get('/dev/run-schedule-test', asyncHandler(async (req, res) => {
    const steps = [];
    const phone = process.env.SHEIKH_TEST_PHONE || '+201234567895';
    const password = process.env.SHEIKH_TEST_PASSWORD || 'teacher123';

    try {
      const loginRes = await sheikhMobileService.login({ phone, password });
      const token = loginRes?.data?.token ?? loginRes?.token;
      if (!token) {
        return res.status(500).json({ success: false, message: 'Login failed (no token)', steps });
      }
      const payload = jwtLib.verify(token);
      const userId = payload?.sub;
      if (!userId) {
        return res.status(500).json({ success: false, message: 'Invalid token (no sub)', steps });
      }
      steps.push({ step: 1, name: 'Login', ok: true, detail: 'Token received' });

      const profile = await sheikhMobileService.getProfile(userId);
      const teacherId = profile?.teacherId ?? profile?.id;
      if (!teacherId) {
        return res.status(500).json({ success: false, message: 'Profile missing teacherId', steps });
      }
      steps.push({ step: 2, name: 'Profile', ok: true, teacherId });

      const list = await sheikhMobileService.getMySchedules(userId);
      const total = list?.total ?? (list?.schedules?.length ?? 0);
      steps.push({ step: 3, name: 'GET Schedules', ok: true, total });

      let scheduleId;
      for (const trySlot of [
        { dayOfWeek: 6, startTime: '02:00', endTime: '03:00' },
        { dayOfWeek: 0, startTime: '01:00', endTime: '02:00' },
        { dayOfWeek: 3, startTime: '22:00', endTime: '23:00' },
      ]) {
        try {
          const postRes = await sheikhMobileService.addMySchedules(userId, trySlot);
          const created = postRes?.schedules?.[0] ?? postRes?.schedule;
          scheduleId = created?.id;
          if (scheduleId) break;
        } catch (e) {
          if (e.statusCode !== 409) throw e;
        }
      }
      if (!scheduleId) {
        return res.status(500).json({ success: false, message: 'POST schedule failed (overlap or no id)', steps });
      }
      steps.push({ step: 4, name: 'POST Schedule', ok: true, scheduleId });

      await sheikhMobileService.updateMySchedule(userId, scheduleId, { dayOfWeek: 0, startTime: '02:00', endTime: '03:00' });
      steps.push({ step: 5, name: 'PUT Schedule', ok: true });

      await sheikhMobileService.deleteMySchedule(userId, scheduleId);
      steps.push({ step: 6, name: 'DELETE Schedule', ok: true });

      return res.json({ success: true, message: 'جميع الخطوات نجحت', steps });
    } catch (err) {
      steps.push({ step: steps.length + 1, name: 'Error', ok: false, error: err.message });
      return res.status(500).json({ success: false, message: err.message, steps });
    }
  }));
}

// ─── Wallet ───────────────────────────────────────────────────────────────────
router.get('/wallet', sheikhAuth, asyncHandler(async (req, res) => {
  const data = await sheikhMobileService.getWallet(req.user.id);
  res.json(data);
}));

router.post('/wallet/withdraw', sheikhAuth, asyncHandler(async (req, res) => {
  const result = await sheikhMobileService.requestWithdraw(req.user.id, req.body.amount);
  res.status(201).json(result);
}));

module.exports = router;
