const express = require('express');
const router = express.Router();
const certificateService = require('../services/certificateService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.post('/', jwtAuth, async (req, res, next) => {
  try {
    const cert = await certificateService.createCertificate(req.body, req.user.id);
    res.status(201).json(cert);
  } catch (e) {
    next(e);
  }
});

router.get('/student/:studentId', jwtAuth, async (req, res, next) => {
  try {
    const certs = await certificateService.getStudentCertificates(req.params.studentId);
    res.json(certs);
  } catch (e) {
    next(e);
  }
});

router.get('/teacher/my-certificates', jwtAuth, async (req, res, next) => {
  try {
    const certs = await certificateService.getTeacherMyCertificates(req.user.id);
    res.json(certs);
  } catch (e) {
    next(e);
  }
});

router.delete('/:id/revoke', jwtAuth, async (req, res, next) => {
  try {
    const cert = await certificateService.revoke(req.params.id, req.user.id);
    res.json(cert);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
