const { prisma } = require('../lib/prisma');

async function createRole(dto) {
  return prisma.role.create({ data: { name: dto.name, description: dto.description } });
}

async function getAllRoles() {
  return prisma.role.findMany({
    include: { permissions: { include: { permission: true } }, _count: { select: { userRoles: true } } },
  });
}

async function getRoleById(id) {
  const role = await prisma.role.findUnique({
    where: { id },
    include: { permissions: { include: { permission: true } }, userRoles: { include: { user: { select: { id: true, email: true, firstName: true, lastName: true } } } } },
  });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return role;
}

async function assignRoleToUser(dto) {
  const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  const user = await prisma.user.findUnique({ where: { id: dto.userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return prisma.userRole.upsert({
    where: { userId_roleId: { userId: dto.userId, roleId: dto.roleId } },
    create: { userId: dto.userId, roleId: dto.roleId },
    update: {},
  });
}

async function removeRoleFromUser(userId, roleId) {
  await prisma.userRole.deleteMany({ where: { userId, roleId } });
  return { message: 'Role removed from user successfully' };
}

async function getUserRoles(userId) {
  return prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
}

async function getUserPermissions(userId) {
  const userRoles = await prisma.userRole.findMany({
    where: { userId },
    include: { role: { include: { permissions: { include: { permission: true } } } } },
  });
  const permissions = new Set();
  userRoles.forEach((ur) => {
    (ur.role.permissions || []).forEach((rp) => {
      if (rp.permission) permissions.add(rp.permission.name);
    });
  });
  return Array.from(permissions);
}

async function createPermission(dto) {
  return prisma.permission.create({
    data: { name: dto.name, description: dto.description, resource: dto.resource, action: dto.action },
  });
}

async function getAllPermissions() {
  return prisma.permission.findMany({ include: { roles: { include: { role: true } } } });
}

async function assignPermissionToRole(dto) {
  const role = await prisma.role.findUnique({ where: { id: dto.roleId } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  const permission = await prisma.permission.findUnique({ where: { id: dto.permissionId } });
  if (!permission) throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
  return prisma.rolePermission.upsert({
    where: { roleId_permissionId: { roleId: dto.roleId, permissionId: dto.permissionId } },
    create: { roleId: dto.roleId, permissionId: dto.permissionId },
    update: {},
  });
}

async function removePermissionFromRole(roleId, permissionId) {
  await prisma.rolePermission.deleteMany({ where: { roleId, permissionId } });
  return { message: 'Permission removed from role' };
}

async function updateRole(id, dto) {
  const role = await prisma.role.findUnique({ where: { id } });
  if (!role) throw Object.assign(new Error('Role not found'), { statusCode: 404 });
  return prisma.role.update({ where: { id }, data: { name: dto.name, description: dto.description } });
}

async function deleteRole(id) {
  await prisma.role.delete({ where: { id } });
  return { message: 'Role deleted' };
}

async function updatePermission(id, dto) {
  const permission = await prisma.permission.findUnique({ where: { id } });
  if (!permission) throw Object.assign(new Error('Permission not found'), { statusCode: 404 });
  return prisma.permission.update({
    where: { id },
    data: { name: dto.name, description: dto.description, resource: dto.resource, action: dto.action },
  });
}

async function deletePermission(id) {
  await prisma.permission.delete({ where: { id } });
  return { message: 'Permission deleted' };
}

module.exports = {
  createRole,
  getAllRoles,
  getRoleById,
  assignRoleToUser,
  removeRoleFromUser,
  getUserRoles,
  getUserPermissions,
  createPermission,
  getAllPermissions,
  assignPermissionToRole,
  removePermissionFromRole,
  updateRole,
  deleteRole,
  updatePermission,
  deletePermission,
};
