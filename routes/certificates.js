const express = require('express');
const router = express.Router();
const certificateService = require('../services/certificateService');
const { jwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/certificates/:
 *   post:
 *     tags: [certificates]
 *     summary: POST /api/certificates/
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
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
router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const cert = await certificateService.createCertificate(req.body, req.user.id);
    res.status(201).json(cert);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/certificates/student/{studentId}:
 *   get:
 *     tags: [certificates]
 *     summary: GET /api/certificates/student/{studentId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: studentId
 *         required: true
 *         schema:
 *           type: string
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
router.get('/student/:studentId', jwtAuth, async (req, res, next) => {
  try {
    const certs = await certificateService.getStudentCertificates(req.params.studentId);
    res.json(certs);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/certificates/teacher/my-certificates:
 *   get:
 *     tags: [certificates]
 *     summary: GET /api/certificates/teacher/my-certificates
 *     security:
 *       - bearerAuth: []
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
router.get('/teacher/my-certificates', jwtAuth, async (req, res, next) => {
  try {
    const certs = await certificateService.getTeacherMyCertificates(req.user.id);
    res.json(certs);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/certificates/{id}/revoke:
 *   delete:
 *     tags: [certificates]
 *     summary: DELETE /api/certificates/{id}/revoke
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
router.delete('/:id/revoke', jwtAuth, async (req, res, next) => {
  try {
    const cert = await certificateService.revoke(req.params.id, req.user.id);
    res.json(cert);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
