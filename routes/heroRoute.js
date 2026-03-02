const express = require('express');
const router = express.Router();
const multer = require('multer');
const upload = multer({ storage: multer.memoryStorage() });
const heroService = require('../services/heroService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.get('/slides', async (req, res, next) => {
  try {
    const result = await heroService.getActiveSlides();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/slides/all', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.getAllSlides();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.get('/slides/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.getSlideById(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/slides', jwtAuth, upload.single('image'), async (req, res, next) => {
  try {
    const result = await heroService.createSlide(req.body, req.file);
    res.status(201).json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/slides/:id', jwtAuth, upload.single('image'), async (req, res, next) => {
  try {
    const result = await heroService.updateSlide(req.params.id, req.body, req.file);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.delete('/slides/:id', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.deleteSlide(req.params.id);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.post('/slides/reorder', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.reorderSlides(req.body.slides);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

router.patch('/slides/:id/toggle', jwtAuth, async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const result = await heroService.toggleSlideActive(req.params.id, isActive);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Initialize default slider 
router.post('/initialize', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.initializeDefault();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;