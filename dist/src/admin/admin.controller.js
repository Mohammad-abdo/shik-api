"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const admin_service_1 = require("./admin.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const dto_1 = require("./dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let AdminController = class AdminController {
    constructor(adminService, prisma) {
        this.adminService = adminService;
        this.prisma = prisma;
    }
    async getDashboard() {
        return this.adminService.getDashboardStats();
    }
    async getAllUsers(page, limit, role, status, search) {
        return this.adminService.getAllUsersWithFilters({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            role,
            status,
            search,
        });
    }
    async getAllTeachers(page, limit, isApproved) {
        return this.adminService.getAllTeachers(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, isApproved === 'true' ? true : isApproved === 'false' ? false : undefined);
    }
    async getAllBookings(page, limit, status, teacherId, studentId) {
        return this.adminService.getAllBookingsWithFilters({
            page: page ? parseInt(page) : 1,
            limit: limit ? parseInt(limit) : 20,
            status,
            teacherId,
            studentId,
        });
    }
    async getAllPayments(page, limit, status) {
        return this.adminService.getAllPayments(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, status);
    }
    async getPaymentStats() {
        return this.adminService.getPaymentStats();
    }
    async updateUserStatus(id, status, user) {
        return this.adminService.updateUserStatus(id, status);
    }
    async banUser(id, user) {
        return this.adminService.banUser(id, user.id);
    }
    async activateUser(id, user) {
        return this.adminService.activateUser(id, user.id);
    }
    async deleteUser(id) {
        return this.adminService.deleteUser(id);
    }
    async forceCancelBooking(id, user) {
        return this.adminService.forceCancelBooking(id, user.id);
    }
    async forceConfirmBooking(id, user) {
        return this.adminService.forceConfirmBooking(id, user.id);
    }
    async exportBookings(status) {
        const csv = await this.adminService.exportBookingsCSV({ status });
        return { csv };
    }
    async getPrincipalReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.adminService.getPrincipalReport(start, end);
    }
    async getTeacherReport(startDate, endDate, teacherId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.adminService.getTeacherReport(start, end, teacherId);
    }
    async getStudentReport(startDate, endDate, studentId) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.adminService.getStudentReport(start, end, studentId);
    }
    async getProfitReport(startDate, endDate) {
        const start = startDate ? new Date(startDate) : undefined;
        const end = endDate ? new Date(endDate) : undefined;
        return this.adminService.getProfitReport(start, end);
    }
    async getDailyReport(date) {
        const reportDate = date ? new Date(date) : new Date();
        return this.adminService.getDailyReport(reportDate);
    }
    async getMonthlyReport(year, month) {
        const reportYear = year ? parseInt(year) : new Date().getFullYear();
        const reportMonth = month ? parseInt(month) : new Date().getMonth() + 1;
        return this.adminService.getMonthlyReport(reportYear, reportMonth);
    }
    async getBookingTrends(startDate, endDate) {
        const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        const end = endDate ? new Date(endDate) : new Date();
        return this.adminService.getBookingTrends(start, end);
    }
    async sendGlobalNotification(user, dto) {
        return this.adminService.sendGlobalNotification(user.id, dto.title, dto.message);
    }
    async sendNotificationToUsers(user, dto) {
        return this.adminService.sendNotificationToUsers(user.id, dto.userIds, dto.title, dto.message);
    }
    async createUser(dto, user) {
        return this.adminService.createUser(dto, user.id);
    }
    async updateUser(id, dto, user) {
        return this.adminService.updateUser(id, dto, user.id);
    }
    async getUserById(id) {
        return this.adminService.getUserById(id);
    }
    async updateTeacher(id, dto, user) {
        return this.adminService.updateTeacher(id, dto, user.id);
    }
    async getTeacherById(id) {
        return this.adminService.getTeacherById(id);
    }
    async createTeacher(dto, user) {
        return this.adminService.createTeacher(dto, user.id);
    }
    async getAllTeacherWallets(page, limit, search) {
        return this.adminService.getAllTeacherWallets(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, search);
    }
    async syncPaymentsToWallets() {
        return this.adminService.syncPaymentsToWallets();
    }
    async getTeacherWallet(id) {
        const walletById = await this.prisma.teacherWallet.findUnique({
            where: { id },
        });
        if (walletById) {
            return this.adminService.getTeacherWallet(walletById.teacherId);
        }
        return this.adminService.getTeacherWallet(id);
    }
    async sendMoneyToTeacher(id, body, admin) {
        const walletById = await this.prisma.teacherWallet.findUnique({
            where: { id },
        });
        const teacherId = walletById ? walletById.teacherId : id;
        return this.adminService.sendMoneyToTeacher(teacherId, body.amount, body.paymentMethod, body.description || '', admin.id);
    }
    async createWalletForTeacher(teacherId) {
        return this.adminService.createWalletForTeacher(teacherId);
    }
    async disableWallet(id) {
        const walletById = await this.prisma.teacherWallet.findUnique({
            where: { id },
        });
        const teacherId = walletById ? walletById.teacherId : id;
        return this.adminService.disableWallet(teacherId);
    }
    async enableWallet(id) {
        const walletById = await this.prisma.teacherWallet.findUnique({
            where: { id },
        });
        const teacherId = walletById ? walletById.teacherId : id;
        return this.adminService.enableWallet(teacherId);
    }
    async getAllSubscriptions(page, limit, status) {
        return { message: 'Use /subscriptions/admin/all endpoint' };
    }
    async getAllStudentWallets(page, limit, search) {
        return this.adminService.getAllStudentWallets(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, search);
    }
    async getStudentWallet(studentId) {
        return this.adminService.getStudentWallet(studentId);
    }
    async depositToStudentWallet(dto, admin) {
        return this.adminService.depositToStudentWallet(dto, admin.id);
    }
    async withdrawFromStudentWallet(dto, admin) {
        return this.adminService.withdrawFromStudentWallet(dto, admin.id);
    }
    async processStudentPayment(dto, admin) {
        return this.adminService.processStudentPayment(dto, admin.id);
    }
    async getStudentWalletTransactions(walletId, page, limit) {
        return this.adminService.getStudentWalletTransactions(walletId, page ? parseInt(page) : 1, limit ? parseInt(limit) : 50);
    }
};
exports.AdminController = AdminController;
__decorate([
    (0, common_1.Get)('dashboard'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get dashboard statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Dashboard stats retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDashboard", null);
__decorate([
    (0, common_1.Get)('users'),
    (0, permissions_decorator_1.Permissions)('users.read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all users' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'role', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Users retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('role')),
    __param(3, (0, common_1.Query)('status')),
    __param(4, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllUsers", null);
__decorate([
    (0, common_1.Get)('teachers'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all teachers' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'isApproved', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teachers retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('isApproved')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllTeachers", null);
__decorate([
    (0, common_1.Get)('bookings'),
    (0, permissions_decorator_1.Permissions)('bookings.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all bookings (with optional filters)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'teacherId', required: false, type: String }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookings retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Query)('teacherId')),
    __param(4, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)('payments'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all payments' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllPayments", null);
__decorate([
    (0, common_1.Get)('payments/stats'),
    (0, swagger_1.ApiOperation)({ summary: 'Get payment statistics' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment statistics retrieved successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPaymentStats", null);
__decorate([
    (0, common_1.Put)('users/:id/status'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user status' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User status updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)('status')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUserStatus", null);
__decorate([
    (0, common_1.Post)('users/:id/ban'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Ban user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User banned successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "banUser", null);
__decorate([
    (0, common_1.Post)('users/:id/activate'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Activate user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User activated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "activateUser", null);
__decorate([
    (0, common_1.Delete)('users/:id'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Delete user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "deleteUser", null);
__decorate([
    (0, common_1.Post)('bookings/:id/force-cancel'),
    (0, permissions_decorator_1.Permissions)('bookings.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Force cancel booking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking cancelled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceCancelBooking", null);
__decorate([
    (0, common_1.Post)('bookings/:id/force-confirm'),
    (0, permissions_decorator_1.Permissions)('bookings.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Force confirm booking' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Booking confirmed successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "forceConfirmBooking", null);
__decorate([
    (0, common_1.Get)('bookings/export'),
    (0, permissions_decorator_1.Permissions)('bookings.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Export bookings as CSV' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Bookings exported successfully' }),
    __param(0, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "exportBookings", null);
__decorate([
    (0, common_1.Get)('reports/principal'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get principal/overall system report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Principal report retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getPrincipalReport", null);
__decorate([
    (0, common_1.Get)('reports/teachers'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'teacherId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher report retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherReport", null);
__decorate([
    (0, common_1.Get)('reports/students'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'studentId', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student report retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __param(2, (0, common_1.Query)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStudentReport", null);
__decorate([
    (0, common_1.Get)('reports/profits'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get profit/financial report' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Profit report retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getProfitReport", null);
__decorate([
    (0, common_1.Get)('reports/daily'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get daily report' }),
    (0, swagger_1.ApiQuery)({ name: 'date', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Daily report retrieved successfully' }),
    __param(0, (0, common_1.Query)('date')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getDailyReport", null);
__decorate([
    (0, common_1.Get)('reports/monthly'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get monthly report' }),
    (0, swagger_1.ApiQuery)({ name: 'year', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'month', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Monthly report retrieved successfully' }),
    __param(0, (0, common_1.Query)('year')),
    __param(1, (0, common_1.Query)('month')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getMonthlyReport", null);
__decorate([
    (0, common_1.Get)('reports/trends'),
    (0, permissions_decorator_1.Permissions)('reports.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get booking trends' }),
    (0, swagger_1.ApiQuery)({ name: 'startDate', required: false }),
    (0, swagger_1.ApiQuery)({ name: 'endDate', required: false }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Trends retrieved successfully' }),
    __param(0, (0, common_1.Query)('startDate')),
    __param(1, (0, common_1.Query)('endDate')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getBookingTrends", null);
__decorate([
    (0, common_1.Post)('notifications/global'),
    (0, permissions_decorator_1.Permissions)('notifications.send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send global notification' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notification sent successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SendNotificationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendGlobalNotification", null);
__decorate([
    (0, common_1.Post)('notifications/users'),
    (0, permissions_decorator_1.Permissions)('notifications.send'),
    (0, swagger_1.ApiOperation)({ summary: 'Send notification to specific users' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Notifications sent successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SendNotificationDto]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendNotificationToUsers", null);
__decorate([
    (0, common_1.Post)('users'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new user' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createUser", null);
__decorate([
    (0, common_1.Put)('users/:id'),
    (0, permissions_decorator_1.Permissions)('users.write'),
    (0, swagger_1.ApiOperation)({ summary: 'Update user' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateUserDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateUser", null);
__decorate([
    (0, common_1.Get)('users/:id'),
    (0, permissions_decorator_1.Permissions)('users.read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get user by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'User retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getUserById", null);
__decorate([
    (0, common_1.Put)('teachers/:id'),
    (0, permissions_decorator_1.Permissions)('teachers.approve'),
    (0, swagger_1.ApiOperation)({ summary: 'Update teacher' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateTeacherDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "updateTeacher", null);
__decorate([
    (0, common_1.Get)('teachers/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherById", null);
__decorate([
    (0, common_1.Post)('teachers'),
    (0, permissions_decorator_1.Permissions)('teachers.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create new teacher (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Teacher created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateTeacherDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createTeacher", null);
__decorate([
    (0, common_1.Get)('wallets'),
    (0, permissions_decorator_1.Permissions)('payments.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all teacher wallets' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallets retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllTeacherWallets", null);
__decorate([
    (0, common_1.Post)('wallets/sync-payments'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Sync completed payments to teacher wallets' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payments synced successfully' }),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "syncPaymentsToWallets", null);
__decorate([
    (0, common_1.Get)('wallets/:id'),
    (0, permissions_decorator_1.Permissions)('payments.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher wallet details by wallet ID or teacher ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getTeacherWallet", null);
__decorate([
    (0, common_1.Post)('wallets/:id/send-money'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Send money to teacher wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Money sent successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "sendMoneyToTeacher", null);
__decorate([
    (0, common_1.Post)('wallets/create/:teacherId'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Create wallet for teacher' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Wallet created successfully' }),
    __param(0, (0, common_1.Param)('teacherId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "createWalletForTeacher", null);
__decorate([
    (0, common_1.Put)('wallets/:id/disable'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Disable teacher wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet disabled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "disableWallet", null);
__decorate([
    (0, common_1.Put)('wallets/:id/enable'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Enable teacher wallet' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Wallet enabled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "enableWallet", null);
__decorate([
    (0, common_1.Get)('subscriptions'),
    (0, permissions_decorator_1.Permissions)('subscriptions.read'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all subscriptions' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllSubscriptions", null);
__decorate([
    (0, common_1.Get)('student-wallets'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all student wallets' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student wallets retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getAllStudentWallets", null);
__decorate([
    (0, common_1.Get)('student-wallets/:studentId'),
    (0, permissions_decorator_1.Permissions)('payments.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student wallet by student ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Student wallet retrieved successfully' }),
    __param(0, (0, common_1.Param)('studentId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStudentWallet", null);
__decorate([
    (0, common_1.Post)('student-wallets/deposit'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Deposit money to student wallet (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Money deposited successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.DepositToWalletDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "depositToStudentWallet", null);
__decorate([
    (0, common_1.Post)('student-wallets/withdraw'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Withdraw money from student wallet (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Money withdrawn successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.WithdrawFromWalletDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "withdrawFromStudentWallet", null);
__decorate([
    (0, common_1.Post)('student-wallets/process-payment'),
    (0, permissions_decorator_1.Permissions)('payments.manage'),
    (0, swagger_1.ApiOperation)({ summary: 'Process payment from student wallet (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Payment processed successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.ProcessPaymentDto, Object]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "processStudentPayment", null);
__decorate([
    (0, common_1.Get)('student-wallets/:walletId/transactions'),
    (0, permissions_decorator_1.Permissions)('payments.view'),
    (0, swagger_1.ApiOperation)({ summary: 'Get student wallet transactions' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Transactions retrieved successfully' }),
    __param(0, (0, common_1.Param)('walletId')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], AdminController.prototype, "getStudentWalletTransactions", null);
exports.AdminController = AdminController = __decorate([
    (0, swagger_1.ApiTags)('admin'),
    (0, common_1.Controller)('admin'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [admin_service_1.AdminService,
        prisma_service_1.PrismaService])
], AdminController);
//# sourceMappingURL=admin.controller.js.map