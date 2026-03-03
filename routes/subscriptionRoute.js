const express = require('express');
const router = express.Router();
const subscriptionService = require('../services/subscriptionService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/student-subscriptions/packages:
 *   post:
 *     tags: [Student Subscriptions]
 *     summary: Create a new subscription package
 *     description: Create a new package (Admin only)
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - packageType
 *               - period
 *             properties:
 *               name:
 *                 type: string
 *                 example: "Basic Package"
 *               nameAr:
 *                 type: string
 *                 example: "الباقة الأساسية"
 *               description:
 *                 type: string
 *                 example: "Basic subscription package"
 *               descriptionAr:
 *                 type: string
 *                 example: "باقة اشتراك أساسية"
 *               packageType:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *                 example: "monthly"
 *               price:
 *                 type: number
 *                 example: 29.99
 *               period:
 *                 type: integer
 *                 example: 1
 *               sessionsPerMonth:
 *                 type: integer
 *                 example: 10
 *               isActive:
 *                 type: boolean
 *                 default: true
 *               isPopular:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Package created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 packageType:
 *                   type: string
 *                 price:
 *                   type: number
 *                 period:
 *                   type: integer
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.post('/packages', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.createPackage(req.body);
    res.status(201).json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages:
 *   get:
 *     tags: [Student Subscriptions]
 *     summary: Get all subscription packages
 *     description: Retrieve all packages (activeOnly filter for students)
 *     parameters:
 *       - in: query
 *         name: activeOnly
 *         schema:
 *           type: boolean
 *         description: Filter only active packages
 *         example: true
 *     responses:
 *       200:
 *         description: List of packages
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   nameAr:
 *                     type: string
 *                   packageType:
 *                     type: string
 *                   price:
 *                     type: number
 *                   period:
 *                     type: integer
 *                   sessionsPerMonth:
 *                     type: integer
 *                   isActive:
 *                     type: boolean
 *                   isPopular:
 *                     type: boolean
 */
router.get('/packages', async (req, res, next) => {
  try {
    const activeOnly = req.query.activeOnly === 'true';
    const packages = await subscriptionService.getAllPackages(activeOnly);
    res.json(packages);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   get:
 *     tags: [Student Subscriptions]
 *     summary: Get package by ID
 *     description: Retrieve a specific package by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *         example: "123e4567-e89b-12d3-a456-426614174000"
 *     responses:
 *       200:
 *         description: Package details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 nameAr:
 *                   type: string
 *                 description:
 *                   type: string
 *                 packageType:
 *                   type: string
 *                 price:
 *                   type: number
 *                 period:
 *                   type: integer
 *                 sessionsPerMonth:
 *                   type: integer
 *                 isActive:
 *                   type: boolean
 *                 isPopular:
 *                   type: boolean
 *                 _count:
 *                   type: object
 *                   properties:
 *                     subscriptions:
 *                       type: integer
 *       404:
 *         description: Package not found
 */
router.get('/packages/:id', async (req, res, next) => {
  try {
    const pkg = await subscriptionService.getPackageById(req.params.id);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   put:
 *     tags: [Student Subscriptions]
 *     summary: Update a package
 *     description: Update an existing package (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               nameAr:
 *                 type: string
 *               description:
 *                 type: string
 *               descriptionAr:
 *                 type: string
 *               packageType:
 *                 type: string
 *                 enum: [daily, weekly, monthly, yearly]
 *               price:
 *                 type: number
 *               period:
 *                 type: integer
 *               sessionsPerMonth:
 *                 type: integer
 *               isActive:
 *                 type: boolean
 *               isPopular:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Package updated successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Package not found
 */
router.put('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const pkg = await subscriptionService.updatePackage(req.params.id, req.body);
    res.json(pkg);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/packages/{id}:
 *   delete:
 *     tags: [Student Subscriptions]
 *     summary: Delete a package
 *     description: Delete a package (Admin only - cannot delete if has active subscriptions)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Package ID
 *     responses:
 *       200:
 *         description: Package deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: "Package deleted"
 *       400:
 *         description: Cannot delete package with active subscriptions
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 *       404:
 *         description: Package not found
 */
router.delete('/packages/:id', jwtAuth, permissions(['subscriptions.write']), async (req, res, next) => {
  try {
    const result = await subscriptionService.deletePackage(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/subscribe:
 *   post:
 *     tags: [Student Subscriptions]
 *     summary: Subscribe to a package
 *     description: Subscribe the authenticated student to a package
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - packageId
 *             properties:
 *               packageId:
 *                 type: string
 *                 description: ID of the package to subscribe to
 *                 example: "123e4567-e89b-12d3-a456-426614174000"
 *               paymentId:
 *                 type: string
 *                 description: Optional payment reference ID
 *     responses:
 *       201:
 *         description: Subscription created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 teacherId:
 *                   type: string
 *                 packageId:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                   format: date-time
 *                 endDate:
 *                   type: string
 *                   format: date-time
 *                 status:
 *                   type: string
 *                   enum: [ACTIVE, CANCELLED, EXPIRED]
 *                 package:
 *                   type: object
 *       400:
 *         description: Invalid request or package not active
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Package not found
 */
router.post('/subscribe', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.subscribe(req.user.id, req.body);
    res.status(201).json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/my-subscriptions:
 *   get:
 *     tags: [Student Subscriptions]
 *     summary: Get my subscriptions
 *     description: Get all subscriptions for the authenticated student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   packageId:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                   endDate:
 *                     type: string
 *                   status:
 *                     type: string
 *                   package:
 *                     type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/my-subscriptions', jwtAuth, async (req, res, next) => {
  try {
    const subs = await subscriptionService.getMySubscriptions(req.user.id);
    res.json(subs);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/my-active:
 *   get:
 *     tags: [Student Subscriptions]
 *     summary: Get my active subscription
 *     description: Get the currently active subscription for the authenticated student
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Active subscription (or empty object if none)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 packageId:
 *                   type: string
 *                 startDate:
 *                   type: string
 *                 endDate:
 *                   type: string
 *                 status:
 *                   type: string
 *                 package:
 *                   type: object
 *       401:
 *         description: Unauthorized
 */
router.get('/my-active', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.getMyActive(req.user.id);
    res.json(sub || null);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/cancel/{id}:
 *   post:
 *     tags: [Student Subscriptions]
 *     summary: Cancel a subscription
 *     description: Cancel an active subscription (only the owner can cancel)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Subscription ID to cancel
 *     responses:
 *       200:
 *         description: Subscription cancelled successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 status:
 *                   type: string
 *                   example: "CANCELLED"
 *                 cancelledAt:
 *                   type: string
 *                   format: date-time
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Not authorized to cancel this subscription
 *       404:
 *         description: Subscription not found
 */
router.post('/cancel/:id', jwtAuth, async (req, res, next) => {
  try {
    const sub = await subscriptionService.cancel(req.params.id, req.user.id);
    res.json(sub);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/student-subscriptions/admin/all:
 *   get:
 *     tags: [Student Subscriptions]
 *     summary: Get all subscriptions (Admin)
 *     description: Get paginated list of all subscriptions with filters (Admin only)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *         description: Items per page
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [ACTIVE, CANCELLED, EXPIRED]
 *         description: Filter by status
 *     responses:
 *       200:
 *         description: Paginated list of subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 subscriptions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     page:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - Admin only
 */
router.get('/admin/all', jwtAuth, permissions(['subscriptions.read']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await subscriptionService.getAllAdmin(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;