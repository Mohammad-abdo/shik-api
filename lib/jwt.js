/**
 * مصدر واحد لإعدادات JWT (إنشاء والتحقق) لتجنب عدم التطابق
 */

const jwt = require('jsonwebtoken');

// في التطوير: إذا لم يُضبط JWT_SECRET نستخدم قيمة افتراضية ثابتة حتى لا يفشل التوكن دائماً
const JWT_SECRET =
  process.env.JWT_SECRET ||
  (process.env.NODE_ENV !== 'production' ? 'shaykhi-dev-secret-change-in-production' : null);

const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || JWT_SECRET;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';
const JWT_REFRESH_EXPIRES_IN = process.env.JWT_REFRESH_EXPIRES_IN || '30d';

if (!JWT_SECRET && process.env.NODE_ENV === 'production') {
  console.error('JWT_SECRET is not set in production - authentication will fail');
}

const signOptions = { algorithm: 'HS256', expiresIn: JWT_EXPIRES_IN };
const refreshSignOptions = { algorithm: 'HS256', expiresIn: JWT_REFRESH_EXPIRES_IN };
const verifyOptions = { algorithms: ['HS256'] };

function getSecret() {
  return JWT_SECRET;
}

function getRefreshSecret() {
  return JWT_REFRESH_SECRET;
}

function sign(payload) {
  if (!JWT_SECRET) {
    const err = new Error('JWT_SECRET is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(payload, JWT_SECRET, signOptions);
}

function signRefresh(payload) {
  if (!JWT_REFRESH_SECRET) {
    const err = new Error('JWT_REFRESH_SECRET is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.sign(payload, JWT_REFRESH_SECRET, refreshSignOptions);
}

function verify(token) {
  if (!JWT_SECRET) {
    const err = new Error('JWT is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.verify(token, JWT_SECRET, verifyOptions);
}

function verifyRefresh(token) {
  if (!JWT_REFRESH_SECRET) {
    const err = new Error('Refresh token is not configured');
    err.statusCode = 500;
    throw err;
  }
  return jwt.verify(token, JWT_REFRESH_SECRET, verifyOptions);
}

module.exports = {
  getSecret,
  getRefreshSecret,
  JWT_EXPIRES_IN,
  JWT_REFRESH_EXPIRES_IN,
  sign,
  signRefresh,
  verify,
  verifyRefresh,
};
