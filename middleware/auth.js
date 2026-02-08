/**
 * Authentication middleware for API routes
 */
const { jwtAuth, optionalJwtAuth } = require('./jwtAuth');

/**
 * Standard JWT authentication - required for protected routes
 * Alias for jwtAuth for compatibility
 */
const authenticateToken = jwtAuth;

/**
 * Optional JWT authentication - for routes that work with or without auth
 */
const authenticateOptional = optionalJwtAuth;

/**
 * Admin role check middleware
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }
  
  if (req.user.role !== 'ADMIN') {
    const err = new Error('Admin access required');
    err.statusCode = 403;
    return next(err);
  }
  
  next();
};

/**
 * Teacher role check middleware
 */
const requireTeacher = (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }
  
  if (!['TEACHER', 'ADMIN'].includes(req.user.role)) {
    const err = new Error('Teacher access required');
    err.statusCode = 403;
    return next(err);
  }
  
  next();
};

/**
 * Student role check middleware
 */
const requireStudent = (req, res, next) => {
  if (!req.user) {
    const err = new Error('Authentication required');
    err.statusCode = 401;
    return next(err);
  }
  
  if (!['STUDENT', 'ADMIN'].includes(req.user.role)) {
    const err = new Error('Student access required');
    err.statusCode = 403;
    return next(err);
  }
  
  next();
};

module.exports = {
  authenticateToken,
  authenticateOptional,
  requireAdmin,
  requireTeacher,
  requireStudent,
  // Aliases for backward compatibility
  jwtAuth: authenticateToken,
  optionalJwtAuth: authenticateOptional
};