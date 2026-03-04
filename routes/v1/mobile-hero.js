const  express = require("express");
const router = express.Router();
const heroService = require('../../services/heroService');
const { jwtAuth } = require('../../middleware/jwtAuth');
/**
 * @route POST /api/v1/baners
 * @desc get All banaers
 * @access Private (Student)
 * @body { sheikId?: string }
 */
/**
 * @openapi
 * /api/v1/baners:
 *   post:
 *     tags: [Baners]
 *     summary: Get All Mobile Baners (البنرات )
 *     description: جاب  كامل  البنارارت
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
router.get('/slides/all', jwtAuth, async (req, res, next) => {
    try {
      const result = await heroService.getActiveSlides();
      res.json(result);
    } catch (error) {
      next(error);
    }
  });

  module.exports=router