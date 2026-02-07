const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const fileUploadService = require('../services/fileUploadService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { jwtAuth } = require('../middleware/jwtAuth');

// Web auth
router.post('/signup', async (req, res, next) => {
  try {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const result = req.body.user_type
      ? await authService.mobileLogin(req.body)
      : await authService.login(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/verify-email', async (req, res, next) => {
  try {
    const result = await authService.verifyEmailOtp(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/verify-phone', async (req, res, next) => {
  try {
    const result = await authService.verifyPhoneOtp(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/refresh', async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/login-multi', async (req, res, next) => {
  try {
    const result = await authService.loginMulti(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/send-login-otp', async (req, res, next) => {
  try {
    const { method, identifier } = req.body;
    const result = await authService.sendLoginOtp(method, identifier);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = await authService.forgotPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const result = await authService.resetPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/resend-otp', async (req, res, next) => {
  try {
    const { email, phone } = req.body;
    if (email) {
      await authService.sendLoginOtp('email', email);
      return res.json({ message: 'OTP resent to email' });
    }
    if (phone) {
      await authService.sendLoginOtp('phone', phone);
      return res.json({ message: 'OTP resent to phone' });
    }
    const err = new Error('Email or phone is required');
    err.statusCode = 400;
    next(err);
  } catch (e) {
    next(e);
  }
});

router.get('/me', jwtAuth, (req, res) => {
  res.json(req.user);
});

// Mobile auth - POST /auth/register (same prefix)
router.post('/register', upload.single('profile_image'), async (req, res, next) => {
  try {
    let profileImageUrl;
    if (req.file) {
      try {
        profileImageUrl = fileUploadService.uploadFile(req.file, 'profiles');
      } catch (_) {
        profileImageUrl = undefined;
      }
    }
    const result = await authService.mobileSignUp(req.body, profileImageUrl);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = req.body.student_phone ? await authService.mobileForgotPassword(req.body) : await authService.forgotPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/reset-password', async (req, res, next) => {
  try {
    const result = req.body.password_confirmation ? await authService.mobileResetPassword(req.body) : await authService.resetPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
