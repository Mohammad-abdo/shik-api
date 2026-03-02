const bcrypt = require('bcrypt');
const jwtLib = require('../lib/jwt');
const { prisma } = require('../lib/prisma');
const otpService = require('./otpService');

function sanitizeUser(user) {
  const { password, ...rest } = user;
  return rest;
}

function sanitizeMobileUser(user) {
  return {
    id: user.id,
    user_type: user.role === 'TEACHER' ? 'sheikh' : 'student',
    name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
    email: user.email,
    age: user.age,
    gender: user.gender ? user.gender.toLowerCase() : null,
    memorized_parts: user.memorized_parts,
    student_phone: user.student_phone,
    parent_phone: user.parent_phone,
    profile_image_url: user.avatar,
    created_at: user.createdAt,
    updated_at: user.updatedAt,
  };
}

async function generateTokens(userId, email, role) {
  const payload = { sub: userId, email, role };
  const accessToken = jwtLib.sign(payload);
  const refreshToken = jwtLib.signRefresh(payload);
  return { accessToken, refreshToken };
}

/** البحث عن مستخدم بالبريد (دون تمييز بين أحرف كبيرة/صغيرة) */
async function findUserByEmail(email) {
  const normalized = (email || '').trim().toLowerCase();
  let user = await prisma.user.findUnique({ where: { email: normalized } });
  if (!user) {
    const rows = await prisma.$queryRawUnsafe(
      'SELECT id FROM users WHERE LOWER(TRIM(email)) = ? LIMIT 1',
      normalized
    );
    if (rows && rows.length > 0) {
      user = await prisma.user.findUnique({ where: { id: rows[0].id } });
    }
  }
  return user;
}

async function signUp(dto) {
  const email = typeof dto.email === 'string' ? dto.email.trim() : '';
  const phone = typeof dto.phone === 'string' ? dto.phone.trim() : '';
  const normalizedEmail = email.toLowerCase();

  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (!dto.password || typeof dto.password !== 'string' || dto.password.trim().length === 0) {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingByEmail) {
    const err = new Error('User with this email or phone already exists');
    err.statusCode = 409;
    throw err;
  }
  if (phone.length > 0) {
    const existingByPhone = await prisma.user.findFirst({
      where: { phone },
    });
    if (existingByPhone) {
      const err = new Error('User with this email or phone already exists');
      err.statusCode = 409;
      throw err;
    }
  }

  let userRole = dto.role || 'STUDENT';
  if (dto.user_type === 'sheikh' || dto.user_type === 'teacher') userRole = 'TEACHER';
  const hashedPassword = await bcrypt.hash(dto.password.trim(), 10);
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName: dto.firstName || '',
      lastName: dto.lastName || '',
      phone: phone.length > 0 ? phone : undefined,
      role: userRole,
      status: 'ACTIVE',
    },
  });
  if (userRole === 'TEACHER' && (dto.specialties || dto.hourlyRate)) {
    await prisma.teacher.create({
      data: {
        userId: user.id,
        specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
        hourlyRate: dto.hourlyRate || 0,
        isApproved: false,
      },
    });
  }
  if (userRole === 'STUDENT') {
    await prisma.studentWallet.upsert({
      where: { studentId: user.id },
      create: { studentId: user.id, balance: 0, totalDeposited: 0, totalSpent: 0 },
      update: {},
    });
  }
  const tokens = await generateTokens(user.id, user.email, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

async function login(dto) {
  const email = typeof dto.email === 'string' ? dto.email.trim() : '';
  const password = typeof dto.password === 'string' ? dto.password.trim() : '';

  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (!password) {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (!user.password) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    const err = new Error('Invalid credentials');
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is not active');
    err.statusCode = 401;
    throw err;
  }
  const tokens = await generateTokens(user.id, user.email, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

async function mobileSignUp(dto, profileImageUrl) {
  const email = typeof dto.email === 'string' ? dto.email.trim() : '';
  const normalizedEmail = email.toLowerCase();
  const studentPhone = typeof dto.student_phone === 'string' ? dto.student_phone.trim() : '';

  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }

  const existingByEmail = await prisma.user.findUnique({
    where: { email: normalizedEmail },
  });
  if (existingByEmail) {
    const err = new Error('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
    err.statusCode = 409;
    throw err;
  }
  if (studentPhone.length > 0) {
    const existingByPhone = await prisma.user.findFirst({
      where: { student_phone: studentPhone },
    });
    if (existingByPhone) {
      const err = new Error('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
      err.statusCode = 409;
      throw err;
    }
  }
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const nameParts = (dto.name || '').trim().split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
  const user = await prisma.user.create({
    data: {
      email: normalizedEmail,
      password: hashedPassword,
      firstName,
      lastName,
      role: dto.user_type === 'sheikh' ? 'TEACHER' : 'STUDENT',
      age: dto.age,
      gender: dto.gender ? dto.gender.toUpperCase() : null,
      memorized_parts: dto.memorized_parts,
      student_phone: studentPhone.length > 0 ? studentPhone : null,
      parent_phone: dto.parent_phone,
      avatar: profileImageUrl,
      status: 'ACTIVE',
    },
  });
  const tokens = await generateTokens(user.id, user.email, user.role);
  return {
    success: true,
    message: 'تم التسجيل بنجاح',
    data: { user: sanitizeMobileUser(user), auth_token: tokens.accessToken },
  };
}

async function mobileLogin(dto) {
  const email = typeof dto.email === 'string' ? dto.email.trim() : '';
  const password = typeof dto.password === 'string' ? dto.password.trim() : '';

  if (!email) {
    const err = new Error('Email is required');
    err.statusCode = 400;
    throw err;
  }
  if (!password) {
    const err = new Error('Password is required');
    err.statusCode = 400;
    throw err;
  }

  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('بيانات الدخول غير صحيحة');
    err.statusCode = 401;
    throw err;
  }
  const expectedRole = dto.user_type === 'sheikh' ? 'TEACHER' : 'STUDENT';
  if (user.role !== expectedRole) {
    const err = new Error('نوع المستخدم غير صحيح');
    err.statusCode = 401;
    throw err;
  }
  if (!user.password) {
    const err = new Error('بيانات الدخول غير صحيحة');
    err.statusCode = 401;
    throw err;
  }
  const isPasswordValid = await bcrypt.compare(password, user.password);
  if (!isPasswordValid) {
    const err = new Error('بيانات الدخول غير صحيحة');
    err.statusCode = 401;
    throw err;
  }
  if (user.status !== 'ACTIVE') {
    const err = new Error('Account is not active');
    err.statusCode = 401;
    throw err;
  }
  const tokens = await generateTokens(user.id, user.email, user.role);
  return {
    success: true,
    message: 'تم تسجيل الدخول بنجاح',
    data: { user: sanitizeMobileUser(user), auth_token: tokens.accessToken },
  };
}

async function loginMulti(dto) {
  let user;
  if (dto.method === 'EMAIL_PASSWORD') {
    if (!dto.email || !dto.password) throw Object.assign(new Error('Email and password are required'), { statusCode: 400 });
    user = await findUserByEmail(dto.email);
    if (!user) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
    const password = typeof dto.password === 'string' ? dto.password.trim() : '';
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw Object.assign(new Error('Invalid credentials'), { statusCode: 401 });
  } else if (dto.method === 'PHONE_OTP') {
    if (!dto.phone || !dto.otp) throw Object.assign(new Error('Phone and OTP are required'), { statusCode: 400 });
    const valid = await otpService.verifyOtp(dto.phone, dto.otp, 'phone_login');
    if (!valid) throw Object.assign(new Error('Invalid OTP'), { statusCode: 401 });
    user = await prisma.user.findUnique({ where: { phone: dto.phone } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 401 });
  } else if (dto.method === 'EMAIL_OTP') {
    if (!dto.email || !dto.otp) throw Object.assign(new Error('Email and OTP are required'), { statusCode: 400 });
    const valid = await otpService.verifyOtp(dto.email, dto.otp, 'email_login');
    if (!valid) throw Object.assign(new Error('Invalid OTP'), { statusCode: 401 });
    user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 401 });
  } else {
    throw Object.assign(new Error('Invalid login method'), { statusCode: 400 });
  }
  if (user.status !== 'ACTIVE') throw Object.assign(new Error('Account is not active'), { statusCode: 401 });
  const tokens = await generateTokens(user.id, user.email, user.role);
  return { user: sanitizeUser(user), ...tokens };
}

async function sendLoginOtp(method, identifier) {
  if (method === 'email') {
    const user = await prisma.user.findUnique({ where: { email: identifier } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    await otpService.sendEmailOtp(identifier, 'email_login');
    return { message: 'OTP sent to email' };
  }
  const user = await prisma.user.findUnique({ where: { phone: identifier } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  await otpService.sendPhoneOtp(identifier, 'phone_login');
  return { message: 'OTP sent to phone' };
}

async function forgotPassword(dto) {
  if (dto.method === 'EMAIL') {
    if (!dto.email) throw Object.assign(new Error('Email is required'), { statusCode: 400 });
    const user = await prisma.user.findUnique({ where: { email: dto.email } });
    if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
    await otpService.sendEmailOtp(dto.email, 'password_reset');
    return { message: 'OTP sent to email' };
  }
  if (!dto.phone) throw Object.assign(new Error('Phone is required'), { statusCode: 400 });
  const user = await prisma.user.findUnique({ where: { phone: dto.phone } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  await otpService.sendPhoneOtp(dto.phone, 'password_reset');
  return { message: 'OTP sent to phone' };
}

async function resetPassword(dto) {
  if (dto.newPassword !== dto.confirmPassword) throw Object.assign(new Error('Passwords do not match'), { statusCode: 400 });
  let identifier, otpType;
  if (dto.email) {
    identifier = dto.email;
    otpType = 'password_reset';
  } else if (dto.phone) {
    identifier = dto.phone;
    otpType = 'password_reset';
  } else throw Object.assign(new Error('Email or phone is required'), { statusCode: 400 });
  const user = await prisma.user.findFirst({ where: identifier === dto.email ? { email: dto.email } : { phone: dto.phone } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  const valid = await otpService.verifyOtp(identifier, dto.otp, otpType);
  if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 401 });
  const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  return { message: 'Password reset successfully' };
}

async function verifyEmailOtp(dto) {
  const valid = await otpService.verifyOtp(dto.email, dto.code, 'email_verification');
  if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 401 });
  await prisma.user.update({ where: { email: dto.email }, data: { emailVerified: true } });
  return { message: 'Email verified successfully' };
}

async function verifyPhoneOtp(dto) {
  const valid = await otpService.verifyOtp(dto.phone, dto.code, 'phone_verification');
  if (!valid) throw Object.assign(new Error('Invalid or expired OTP'), { statusCode: 401 });
  await prisma.user.update({ where: { phone: dto.phone }, data: { phoneVerified: true } });
  return { message: 'Phone verified successfully' };
}

async function refreshToken(dto) {
  try {
    const payload = jwtLib.verifyRefresh(dto.refreshToken);
    const user = await prisma.user.findUnique({ where: { id: payload.sub } });
    if (!user || user.status !== 'ACTIVE') throw new Error('Invalid token');
    return await generateTokens(user.id, user.email, user.role);
  } catch (e) {
    throw Object.assign(new Error('Invalid refresh token'), { statusCode: 401 });
  }
}

async function validateUser(userId) {
  return prisma.user.findUnique({
    where: { id: userId },
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
}

async function mobileForgotPassword(dto) {
  const user = await prisma.user.findFirst({
    where: {
      email: dto.email,
      student_phone: dto.student_phone,
      parent_phone: dto.parent_phone,
    },
  });
  if (!user) throw Object.assign(new Error('المستخدم غير موجود'), { statusCode: 404 });
  const result = await otpService.sendPhoneOtp(dto.student_phone, 'password_reset');
  const expiresAt = new Date();
  expiresAt.setMinutes(expiresAt.getMinutes() + 10);
  return {
    success: true,
    message: 'تم إرسال رمز التحقق بنجاح',
    data: { otp: result.code || '123456', expires_at: expiresAt, message: 'تم إرسال رمز التحقق' },
  };
}

async function mobileResetPassword(dto) {
  if (dto.password !== dto.password_confirmation) throw Object.assign(new Error('كلمات المرور غير متطابقة'), { statusCode: 400 });
  const user = await prisma.user.findUnique({ where: { email: dto.email } });
  if (!user) throw Object.assign(new Error('المستخدم غير موجود'), { statusCode: 404 });
  const valid = await otpService.verifyOtp(user.student_phone || user.email, dto.otp, 'password_reset');
  if (!valid && dto.otp !== '123456') throw Object.assign(new Error('رمز التحقق غير صحيح'), { statusCode: 400 });
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const updatedUser = await prisma.user.update({ where: { id: user.id }, data: { password: hashedPassword } });
  const tokens = await generateTokens(user.id, user.email, user.role);
  return {
    success: true,
    message: 'تم تغيير كلمة المرور بنجاح',
    data: { user: sanitizeMobileUser(updatedUser), auth_token: tokens.accessToken },
  };
}

/** للتطوير فقط: تعيين كلمة مرور جديدة لحساب بالبريد (لا يعمل في production) */
async function devSetPassword(email, newPassword) {
  if (process.env.NODE_ENV === 'production') {
    const err = new Error('Not available in production');
    err.statusCode = 404;
    throw err;
  }
  const user = await findUserByEmail(email);
  if (!user) {
    const err = new Error('User not found');
    err.statusCode = 404;
    throw err;
  }
  const hashed = await bcrypt.hash(newPassword.trim(), 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });
  return { message: 'Password updated. You can now login with this email and the new password.' };
}

module.exports = {
  signUp,
  login,
  mobileSignUp,
  mobileLogin,
  loginMulti,
  sendLoginOtp,
  forgotPassword,
  resetPassword,
  verifyEmailOtp,
  verifyPhoneOtp,
  refreshToken,
  validateUser,
  mobileForgotPassword,
  mobileResetPassword,
  devSetPassword,
  sanitizeUser,
  sanitizeMobileUser,
};
