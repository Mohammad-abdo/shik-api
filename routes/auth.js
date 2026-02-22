const express = require('express');
const router = express.Router();
const authService = require('../services/authService');
const fileUploadService = require('../services/fileUploadService');
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const { jwtAuth } = require('../middleware/jwtAuth');

// Web auth
/**
 * @openapi
 * /api/auth/signup:
 *   post:
 *     tags: [auth]
 *     summary: Sign up (web)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/signup', async (req, res, next) => {
  try {
    const result = await authService.signUp(req.body);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [auth]
 *     summary: Login (web or mobile, based on payload)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @openapi
 * /api/auth/verify-email:
 *   post:
 *     tags: [auth]
 *     summary: Verify email OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/verify-email', async (req, res, next) => {
  try {
    const result = await authService.verifyEmailOtp(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/verify-phone:
 *   post:
 *     tags: [auth]
 *     summary: Verify phone OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Verified
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid OTP
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/verify-phone', async (req, res, next) => {
  try {
    const result = await authService.verifyPhoneOtp(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [auth]
 *     summary: Refresh access token
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Tokens refreshed
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Invalid refresh token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/refresh', async (req, res, next) => {
  try {
    const result = await authService.refreshToken(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/login-multi:
 *   post:
 *     tags: [auth]
 *     summary: Login using multi-identifier flow
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Logged in
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Invalid credentials
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/login-multi', async (req, res, next) => {
  try {
    const result = await authService.loginMulti(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/send-login-otp:
 *   post:
 *     tags: [auth]
 *     summary: Send login OTP
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               method:
 *                 type: string
 *                 example: email
 *               identifier:
 *                 type: string
 *                 example: user@example.com
 *             required: [method, identifier]
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: OTP sent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/send-login-otp', async (req, res, next) => {
  try {
    const { method, identifier } = req.body;
    const result = await authService.sendLoginOtp(method, identifier);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/forgot-password:
 *   post:
 *     tags: [auth]
 *     summary: Start password reset (web or mobile)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Reset initiated
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/forgot-password', async (req, res, next) => {
  try {
    const result = req.body.student_phone
      ? await authService.mobileForgotPassword(req.body)
      : await authService.forgotPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/reset-password:
 *   post:
 *     tags: [auth]
 *     summary: Complete password reset (web or mobile)
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Password reset
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Invalid request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.post('/reset-password', async (req, res, next) => {
  try {
    const result = req.body.password_confirmation
      ? await authService.mobileResetPassword(req.body)
      : await authService.resetPassword(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/auth/resend-otp:
 *   post:
 *     tags: [auth]
 *     summary: Resend OTP to email or phone
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               phone:
 *                 type: string
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: OTP resent
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Email or phone required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [auth]
 *     summary: Get current user (JWT required)
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Current user
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
router.get('/me', jwtAuth, (req, res) => {
  res.json(req.user);
});

// Mobile auth - POST /auth/register (same prefix)
/**
 * @openapi
 * /api/auth/register:
 *   post:
 *     tags: [auth]
 *     summary: Register (mobile, multipart)
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       201:
 *         description: Created
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiSuccess'
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ApiError'
 */
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

module.exports = router;
