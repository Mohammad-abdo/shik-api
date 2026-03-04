const express = require("express");
const router = express.Router();
const heroService = require('../../services/heroService');
const { jwtAuth } = require('../../middleware/jwtAuth');

/**
 * @openapi
 * /api/v1/baners/slides/all:
 *   get:
 *     tags: [Baners]
 *     summary: Get All Mobile Banners (البنرات)
 *     description: جلب كل البنرات النشطة
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success: { type: boolean, example: true }
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id: { type: string }
 *                       image: { type: string }
 *                       title: { type: string }
 *                       titleAr: { type: string }
 *                       description: { type: string }
 *                       descriptionAr: { type: string }
 *                       buttonText: { type: string, nullable: true }
 *                       buttonLink: { type: string, nullable: true }
 *                       order: { type: integer }
 *                       isActive: { type: boolean }
 *       401:
 *         description: Unauthorized
 */
router.get('/slides/all', jwtAuth, async (req, res, next) => {
  try {
    const result = await heroService.getActiveSlides();
    res.json(result);
  } catch (error) {
    next(error);
  }
});

module.exports = router;