/**
 * Only SUPER_ADMIN can proceed. Use for RBAC management and creating users with roles.
 */
function requireSuperAdmin(req, res, next) {
  if (!req.user) {
    const err = new Error('User not authenticated');
    err.statusCode = 401;
    return next(err);
  }
  if (req.user.role !== 'SUPER_ADMIN') {
    const err = new Error('Forbidden: Super Admin only');
    err.statusCode = 403;
    return next(err);
  }
  next();
}

module.exports = { requireSuperAdmin };
