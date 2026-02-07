const bcrypt = require('bcrypt');
const { prisma } = require('../lib/prisma');
const auditService = require('./auditService');
const notificationService = require('./notificationService');
const walletService = require('./walletService');

async function getDashboardStats() {
  const [
    totalUsers,
    totalTeachers,
    pendingTeachers,
    totalBookings,
    completedBookings,
    totalRevenue,
    recentBookings,
    totalCourses,
    publishedCourses,
    totalCourseEnrollments,
    totalTeacherSubscriptions,
    activeTeacherSubscriptions,
    totalStudentSubscriptions,
    activeStudentSubscriptions,
    totalStudentWallets,
    studentWalletsBalance,
    recentCourses,
    recentSubscriptions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.teacher.count({ where: { isApproved: true } }),
    prisma.teacher.count({ where: { isApproved: false } }),
    prisma.booking.count(),
    prisma.booking.count({ where: { status: 'COMPLETED' } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.booking.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    }),
    prisma.course.count(),
    prisma.course.count({ where: { status: 'PUBLISHED' } }),
    prisma.courseEnrollment.count(),
    prisma.teacherSubscription.count(),
    prisma.teacherSubscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
    prisma.studentSubscription.count(),
    prisma.studentSubscription.count({ where: { status: 'ACTIVE', endDate: { gte: new Date() } } }),
    prisma.studentWallet.count(),
    prisma.studentWallet.aggregate({ _sum: { balance: true } }),
    prisma.course.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, firstNameAr: true, lastName: true, lastNameAr: true } } } },
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.teacherSubscription.findMany({
      take: 5,
      orderBy: { createdAt: 'desc' },
      include: {
        teacher: { include: { user: { select: { firstName: true, firstNameAr: true, lastName: true, lastNameAr: true } } } },
        package: true,
      },
    }),
  ]);

  return {
    stats: {
      totalUsers,
      totalTeachers,
      pendingTeachers,
      totalBookings,
      completedBookings,
      totalRevenue: totalRevenue._sum?.amount || 0,
      totalCourses,
      publishedCourses,
      totalCourseEnrollments,
      totalTeacherSubscriptions,
      activeTeacherSubscriptions,
      totalStudentSubscriptions,
      activeStudentSubscriptions,
      totalStudentWallets,
      studentWalletsBalance: studentWalletsBalance._sum?.balance || 0,
    },
    recentBookings,
    recentCourses,
    recentSubscriptions,
  };
}

async function getAllUsersWithFilters(filters = {}) {
  const where = {};
  if (filters.role) where.role = filters.role;
  if (filters.status) where.status = filters.status;
  if (filters.search) {
    where.OR = [
      { firstName: { contains: filters.search } },
      { lastName: { contains: filters.search } },
      { email: { contains: filters.search } },
      { phone: { contains: filters.search } },
    ];
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        firstNameAr: true,
        lastName: true,
        lastNameAr: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        teacherProfile: { select: { id: true, isApproved: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ]);
  return { users, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAllTeachers(page = 1, limit = 20, isApproved) {
  const where = {};
  if (isApproved !== undefined) where.isApproved = isApproved;
  const skip = (page - 1) * limit;
  const [teachers, total] = await Promise.all([
    prisma.teacher.findMany({
      where,
      skip,
      take: limit,
      include: {
        user: { select: { id: true, email: true, phone: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, avatar: true } },
        wallet: { select: { id: true, balance: true } },
        _count: { select: { bookings: true, reviews: true } },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.teacher.count({ where }),
  ]);
  return { teachers, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getPaymentStats() {
  const [totalRevenue, pendingPayments, completedPayments] = await Promise.all([
    prisma.payment.aggregate({ where: { status: 'COMPLETED' }, _sum: { amount: true } }),
    prisma.payment.count({ where: { status: 'PENDING' } }),
    prisma.payment.count({ where: { status: 'COMPLETED' } }),
  ]);
  return {
    totalRevenue: totalRevenue._sum?.amount || 0,
    pendingPayments,
    completedPayments,
  };
}

async function exportBookingsCSV(filters = {}) {
  const result = await getAllBookingsWithFilters({ ...filters, limit: 10000, page: 1 });
  const headers = ['ID', 'Student', 'Teacher', 'Date', 'Time', 'Duration', 'Status', 'Price'];
  const rows = (result.bookings || []).map((b) => [
    b.id,
    `${(b.student?.firstName || '')} ${(b.student?.lastName || '')}`.trim(),
    `${(b.teacher?.user?.firstName || '')} ${(b.teacher?.user?.lastName || '')}`.trim(),
    b.date ? new Date(b.date).toISOString() : '',
    b.startTime || '',
    `${b.duration || 0}h`,
    b.status || '',
    String(b.totalPrice ?? ''),
  ]);
  return [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
}

async function getAllBookingsWithFilters(filters = {}) {
  const where = {};
  if (filters.teacherId) where.teacherId = filters.teacherId;
  if (filters.studentId) where.studentId = filters.studentId;
  if (filters.status) where.status = filters.status;
  if (filters.startDate || filters.endDate) {
    where.createdAt = {};
    if (filters.startDate) where.createdAt.gte = new Date(filters.startDate);
    if (filters.endDate) where.createdAt.lte = new Date(filters.endDate);
  }
  const page = filters.page || 1;
  const limit = filters.limit || 20;
  const skip = (page - 1) * limit;
  const [bookings, total] = await Promise.all([
    prisma.booking.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        payment: true,
        session: true,
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.booking.count({ where }),
  ]);
  return { bookings, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAllPayments(page = 1, limit = 20, status) {
  const where = {};
  if (status) where.status = status;
  const skip = (page - 1) * limit;
  const [payments, total] = await Promise.all([
    prisma.payment.findMany({
      where,
      skip,
      take: limit,
      include: {
        booking: {
          include: {
            student: { select: { id: true, firstName: true, lastName: true, email: true } },
            teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.payment.count({ where }),
  ]);
  return { payments, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function updateUserStatus(userId, status) {
  return prisma.user.update({ where: { id: userId }, data: { status } });
}

async function deleteUser(userId) {
  return prisma.user.delete({ where: { id: userId } });
}

async function banUser(userId, adminId) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'SUSPENDED' } });
  await auditService.log(adminId, 'BAN_USER', 'User', userId, { status: 'SUSPENDED' });
  return { message: 'User banned' };
}

async function activateUser(userId, adminId) {
  await prisma.user.update({ where: { id: userId }, data: { status: 'ACTIVE' } });
  await auditService.log(adminId, 'ACTIVATE_USER', 'User', userId, { status: 'ACTIVE' });
  return { message: 'User activated' };
}

async function forceCancelBooking(bookingId, adminId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CANCELLED', cancelledAt: new Date(), cancelledBy: adminId },
  });
  await auditService.log(adminId, 'FORCE_CANCEL_BOOKING', 'Booking', bookingId, null);
  return updated;
}

async function forceConfirmBooking(bookingId, adminId) {
  const booking = await prisma.booking.findUnique({ where: { id: bookingId } });
  if (!booking) throw Object.assign(new Error('Booking not found'), { statusCode: 404 });
  const updated = await prisma.booking.update({
    where: { id: bookingId },
    data: { status: 'CONFIRMED' },
  });
  await auditService.log(adminId, 'FORCE_CONFIRM_BOOKING', 'Booking', bookingId, null);
  return updated;
}

async function sendGlobalNotification(adminId, title, message) {
  const users = await prisma.user.findMany({ select: { id: true } });
  for (const u of users) {
    await notificationService.createNotification(u.id, 'SESSION_REMINDER', title, message, {}, adminId);
  }
  await auditService.log(adminId, 'SEND_GLOBAL_NOTIFICATION', 'Notification', null, { title, recipients: users.length });
  return { sent: users.length };
}

async function getUserById(userId) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      teacherProfile: { include: { wallet: true } },
      userRoles: { include: { role: { include: { permissions: { include: { permission: true } } } } } },
      _count: { select: { studentBookings: true, notifications: true } },
    },
  });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  return user;
}

async function getTeacherById(teacherId) {
  const teacher = await prisma.teacher.findUnique({
    where: { id: teacherId },
    include: {
      user: { select: { id: true, firstName: true, lastName: true, email: true, phone: true, avatar: true, status: true, createdAt: true } },
      wallet: { include: { transactions: true, payoutRequests: true } },
      schedules: { where: { isActive: true } },
      _count: { select: { bookings: true, reviews: true } },
    },
  });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  return teacher;
}

async function createUser(dto, adminId) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
  });
  if (existingUser) throw Object.assign(new Error('User with this email or phone already exists'), { statusCode: 409 });
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      firstName: dto.firstName,
      firstNameAr: dto.firstNameAr,
      lastName: dto.lastName,
      lastNameAr: dto.lastNameAr,
      role: dto.role,
      status: dto.status || 'ACTIVE',
      emailVerified: true,
      phoneVerified: !!dto.phone,
    },
    include: { userRoles: { include: { role: true } } },
  });
  if (dto.roleIds && dto.roleIds.length > 0) {
    await Promise.all(dto.roleIds.map((roleId) => prisma.userRole.create({ data: { userId: user.id, roleId } })));
  }
  if (user.role === 'STUDENT') {
    await prisma.studentWallet.upsert({
      where: { studentId: user.id },
      create: { studentId: user.id, balance: 0, totalDeposited: 0, totalSpent: 0 },
      update: {},
    });
  }
  await auditService.log(adminId, 'CREATE_USER', 'User', user.id, { email: user.email, role: user.role });
  return user;
}

async function updateUser(userId, dto, adminId) {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw Object.assign(new Error('User not found'), { statusCode: 404 });
  let existingUser;
  if (dto.email || dto.phone) {
    existingUser = await prisma.user.findFirst({
      where: {
        id: { not: userId },
        OR: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });
  }
  if (existingUser) throw Object.assign(new Error('Email or phone already exists'), { statusCode: 409 });
  const updatedUser = await prisma.user.update({
    where: { id: userId },
    data: {
      ...(dto.email && { email: dto.email }),
      ...(dto.firstName && { firstName: dto.firstName }),
      ...(dto.firstNameAr !== undefined && { firstNameAr: dto.firstNameAr }),
      ...(dto.lastName && { lastName: dto.lastName }),
      ...(dto.lastNameAr !== undefined && { lastNameAr: dto.lastNameAr }),
      ...(dto.phone && { phone: dto.phone }),
      ...(dto.role && { role: dto.role }),
      ...(dto.status && { status: dto.status }),
    },
    include: { userRoles: { include: { role: true } } },
  });
  if (dto.roleIds) {
    await prisma.userRole.deleteMany({ where: { userId } });
    if (dto.roleIds.length > 0) {
      await Promise.all(dto.roleIds.map((roleId) => prisma.userRole.create({ data: { userId, roleId } })));
    }
  }
  await auditService.log(adminId, 'UPDATE_USER', 'User', userId, dto);
  return updatedUser;
}

async function createTeacher(dto, adminId) {
  const existingUser = await prisma.user.findFirst({
    where: { OR: [{ email: dto.email }, ...(dto.phone ? [{ phone: dto.phone }] : [])] },
  });
  if (existingUser) throw Object.assign(new Error('User with this email or phone already exists'), { statusCode: 409 });
  const hashedPassword = await bcrypt.hash(dto.password, 10);
  const user = await prisma.user.create({
    data: {
      email: dto.email,
      phone: dto.phone,
      password: hashedPassword,
      firstName: dto.firstName,
      firstNameAr: dto.firstNameAr,
      lastName: dto.lastName,
      lastNameAr: dto.lastNameAr,
      role: 'TEACHER',
      status: 'ACTIVE',
      emailVerified: true,
      phoneVerified: !!dto.phone,
    },
  });
  const teacher = await prisma.teacher.create({
    data: {
      userId: user.id,
      bio: dto.bio,
      bioAr: dto.bioAr,
      image: dto.image,
      experience: dto.experience,
      hourlyRate: dto.hourlyRate || 0,
      specialties: dto.specialties ? (Array.isArray(dto.specialties) ? JSON.stringify(dto.specialties) : dto.specialties) : null,
      specialtiesAr: dto.specialtiesAr ? (Array.isArray(dto.specialtiesAr) ? JSON.stringify(dto.specialtiesAr) : dto.specialtiesAr) : null,
      readingType: dto.readingType,
      readingTypeAr: dto.readingTypeAr,
      introVideoUrl: dto.introVideoUrl,
      certificates: dto.certificates ? (Array.isArray(dto.certificates) ? JSON.stringify(dto.certificates) : dto.certificates) : null,
      canIssueCertificates: dto.canIssueCertificates || false,
      isApproved: dto.isApproved !== undefined ? dto.isApproved : false,
      approvedAt: dto.isApproved ? new Date() : null,
      approvedBy: dto.isApproved ? adminId : null,
    },
    include: { user: { select: { id: true, email: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, phone: true, avatar: true } } },
  });
  await prisma.teacherWallet.create({ data: { teacherId: teacher.id, balance: 0, pendingBalance: 0, totalEarned: 0 } });
  await auditService.log(adminId, 'CREATE_TEACHER', 'Teacher', teacher.id, { email: user.email, isApproved: teacher.isApproved });
  return teacher;
}

async function updateTeacher(teacherId, dto, adminId) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const updateData = {};
  if (dto.bio !== undefined && dto.bio !== '') updateData.bio = dto.bio;
  if (dto.bioAr !== undefined && dto.bioAr !== '') updateData.bioAr = dto.bioAr;
  if (dto.image !== undefined) updateData.image = dto.image;
  if (dto.experience !== undefined) updateData.experience = typeof dto.experience === 'string' ? parseInt(dto.experience, 10) : dto.experience;
  if (dto.hourlyRate !== undefined) updateData.hourlyRate = typeof dto.hourlyRate === 'string' ? parseFloat(dto.hourlyRate) : dto.hourlyRate;
  if (dto.specialties !== undefined) updateData.specialties = Array.isArray(dto.specialties) ? JSON.stringify(dto.specialties) : dto.specialties;
  if (dto.specialtiesAr !== undefined) updateData.specialtiesAr = Array.isArray(dto.specialtiesAr) ? JSON.stringify(dto.specialtiesAr) : dto.specialtiesAr;
  if (dto.readingType !== undefined) updateData.readingType = dto.readingType;
  if (dto.readingTypeAr !== undefined) updateData.readingTypeAr = dto.readingTypeAr;
  if (dto.introVideoUrl !== undefined) updateData.introVideoUrl = dto.introVideoUrl;
  if (dto.certificates !== undefined) updateData.certificates = Array.isArray(dto.certificates) ? JSON.stringify(dto.certificates) : dto.certificates;
  if (dto.canIssueCertificates !== undefined) updateData.canIssueCertificates = Boolean(dto.canIssueCertificates);
  if (dto.isApproved !== undefined) updateData.isApproved = Boolean(dto.isApproved);
  const updated = await prisma.teacher.update({
    where: { id: teacherId },
    data: updateData,
    include: { user: { select: { id: true, firstName: true, lastName: true, email: true, avatar: true } }, wallet: true },
  });
  await auditService.log(adminId, 'UPDATE_TEACHER', 'Teacher', teacherId, updateData);
  return updated;
}

// --- Reports ---
function getPrincipalReport(startDate, endDate) {
  const start = startDate || new Date(new Date().setDate(1));
  const end = endDate || new Date();
  return Promise.all([
    prisma.user.count(),
    prisma.teacher.count(),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.teacher.count({ where: { isApproved: true } }),
    prisma.teacher.count({ where: { isApproved: false } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.booking.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
    prisma.booking.count({ where: { status: 'CANCELLED', createdAt: { gte: start, lte: end } } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.platformRevenue.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.payoutRequest.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.user.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.teacher.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.user.count({ where: { role: 'STUDENT', createdAt: { gte: start, lte: end } } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
  ]).then(([totalUsers, totalTeachers, totalStudents, activeTeachers, pendingTeachers, totalBookings, completedBookings, cancelledBookings, totalRevenue, platformRevenue, teacherPayouts, newUsers, newTeachers, newStudents, newBookings]) => ({
    summary: {
      totalUsers,
      totalTeachers,
      totalStudents,
      activeTeachers,
      pendingTeachers,
      totalBookings,
      completedBookings,
      cancelledBookings,
      totalRevenue: totalRevenue._sum?.amount || 0,
      platformRevenue: platformRevenue._sum?.amount || 0,
      teacherPayouts: teacherPayouts._sum?.amount || 0,
      netProfit: (platformRevenue._sum?.amount || 0) - (teacherPayouts._sum?.amount || 0),
    },
    period: { newUsers, newTeachers, newStudents, newBookings },
    periodRange: { startDate: start, endDate: end },
  }));
}

function getTeacherReport(startDate, endDate, teacherId) {
  const start = startDate || new Date(new Date().setDate(1));
  const end = endDate || new Date();
  const where = { createdAt: { gte: start, lte: end } };
  if (teacherId) where.teacherId = teacherId;
  return Promise.all([
    prisma.teacher.findMany({
      where: teacherId ? { id: teacherId } : {},
      include: {
        user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true } },
        wallet: true,
        _count: { select: { bookings: { where: { createdAt: { gte: start, lte: end } } } } },
      },
      take: 50,
    }),
    prisma.teacher.count(),
    prisma.teacher.count({ where: { isApproved: true } }),
    prisma.booking.count({ where: { ...where, ...(teacherId ? { teacherId } : {}) } }),
    prisma.booking.count({ where: { ...where, status: 'COMPLETED', ...(teacherId ? { teacherId } : {}) } }),
    prisma.walletTransaction.aggregate({
      where: { type: 'CREDIT', createdAt: { gte: start, lte: end }, ...(teacherId ? { wallet: { teacherId } } : {}) },
      _sum: { amount: true },
    }),
    prisma.teacher.findMany({
      where: { isApproved: true },
      include: {
        user: { select: { firstName: true, firstNameAr: true, lastName: true, lastNameAr: true } },
        wallet: true,
        _count: { select: { bookings: true } },
      },
      take: 20,
    }),
  ]).then(([teachers, totalTeachers, activeTeachers, totalBookings, completedBookings, totalEarnings, topTeachers]) => {
    const sortedTop = [...topTeachers].sort((a, b) => (b._count?.bookings || 0) - (a._count?.bookings || 0)).slice(0, 10);
    return {
      summary: {
        totalTeachers,
        activeTeachers,
        totalBookings,
        completedBookings,
        totalEarnings: totalEarnings._sum?.amount || 0,
      },
      teachers,
      topTeachers: sortedTop,
      periodRange: { startDate: start, endDate: end },
    };
  });
}

function getStudentReport(startDate, endDate, studentId) {
  const start = startDate || new Date(new Date().setDate(1));
  const end = endDate || new Date();
  const where = { role: 'STUDENT' };
  const bookingWhere = { createdAt: { gte: start, lte: end } };
  if (studentId) {
    where.id = studentId;
    bookingWhere.studentId = studentId;
  }
  return Promise.all([
    prisma.user.findMany({
      where,
      include: { _count: { select: { studentBookings: { where: bookingWhere } } } },
      take: 50,
    }),
    prisma.user.count({ where: { role: 'STUDENT' } }),
    prisma.user.count({ where: { role: 'STUDENT', status: 'ACTIVE' } }),
    prisma.booking.count({ where: bookingWhere }),
    prisma.booking.count({ where: { ...bookingWhere, status: 'COMPLETED' } }),
    prisma.payment.aggregate({
      where: { status: 'COMPLETED', createdAt: { gte: start, lte: end }, ...(studentId ? { booking: { studentId } } : {}) },
      _sum: { amount: true },
    }),
    prisma.user.findMany({
      where: { role: 'STUDENT' },
      include: { _count: { select: { studentBookings: true } } },
      take: 20,
    }),
  ]).then(([students, totalStudents, activeStudents, totalBookings, completedBookings, totalSpent, topStudents]) => {
    const sortedTop = [...topStudents].sort((a, b) => (b._count?.studentBookings || 0) - (a._count?.studentBookings || 0)).slice(0, 10);
    return {
      summary: {
        totalStudents,
        activeStudents,
        totalBookings,
        completedBookings,
        totalSpent: totalSpent._sum?.amount || 0,
      },
      students,
      topStudents: sortedTop,
      periodRange: { startDate: start, endDate: end },
    };
  });
}

function getProfitReport(startDate, endDate) {
  const start = startDate || new Date(new Date().setDate(1));
  const end = endDate || new Date();
  return Promise.all([
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.platformRevenue.aggregate({ where: { createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.walletTransaction.aggregate({ where: { type: 'CREDIT', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.payoutRequest.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } }, _sum: { amount: true } }),
    prisma.payoutRequest.aggregate({ where: { status: 'PENDING' }, _sum: { amount: true } }),
    prisma.booking.count({ where: { createdAt: { gte: start, lte: end } } }),
    prisma.booking.count({ where: { status: 'COMPLETED', createdAt: { gte: start, lte: end } } }),
    prisma.platformRevenue.findMany({ where: { createdAt: { gte: start, lte: end } }, orderBy: { createdAt: 'asc' } }),
  ]).then(([totalRevenue, platformRevenue, teacherEarnings, teacherPayouts, pendingPayouts, totalBookings, completedBookings, revenueByDate]) => {
    const netProfit = (platformRevenue._sum?.amount || 0) - (teacherPayouts._sum?.amount || 0);
    const profitMargin = (totalRevenue._sum?.amount || 0) > 0
      ? (((platformRevenue._sum?.amount || 0) / totalRevenue._sum.amount) * 100).toFixed(2)
      : '0';
    return {
      summary: {
        totalRevenue: totalRevenue._sum?.amount || 0,
        platformRevenue: platformRevenue._sum?.amount || 0,
        teacherEarnings: teacherEarnings._sum?.amount || 0,
        teacherPayouts: teacherPayouts._sum?.amount || 0,
        pendingPayouts: pendingPayouts._sum?.amount || 0,
        netProfit,
        profitMargin,
        totalBookings,
        completedBookings,
        averageRevenuePerBooking: completedBookings > 0 ? (totalRevenue._sum?.amount || 0) / completedBookings : 0,
      },
      revenueByDate,
      periodRange: { startDate: start, endDate: end },
    };
  });
}

function getDailyReport(date) {
  const d = date ? new Date(date) : new Date();
  const startOfDay = new Date(d); startOfDay.setHours(0, 0, 0, 0);
  const endOfDay = new Date(d); endOfDay.setHours(23, 59, 59, 999);
  return Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.booking.count({ where: { createdAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.booking.count({ where: { status: 'COMPLETED', updatedAt: { gte: startOfDay, lte: endOfDay } } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: startOfDay, lte: endOfDay } }, _sum: { amount: true } }),
    prisma.teacher.count({ where: { isApproved: true, approvedAt: { gte: startOfDay, lte: endOfDay } } }),
  ]).then(([newUsers, newBookings, completedBookings, revenue, newTeachers]) => ({
    date: d.toISOString().split('T')[0],
    newUsers,
    newBookings,
    completedBookings,
    revenue: revenue._sum?.amount || 0,
    newTeachers,
  }));
}

function getMonthlyReport(year, month) {
  const startDate = new Date(year, month - 1, 1);
  const endDate = new Date(year, month, 0, 23, 59, 59, 999);
  return Promise.all([
    prisma.user.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.booking.count({ where: { createdAt: { gte: startDate, lte: endDate } } }),
    prisma.booking.count({ where: { status: 'COMPLETED', updatedAt: { gte: startDate, lte: endDate } } }),
    prisma.payment.aggregate({ where: { status: 'COMPLETED', createdAt: { gte: startDate, lte: endDate } }, _sum: { amount: true } }),
    prisma.teacher.count({ where: { isApproved: true, approvedAt: { gte: startDate, lte: endDate } } }),
  ]).then(([newUsers, newBookings, completedBookings, revenue, newTeachers]) => ({
    year,
    month,
    newUsers,
    newBookings,
    completedBookings,
    revenue: revenue._sum?.amount || 0,
    newTeachers,
  }));
}

async function getBookingTrends(startDate, endDate) {
  const start = startDate ? new Date(startDate) : new Date(new Date().setDate(1));
  const end = endDate ? new Date(endDate) : new Date();
  const bookings = await prisma.booking.findMany({
    where: { createdAt: { gte: start, lte: end } },
    select: { createdAt: true, status: true },
  });
  const trends = {};
  bookings.forEach((b) => {
    const date = b.createdAt.toISOString().split('T')[0];
    if (!trends[date]) trends[date] = { total: 0, completed: 0, cancelled: 0 };
    trends[date].total++;
    if (b.status === 'COMPLETED') trends[date].completed++;
    if (b.status === 'CANCELLED' || b.status === 'REJECTED') trends[date].cancelled++;
  });
  return Object.entries(trends).map(([date, data]) => ({ date, ...data }));
}

// --- Teacher Wallets ---
async function ensureAllWallets() {
  const teachersWithoutWallet = await prisma.teacher.findMany({
    where: { wallet: null },
    select: { id: true },
  });
  const studentsWithoutWallet = await prisma.user.findMany({
    where: { role: 'STUDENT', studentWallet: null },
    select: { id: true },
  });
  let teachersCreated = 0;
  let studentsCreated = 0;
  for (const t of teachersWithoutWallet) {
    await prisma.teacherWallet.upsert({
      where: { teacherId: t.id },
      create: { teacherId: t.id, balance: 0, pendingBalance: 0, totalEarned: 0 },
      update: {},
    });
    teachersCreated++;
  }
  for (const u of studentsWithoutWallet) {
    await prisma.studentWallet.upsert({
      where: { studentId: u.id },
      create: { studentId: u.id, balance: 0, totalDeposited: 0, totalSpent: 0 },
      update: {},
    });
    studentsCreated++;
  }
  return { teachersCreated, studentsCreated };
}

async function getAllTeacherWallets(page = 1, limit = 20, search) {
  const where = {};
  if (search) {
    where.teacher = {
      user: {
        OR: [
          { firstName: { contains: search } },
          { firstNameAr: { contains: search } },
          { lastName: { contains: search } },
          { lastNameAr: { contains: search } },
          { email: { contains: search } },
        ],
      },
    };
  }
  const skip = (page - 1) * limit;
  const [wallets, total] = await Promise.all([
    prisma.teacherWallet.findMany({
      where,
      skip,
      take: limit,
      include: {
        teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true, avatar: true } } } },
        transactions: { take: 5, orderBy: { createdAt: 'desc' } },
        payoutRequests: { where: { status: 'PENDING' }, take: 5 },
      },
      orderBy: { balance: 'desc' },
    }),
    prisma.teacherWallet.count({ where }),
  ]);
  return { wallets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function syncPaymentsToWallets() {
  const completedPayments = await prisma.payment.findMany({
    where: { status: 'COMPLETED' },
    include: { booking: { include: { teacher: true } } },
  });
  let syncedCount = 0;
  let errorCount = 0;
  for (const payment of completedPayments) {
    try {
      const existing = await prisma.walletTransaction.findFirst({ where: { paymentId: payment.id } });
      if (existing) continue;
      if (!payment.booking?.teacher) continue;
      await walletService.creditWallet(payment.booking.teacherId, payment.amount, payment.bookingId, payment.id);
      syncedCount++;
    } catch (err) {
      errorCount++;
    }
  }
  return { synced: syncedCount, errors: errorCount, total: completedPayments.length };
}

async function getTeacherWallet(teacherId) {
  const wallet = await prisma.teacherWallet.findUnique({
    where: { teacherId },
    include: {
      teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true, avatar: true } } } },
      transactions: { orderBy: { createdAt: 'desc' } },
      payoutRequests: { orderBy: { createdAt: 'desc' } },
    },
  });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return wallet;
}

async function sendMoneyToTeacher(teacherId, amount, paymentMethod, description, adminId) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  let wallet = await prisma.teacherWallet.findUnique({ where: { teacherId } });
  if (!wallet) {
    wallet = await prisma.teacherWallet.create({
      data: { teacherId, balance: 0, pendingBalance: 0, totalEarned: 0 },
    });
  }
  const updated = await prisma.teacherWallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: amount }, totalEarned: { increment: amount } },
  });
  await prisma.walletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'CREDIT',
      amount,
      description: description || `Manual transfer via ${paymentMethod || 'admin'} by admin`,
    },
  });
  return updated;
}

async function createWalletForTeacher(teacherId) {
  const teacher = await prisma.teacher.findUnique({ where: { id: teacherId }, include: { user: true } });
  if (!teacher) throw Object.assign(new Error('Teacher not found'), { statusCode: 404 });
  const existing = await prisma.teacherWallet.findUnique({ where: { teacherId } });
  if (existing) throw Object.assign(new Error('Wallet already exists for this teacher'), { statusCode: 400 });
  return prisma.teacherWallet.create({
    data: { teacherId, balance: 0, pendingBalance: 0, totalEarned: 0 },
    include: { teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, avatar: true } } } } },
  });
}

async function disableWallet(teacherId) {
  const wallet = await prisma.teacherWallet.findUnique({ where: { teacherId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return prisma.teacherWallet.update({
    where: { teacherId },
    data: { isActive: false },
    include: { teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true, avatar: true } } } } },
  });
}

async function enableWallet(teacherId) {
  const wallet = await prisma.teacherWallet.findUnique({ where: { teacherId } });
  if (!wallet) throw Object.assign(new Error('Wallet not found'), { statusCode: 404 });
  return prisma.teacherWallet.update({
    where: { teacherId },
    data: { isActive: true },
    include: { teacher: { include: { user: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true, avatar: true } } } } },
  });
}

// --- Student Wallets ---
async function getStudentWallet(studentId) {
  const student = await prisma.user.findUnique({ where: { id: studentId } });
  if (!student || student.role !== 'STUDENT') throw Object.assign(new Error('Student not found'), { statusCode: 404 });
  let wallet = await prisma.studentWallet.findUnique({
    where: { studentId },
    include: {
      student: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true } },
      transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  });
  if (!wallet) {
    wallet = await prisma.studentWallet.create({
      data: { studentId, balance: 0, totalDeposited: 0, totalSpent: 0, isActive: true },
      include: {
        student: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true } },
        transactions: { orderBy: { createdAt: 'desc' }, take: 50 },
      },
    });
  }
  return wallet;
}

async function getAllStudentWallets(page = 1, limit = 20, search) {
  const where = {};
  if (search) {
    where.student = {
      OR: [
        { firstName: { contains: search } },
        { firstNameAr: { contains: search } },
        { lastName: { contains: search } },
        { lastNameAr: { contains: search } },
        { email: { contains: search } },
      ],
    };
  }
  const skip = (page - 1) * limit;
  const [wallets, total] = await Promise.all([
    prisma.studentWallet.findMany({
      where,
      skip,
      take: limit,
      include: {
        student: { select: { id: true, firstName: true, firstNameAr: true, lastName: true, lastNameAr: true, email: true, phone: true } },
        transactions: { take: 5, orderBy: { createdAt: 'desc' } },
      },
    }),
    prisma.studentWallet.count({ where }),
  ]);
  return { wallets, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function depositToStudentWallet(dto, adminId) {
  let wallet = await prisma.studentWallet.findUnique({ where: { studentId: dto.studentId } });
  if (!wallet) {
    wallet = await prisma.studentWallet.create({
      data: { studentId: dto.studentId, balance: 0, totalDeposited: 0, totalSpent: 0, isActive: true },
    });
  }
  const updated = await prisma.studentWallet.update({
    where: { id: wallet.id },
    data: { balance: { increment: dto.amount }, totalDeposited: { increment: dto.amount } },
  });
  await prisma.studentWalletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'DEPOSIT',
      amount: dto.amount,
      description: dto.description || `Deposit via ${dto.paymentMethod || 'manual'} by admin`,
      processedBy: adminId,
    },
  });
  await auditService.log(adminId, 'DEPOSIT_TO_STUDENT_WALLET', 'StudentWallet', wallet.id, { studentId: dto.studentId, amount: dto.amount });
  return updated;
}

async function withdrawFromStudentWallet(dto, adminId) {
  const wallet = await prisma.studentWallet.findUnique({ where: { studentId: dto.studentId } });
  if (!wallet) throw Object.assign(new Error('Student wallet not found'), { statusCode: 404 });
  if (wallet.balance < dto.amount) throw Object.assign(new Error('Insufficient balance'), { statusCode: 400 });
  const updated = await prisma.studentWallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: dto.amount }, totalSpent: { increment: dto.amount } },
  });
  await prisma.studentWalletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'WITHDRAWAL',
      amount: dto.amount,
      description: dto.description || 'Withdrawal by admin',
      processedBy: adminId,
    },
  });
  await auditService.log(adminId, 'WITHDRAW_FROM_STUDENT_WALLET', 'StudentWallet', wallet.id, { studentId: dto.studentId, amount: dto.amount });
  return updated;
}

async function processStudentPayment(dto, adminId) {
  const wallet = await prisma.studentWallet.findUnique({ where: { studentId: dto.studentId } });
  if (!wallet) throw Object.assign(new Error('Student wallet not found'), { statusCode: 404 });
  if (wallet.balance < dto.amount) throw Object.assign(new Error('Insufficient balance'), { statusCode: 400 });
  const updated = await prisma.studentWallet.update({
    where: { id: wallet.id },
    data: { balance: { decrement: dto.amount }, totalSpent: { increment: dto.amount } },
  });
  const transaction = await prisma.studentWalletTransaction.create({
    data: {
      walletId: wallet.id,
      type: 'PAYMENT',
      amount: dto.amount,
      description: dto.description || `Payment for ${dto.paymentType}`,
      subscriptionId: dto.paymentType === 'SUBSCRIPTION' ? dto.relatedId : null,
      bookingId: dto.paymentType === 'BOOKING' ? dto.relatedId : null,
      processedBy: adminId,
    },
  });
  if (dto.paymentType === 'SUBSCRIPTION' && dto.relatedId) {
    await prisma.studentSubscription.updateMany({
      where: { id: dto.relatedId },
      data: { paymentId: transaction.id },
    }).catch(() => {});
  }
  await auditService.log(adminId, 'PROCESS_STUDENT_PAYMENT', 'StudentWallet', wallet.id, { studentId: dto.studentId, amount: dto.amount, paymentType: dto.paymentType, relatedId: dto.relatedId });
  return { wallet: updated, transaction };
}

async function getStudentWalletTransactions(walletId, page = 1, limit = 50) {
  const skip = (page - 1) * limit;
  const [transactions, total] = await Promise.all([
    prisma.studentWalletTransaction.findMany({ where: { walletId }, skip, take: limit, orderBy: { createdAt: 'desc' } }),
    prisma.studentWalletTransaction.count({ where: { walletId } }),
  ]);
  return { transactions, pagination: { page, limit, total, totalPages: Math.ceil(total / limit) } };
}

async function getAllSubscriptions(page = 1, limit = 20, status) {
  const teacherSubs = await prisma.teacherSubscription.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: status ? { status } : {},
    include: { teacher: { include: { user: { select: { firstName: true, lastName: true, email: true } } } }, package: true },
    orderBy: { createdAt: 'desc' },
  });
  const totalTeacher = await prisma.teacherSubscription.count({ where: status ? { status } : {} });
  const studentSubs = await prisma.studentSubscription.findMany({
    skip: (page - 1) * limit,
    take: limit,
    where: status ? { status } : {},
    include: { student: { select: { firstName: true, lastName: true, email: true } }, package: true },
    orderBy: { createdAt: 'desc' },
  });
  const totalStudent = await prisma.studentSubscription.count({ where: status ? { status } : {} });
  return {
    teacherSubscriptions: { data: teacherSubs, pagination: { page, limit, total: totalTeacher, totalPages: Math.ceil(totalTeacher / limit) } },
    studentSubscriptions: { data: studentSubs, pagination: { page, limit, total: totalStudent, totalPages: Math.ceil(totalStudent / limit) } },
  };
}

module.exports = {
  getDashboardStats,
  getPaymentStats,
  exportBookingsCSV,
  getAllUsersWithFilters,
  getAllTeachers,
  getAllBookingsWithFilters,
  getAllPayments,
  updateUserStatus,
  deleteUser,
  banUser,
  activateUser,
  forceCancelBooking,
  forceConfirmBooking,
  sendGlobalNotification,
  getUserById,
  getTeacherById,
  createUser,
  updateUser,
  createTeacher,
  updateTeacher,
  getPrincipalReport,
  getTeacherReport,
  getStudentReport,
  getProfitReport,
  getDailyReport,
  getMonthlyReport,
  getBookingTrends,
  ensureAllWallets,
  getAllTeacherWallets,
  syncPaymentsToWallets,
  getTeacherWallet,
  sendMoneyToTeacher,
  createWalletForTeacher,
  disableWallet,
  enableWallet,
  getStudentWallet,
  getAllStudentWallets,
  depositToStudentWallet,
  withdrawFromStudentWallet,
  processStudentPayment,
  getStudentWalletTransactions,
  getAllSubscriptions,
};
