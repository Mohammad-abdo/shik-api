const jwt = require('jsonwebtoken');
const { prisma } = require('../lib/prisma');

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  console.warn('JWT_SECRET is not set - auth will fail');
}

async function jwtAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      const err = new Error('Unauthorized');
      err.statusCode = 401;
      return next(err);
    }
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
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
    const err = new Error('Invalid or expired token');
    err.statusCode = 401;
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
    const token = authHeader.slice(7);
    const decoded = jwt.verify(token, JWT_SECRET);
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
