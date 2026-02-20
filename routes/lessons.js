const express = require('express');
const router = express.Router();
const lessonService = require('../services/lessonService');
const { jwtAuth } = require('../middleware/jwtAuth');

/**
 * @openapi
 * /api/lessons/{lessonId}/play:
 *   get:
 *     tags: [lessons]
 *     summary: GET /api/lessons/{lessonId}/play
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: lessonId
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
router.get('/:lessonId/play', jwtAuth, async (req, res, next) => {
  try {
    const result = await lessonService.getLessonPlayAccess(req.params.lessonId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
