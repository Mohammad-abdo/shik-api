const express = require('express');
const router = express.Router();
const { jwtAuth } = require('../middleware/jwtAuth');

router.use(jwtAuth);

/**
 * @openapi
 * /api/user/:
 *   get:
 *     tags: [users]
 *     summary: GET /api/user/
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
router.get('/', (req, res) => {
  const user = req.user;
  const data = {
    user: {
      id: user.id,
      user_type: user.role === 'TEACHER' ? 'sheikh' : 'student',
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
      email: user.email,
      age: user.age,
      gender: user.gender ? user.gender.toLowerCase() : null,
      memorized_parts: user.memorized_parts,
      student_phone: user.student_phone,
      parent_phone: user.parent_phone,
      profile_image_url: user.avatar,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    },
  };
  res.json({ success: true, message: 'تم جلب البيانات بنجاح', data });
});

module.exports = router;
