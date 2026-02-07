const express = require('express');
const router = express.Router();
const rbacService = require('../services/rbacService');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');

router.post('/roles', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const role = await rbacService.createRole(req.body);
    res.status(201).json(role);
  } catch (e) {
    next(e);
  }
});

router.get('/roles', jwtAuth, async (req, res, next) => {
  try {
    const roles = await rbacService.getAllRoles();
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

router.get('/roles/:id', jwtAuth, async (req, res, next) => {
  try {
    const role = await rbacService.getRoleById(req.params.id);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.post('/roles/assign', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.assignRoleToUser(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:userId/roles/:roleId', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.removeRoleFromUser(req.params.userId, req.params.roleId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/roles', jwtAuth, async (req, res, next) => {
  try {
    const roles = await rbacService.getUserRoles(req.params.userId);
    res.json(roles);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:userId/permissions', jwtAuth, async (req, res, next) => {
  try {
    const perms = await rbacService.getUserPermissions(req.params.userId);
    res.json(perms);
  } catch (e) {
    next(e);
  }
});

router.post('/permissions', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const permission = await rbacService.createPermission(req.body);
    res.status(201).json(permission);
  } catch (e) {
    next(e);
  }
});

router.get('/permissions', jwtAuth, async (req, res, next) => {
  try {
    const perms = await rbacService.getAllPermissions();
    res.json(perms);
  } catch (e) {
    next(e);
  }
});

router.post('/permissions/assign', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.assignPermissionToRole(req.body);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/roles/:roleId/permissions/:permissionId', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.removePermissionFromRole(req.params.roleId, req.params.permissionId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/roles/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const role = await rbacService.updateRole(req.params.id, req.body);
    res.json(role);
  } catch (e) {
    next(e);
  }
});

router.delete('/roles/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.deleteRole(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/permissions/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const permission = await rbacService.updatePermission(req.params.id, req.body);
    res.json(permission);
  } catch (e) {
    next(e);
  }
});

router.delete('/permissions/:id', jwtAuth, permissions(['rbac.write']), async (req, res, next) => {
  try {
    const result = await rbacService.deletePermission(req.params.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
