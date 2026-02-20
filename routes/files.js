const express = require('express');
const router = express.Router();
const multer = require('multer');
const fileUploadService = require('../services/fileUploadService');
const { jwtAuth } = require('../middleware/jwtAuth');

const IMAGE_LIMIT = 15 * 1024 * 1024;
const VIDEO_LIMIT = 150 * 1024 * 1024;
const DEFAULT_LIMIT = 15 * 1024 * 1024;

const uploadDefault = multer({ storage: multer.memoryStorage(), limits: { fileSize: DEFAULT_LIMIT } });
const uploadImage = multer({ storage: multer.memoryStorage(), limits: { fileSize: IMAGE_LIMIT } });
const uploadVideo = multer({ storage: multer.memoryStorage(), limits: { fileSize: VIDEO_LIMIT } });

router.use(jwtAuth);

/**
 * @openapi
 * /api/files/upload:
 *   post:
 *     tags: [files]
 *     summary: POST /api/files/upload
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/upload', uploadDefault.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file);
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/files/upload/avatar:
 *   post:
 *     tags: [files]
 *     summary: POST /api/files/upload/avatar
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/upload/avatar', uploadImage.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file, 'avatars');
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/files/upload/video:
 *   post:
 *     tags: [files]
 *     summary: POST /api/files/upload/video
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/upload/video', uploadVideo.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file, 'videos', true);
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/files/upload/image:
 *   post:
 *     tags: [files]
 *     summary: POST /api/files/upload/image
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             additionalProperties: true
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiSuccess"
 *       400:
 *         description: Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/components/schemas/ApiError"
 */
router.post('/upload/image', uploadImage.single('file'), (req, res, next) => {
  try {
    if (!req.file) {
      const err = new Error('No file provided. Use form field name "file".');
      err.statusCode = 400;
      return next(err);
    }
    const url = fileUploadService.uploadFile(req.file, 'images');
    res.status(201).json({ url });
  } catch (e) {
    next(e);
  }
});

module.exports = router;
