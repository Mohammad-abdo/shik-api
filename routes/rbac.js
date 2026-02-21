const express = require('express');
const router = express.Router();
const rbacService = require('../services/rbacService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

/**
 * @openapi
 * /api/rbac/roles:
 *   post:
 *     tags: [rbac]
 *     summary: POST /api/rbac/roles
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
router.post('/roles', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const role = await rbacService.createRole(req.body);
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles:
 *   get:
 *     tags: [rbac]
 *     summary: GET /api/rbac/roles
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
router.get('/roles', jwtAuth, async (req, res, next) => {
  try {
    const roles = await rbacService.getAllRoles();
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles/{id}:
 *   get:
 *     tags: [rbac]
 *     summary: GET /api/rbac/roles/{id}
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
router.get('/roles/:id', jwtAuth, async (req, res, next) => {
  try {
    const role = await rbacService.getRoleById(req.params.id);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles/assign:
 *   post:
 *     tags: [rbac]
 *     summary: POST /api/rbac/roles/assign
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
router.post('/roles/assign', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.assignRoleToUser(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/users/{userId}/roles/{roleId}:
 *   delete:
 *     tags: [rbac]
 *     summary: DELETE /api/rbac/users/{userId}/roles/{roleId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: roleId
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
router.delete('/users/:userId/roles/:roleId', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.removeRoleFromUser(req.params.userId, req.params.roleId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/users/{userId}/roles:
 *   get:
 *     tags: [rbac]
 *     summary: GET /api/rbac/users/{userId}/roles
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
router.get('/users/:userId/roles', jwtAuth, async (req, res, next) => {
  try {
    const roles = await rbacService.getUserRoles(req.params.userId);
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/users/{userId}/permissions:
 *   get:
 *     tags: [rbac]
 *     summary: GET /api/rbac/users/{userId}/permissions
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
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
router.get('/users/:userId/permissions', jwtAuth, async (req, res, next) => {
  try {
    const perms = await rbacService.getUserPermissions(req.params.userId);
    res.json(perms);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/permissions:
 *   post:
 *     tags: [rbac]
 *     summary: POST /api/rbac/permissions
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
router.post('/permissions', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const permission = await rbacService.createPermission(req.body);
    res.status(201).json(permission);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/permissions:
 *   get:
 *     tags: [rbac]
 *     summary: GET /api/rbac/permissions
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
router.get('/permissions', jwtAuth, async (req, res, next) => {
  try {
    const perms = await rbacService.getAllPermissions();
    res.json(perms);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/permissions/assign:
 *   post:
 *     tags: [rbac]
 *     summary: POST /api/rbac/permissions/assign
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
router.post('/permissions/assign', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.assignPermissionToRole(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles/{roleId}/permissions/{permissionId}:
 *   delete:
 *     tags: [rbac]
 *     summary: DELETE /api/rbac/roles/{roleId}/permissions/{permissionId}
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: roleId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: permissionId
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
router.delete('/roles/:roleId/permissions/:permissionId', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles/{id}:
 *   put:
 *     tags: [rbac]
 *     summary: PUT /api/rbac/roles/{id}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
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
router.put('/roles/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const role = await rbacService.updateRole(req.params.id, req.body);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/roles/{id}:
 *   delete:
 *     tags: [rbac]
 *     summary: DELETE /api/rbac/roles/{id}
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
router.delete('/roles/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.deleteRole(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/permissions/{id}:
 *   put:
 *     tags: [rbac]
 *     summary: PUT /api/rbac/permissions/{id}
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             additionalProperties: true
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
router.put('/permissions/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const permission = await rbacService.updatePermission(req.params.id, req.body);
    res.json(permission);
  } catch (e) {
    next(e);
  }
});

/**
 * @openapi
 * /api/rbac/permissions/{id}:
 *   delete:
 *     tags: [rbac]
 *     summary: DELETE /api/rbac/permissions/{id}
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
router.delete('/permissions/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.deletePermission(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
