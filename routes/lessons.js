const express = require('express');
const router = express.Router();
const lessonService = require('../services/lessonService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.get('/:lessonId/play', jwtAuth, async (req, res, next) => {
  try {
    const result = await lessonService.getLessonPlayAccess(req.params.lessonId, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
