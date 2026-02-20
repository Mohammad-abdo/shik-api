const express = require('express');
const router = express.Router();
const userService = require('../services/userService');
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

/**
 * @openapi
 * /api/users/me:
 *   get:
 *     tags: [users]
 *     summary: Get my profile
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Profile
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
router.get('/me', async (req, res, next) => {
  try {
    const profile = await userService.getProfile(req.user.id);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/users/me:
 *   put:
 *     tags: [users]
 *     summary: Update my profile
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
 *         description: Updated
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
router.put('/me', async (req, res, next) => {
  try {
    const profile = await userService.updateProfile(req.user.id, req.body);
    res.json(profile);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/users/me/password:
 *   put:
 *     tags: [users]
 *     summary: Update my password
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
 *         description: Updated
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
router.put('/me/password', async (req, res, next) => {
  try {
    const result = await userService.updatePassword(req.user.id, req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/users/me:
 *   delete:
 *     tags: [users]
 *     summary: Delete my account
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Deleted
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
router.delete('/me', async (req, res, next) => {
  try {
    const result = await userService.deleteAccount(req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
