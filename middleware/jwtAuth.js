const jwtLib = require('../lib/jwt');
const { prisma } = require('../lib/prisma');

async function jwtAuth(req, res, next) {
  try {
    if (req.method === 'OPTIONS') {
      return next();
    }

    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      return next(err);
    }
    const token = authHeader.slice(7).trim();
    if (!token) {
      const err = new Error('Token is required');
      err.statusCode = 401;
      return next(err);
    }
    const decoded = jwtLib.verify(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
        age: true,
        gender: true,
        memorized_parts: true,
        student_phone: true,
        parent_phone: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!user || user.status !== 'ACTIVE') {
      const err = new Error('Invalid token or user inactive');
      err.statusCode = 401;
      return next(err);
    }
    req.user = user;
    next();
  } catch (e) {
    const isExpired = e.name === 'TokenExpiredError';
    const isInvalid = e.name === 'JsonWebTokenError';
    const message =
      e.statusCode === 500
        ? e.message
        : isExpired
          ? 'Token expired'
          : isInvalid
            ? 'Invalid token'
            : 'Invalid or expired token';
    const err = new Error(message);
    err.statusCode = e.statusCode || 401;
    next(err);
  }
}

/** Optional JWT: attach user if token present, otherwise continue without user */
async function optionalJwtAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return next();
    }
    const token = authHeader.slice(7).trim();
    if (!token) return next();
    const decoded = jwtLib.verify(token);
    const user = await prisma.user.findUnique({
      where: { id: decoded.sub },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
      },
    });
    if (user && user.status === 'ACTIVE') {
      req.user = user;
    }
    next();
  } catch (e) {
    next();
  }
}

module.exports = { jwtAuth, optionalJwtAuth };
