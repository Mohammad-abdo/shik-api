const express = require('express');
const router = express.Router();
const adminService = require('../services/adminService');
const { prisma } = require('../lib/prisma');
const { jwtAuth } = require('../middleware/jwtAuth');
const permissions = require('../middleware/permissions');
const roles = require('../middleware/roles');

router.use(jwtAuth);

router.get('/dashboard', permissions(['reports.view']), async (req, res, next) => {
  try {
    const stats = await adminService.getDashboardStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.get('/users', permissions(['users.read']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await adminService.getAllUsersWithFilters({
      page,
      limit,
      role: req.query.role,
      status: req.query.status,
      search: req.query.search,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/teachers', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const isApproved = req.query.isApproved === 'true' ? true : req.query.isApproved === 'false' ? false : undefined;
    const teacherType = req.query.teacherType; // FULL_TEACHER | COURSE_SHEIKH
    const result = await adminService.getAllTeachers(page, limit, isApproved, teacherType);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/bookings', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await adminService.getAllBookingsWithFilters({
      page,
      limit,
      status: req.query.status,
      teacherId: req.query.teacherId,
      studentId: req.query.studentId,
    });
    res.json(result);
  } catch (e) {
    if (e.code === 'P2022' || (e.meta?.column) || (e.message && /Unknown column|does not exist/i.test(e.message))) {
      return res.status(503).json({
        message: 'Database schema is out of date. Run in backend folder: npx prisma migrate deploy',
        code: 'MIGRATION_NEEDED',
      });
    }
    next(e);
  }
});

router.get('/payments', async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const result = await adminService.getAllPayments(page, limit, req.query.status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/payments/stats', permissions(['reports.view']), async (req, res, next) => {
  try {
    const stats = await adminService.getPaymentStats();
    res.json(stats);
  } catch (e) {
    next(e);
  }
});

router.get('/bookings/export', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const filters = {
      status: req.query.status,
      teacherId: req.query.teacherId,
      studentId: req.query.studentId,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
    };
    const csv = await adminService.exportBookingsCSV(filters);
    res.type('text/csv').send(csv);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:id/status', permissions(['users.write']), async (req, res, next) => {
  try {
    const user = await adminService.updateUserStatus(req.params.id, req.body.status);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/ban', permissions(['users.write']), async (req, res, next) => {
  try {
    const result = await adminService.banUser(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/users/:id/activate', permissions(['users.write']), async (req, res, next) => {
  try {
    const result = await adminService.activateUser(req.params.id, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.delete('/users/:id', permissions(['users.write']), async (req, res, next) => {
  try {
    await adminService.deleteUser(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (e) {
    next(e);
  }
});

router.post('/users', permissions(['users.write']), async (req, res, next) => {
  try {
    const user = await adminService.createUser(req.body, req.user.id);
    res.status(201).json(user);
  } catch (e) {
    next(e);
  }
});

router.put('/users/:id', permissions(['users.write']), async (req, res, next) => {
  try {
    const user = await adminService.updateUser(req.params.id, req.body, req.user.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.get('/users/:id', permissions(['users.read']), async (req, res, next) => {
  try {
    const user = await adminService.getUserById(req.params.id);
    res.json(user);
  } catch (e) {
    next(e);
  }
});

router.post('/teachers', permissions(['teachers.manage']), async (req, res, next) => {
  try {
    const teacher = await adminService.createTeacher(req.body, req.user.id);
    res.status(201).json(teacher);
  } catch (e) {
    next(e);
  }
});

router.put('/teachers/:id', permissions(['teachers.approve']), async (req, res, next) => {
  try {
    const teacher = await adminService.updateTeacher(req.params.id, req.body, req.user.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.get('/teachers/:id', async (req, res, next) => {
  try {
    const teacher = await adminService.getTeacherById(req.params.id);
    res.json(teacher);
  } catch (e) {
    next(e);
  }
});

router.post('/bookings/:id/force-cancel', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const booking = await adminService.forceCancelBooking(req.params.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.post('/bookings/:id/force-confirm', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const booking = await adminService.forceConfirmBooking(req.params.id, req.user.id);
    res.json(booking);
  } catch (e) {
    next(e);
  }
});

router.patch('/bookings/:id/featured', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const booking = await prisma.booking.findUnique({ where: { id: req.params.id } });
    if (!booking) {
      const err = new Error('Booking not found');
      err.statusCode = 404;
      return next(err);
    }
    const updated = await prisma.booking.update({
      where: { id: req.params.id },
      data: { isFeatured: !!req.body.isFeatured },
      include: {
        student: { select: { id: true, firstName: true, lastName: true, email: true } },
        teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
      },
    });
    res.json(updated);
  } catch (e) {
    next(e);
  }
});

router.get('/bookings/featured', permissions(['bookings.manage']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const skip = (page - 1) * limit;
    const [bookings, total] = await Promise.all([
      prisma.booking.findMany({
        where: { isFeatured: true },
        skip,
        take: limit,
        include: {
          student: { select: { id: true, firstName: true, lastName: true, email: true } },
          teacher: { include: { user: { select: { id: true, firstName: true, lastName: true, email: true } } } },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.booking.count({ where: { isFeatured: true } }),
    ]);
    res.json({ bookings, pagination: { current_page: page, per_page: limit, total, total_pages: Math.ceil(total / limit) } });
  } catch (e) {
    next(e);
  }
});

router.post('/notifications/global', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const { title, message } = req.body;
    const result = await adminService.sendGlobalNotification(req.user.id, title, message);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

const notificationService = require('../services/notificationService');
router.post('/notifications/users', permissions(['notifications.send']), async (req, res, next) => {
  try {
    const result = await notificationService.sendNotification(req.body, req.user.id);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

// Reports
router.get('/reports/principal', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const end = req.query.endDate ? new Date(req.query.endDate) : undefined;
    const result = await adminService.getPrincipalReport(start, end);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/teachers', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const end = req.query.endDate ? new Date(req.query.endDate) : undefined;
    const teacherId = req.query.teacherId;
    const result = await adminService.getTeacherReport(start, end, teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/students', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const end = req.query.endDate ? new Date(req.query.endDate) : undefined;
    const studentId = req.query.studentId;
    const result = await adminService.getStudentReport(start, end, studentId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/profits', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const end = req.query.endDate ? new Date(req.query.endDate) : undefined;
    const result = await adminService.getProfitReport(start, end);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/daily', permissions(['reports.view']), async (req, res, next) => {
  try {
    const date = req.query.date ? new Date(req.query.date) : new Date();
    const result = await adminService.getDailyReport(date);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/monthly', permissions(['reports.view']), async (req, res, next) => {
  try {
    const year = parseInt(req.query.year, 10) || new Date().getFullYear();
    const month = parseInt(req.query.month, 10) || new Date().getMonth() + 1;
    const result = await adminService.getMonthlyReport(year, month);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/trends', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : new Date(new Date().setDate(1));
    const end = req.query.endDate ? new Date(req.query.endDate) : new Date();
    const result = await adminService.getBookingTrends(start, end);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/reports/sessions', permissions(['reports.view']), async (req, res, next) => {
  try {
    const start = req.query.startDate ? new Date(req.query.startDate) : undefined;
    const end = req.query.endDate ? new Date(req.query.endDate) : undefined;
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 50, 200);
    const result = await adminService.getSessionReportsForAdmin(start, end, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/sessions', permissions(['reports.view', 'bookings.manage']), async (req, res, next) => {
  try {
    const result = await adminService.getAllSessionsForAdmin({
      page: req.query.page,
      limit: req.query.limit,
      bookingId: req.query.bookingId,
      roomId: req.query.roomId,
      status: req.query.status,
      dateFrom: req.query.dateFrom,
      dateTo: req.query.dateTo,
    });
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Teacher Wallets
router.get('/wallets', permissions(['payments.view']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const search = req.query.search;
    const result = await adminService.getAllTeacherWallets(page, limit, search);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/wallets/ensure-all', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.ensureAllWallets();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/wallets/sync-payments', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.syncPaymentsToWallets();
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/wallets/:id', permissions(['payments.view']), async (req, res, next) => {
  try {
    const walletById = await prisma.teacherWallet.findUnique({ where: { id: req.params.id } });
    const teacherId = walletById ? walletById.teacherId : req.params.id;
    const result = await adminService.getTeacherWallet(teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/wallets/:id/send-money', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const walletById = await prisma.teacherWallet.findUnique({ where: { id: req.params.id } });
    const teacherId = walletById ? walletById.teacherId : req.params.id;
    const { amount, paymentMethod, description } = req.body;
    const result = await adminService.sendMoneyToTeacher(teacherId, amount, paymentMethod || '', description || '', req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/wallets/create/:teacherId', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.createWalletForTeacher(req.params.teacherId);
    res.status(201).json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/wallets/:id/disable', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const walletById = await prisma.teacherWallet.findUnique({ where: { id: req.params.id } });
    const teacherId = walletById ? walletById.teacherId : req.params.id;
    const result = await adminService.disableWallet(teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.put('/wallets/:id/enable', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const walletById = await prisma.teacherWallet.findUnique({ where: { id: req.params.id } });
    const teacherId = walletById ? walletById.teacherId : req.params.id;
    const result = await adminService.enableWallet(teacherId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Admin subscriptions list
router.get('/subscriptions', permissions(['subscriptions.read']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const status = req.query.status;
    const result = await adminService.getAllSubscriptions(page, limit, status);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

// Student Wallets (define /:walletId/transactions before /:studentId so path matches correctly)
router.get('/student-wallets', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const search = req.query.search;
    const result = await adminService.getAllStudentWallets(page, limit, search);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/student-wallets/:walletId/transactions', permissions(['payments.view']), async (req, res, next) => {
  try {
    const page = req.query.page ? parseInt(req.query.page) : 1;
    const limit = req.query.limit ? parseInt(req.query.limit) : 50;
    const result = await adminService.getStudentWalletTransactions(req.params.walletId, page, limit);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/student-wallets/deposit', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.depositToStudentWallet(req.body, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/student-wallets/withdraw', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.withdrawFromStudentWallet(req.body, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.post('/student-wallets/process-payment', permissions(['payments.manage']), async (req, res, next) => {
  try {
    const result = await adminService.processStudentPayment(req.body, req.user.id);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

router.get('/student-wallets/:studentId', permissions(['payments.view']), async (req, res, next) => {
  try {
    const result = await adminService.getStudentWallet(req.params.studentId);
    res.json(result);
  } catch (e) {
    next(e);
  }
});

module.exports = router;
