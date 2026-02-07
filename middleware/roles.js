function roles(...requiredRoles) {
  return function (req, res, next) {
    if (!requiredRoles || requiredRoles.length === 0) {
      return next();
    }
    const user = req.user;
    if (!user) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      return next(err);
    }
    const hasRole = requiredRoles.some((role) => user.role === role);
    if (!hasRole) {
      const err = new Error('Forbidden - insufficient role');
      err.statusCode = 403;
      return next(err);
    }
    next();
  };
}

module.exports = roles;
