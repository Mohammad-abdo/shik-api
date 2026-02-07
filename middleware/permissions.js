const { prisma } = require('../lib/prisma');

const PERMISSIONS_KEY = 'permissions';

function permissions(requiredPermissions) {
  if (!Array.isArray(requiredPermissions)) {
    requiredPermissions = [requiredPermissions];
  }
  return async function (req, res, next) {
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return next();
    }
    const user = req.user;
    if (!user) {
      const err = new Error('User not authenticated');
      err.statusCode = 403;
      return next(err);
    }
    if (user.role === 'ADMIN' || user.role === 'SUPER_ADMIN') {
      return next();
    }
    const userRoles = await prisma.userRole.findMany({
      where: { userId: user.id },
      include: {
        role: {
          include: {
            permissions: {
              include: {
                permission: true,
              },
            },
          },
        },
      },
    });
    const userPermissions = new Set();
    userRoles.forEach((userRole) => {
      (userRole.role.permissions || []).forEach((rp) => {
        if (rp.permission && rp.permission.name) {
          userPermissions.add(rp.permission.name);
        }
      });
    });
    const hasPermission = requiredPermissions.some((p) => userPermissions.has(p));
    if (!hasPermission) {
      const err = new Error('Insufficient permissions');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}

module.exports = permissions;
