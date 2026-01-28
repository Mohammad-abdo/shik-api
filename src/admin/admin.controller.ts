import { Controller, Get, Post, Put, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { AdminService } from './admin.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRoleEnum as UserRole } from '@prisma/client';
import { PermissionsGuard } from '../common/guards/permissions.guard';
import { Permissions } from '../common/decorators/permissions.decorator';
import { SendNotificationDto, CreateUserDto, UpdateUserDto, UpdateTeacherDto, CreateTeacherDto, DepositToWalletDto, WithdrawFromWalletDto, ProcessPaymentDto } from './dto';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('admin')
@Controller('admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('dashboard')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get dashboard statistics' })
  @ApiResponse({ status: 200, description: 'Dashboard stats retrieved successfully' })
  async getDashboard() {
    return this.adminService.getDashboardStats();
  }

  @Get('users')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get all users' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'role', required: false, type: String })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Users retrieved successfully' })
  async getAllUsers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('role') role?: string,
    @Query('status') status?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllUsersWithFilters({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      role,
      status,
      search,
    });
  }

  @Get('teachers')
  @ApiOperation({ summary: 'Get all teachers' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'isApproved', required: false, type: Boolean })
  @ApiResponse({ status: 200, description: 'Teachers retrieved successfully' })
  async getAllTeachers(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('isApproved') isApproved?: string,
  ) {
    return this.adminService.getAllTeachers(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      isApproved === 'true' ? true : isApproved === 'false' ? false : undefined,
    );
  }

  @Get('bookings')
  @Permissions('bookings.manage')
  @ApiOperation({ summary: 'Get all bookings (with optional filters)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiQuery({ name: 'teacherId', required: false, type: String })
  @ApiQuery({ name: 'studentId', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getAllBookings(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
    @Query('teacherId') teacherId?: string,
    @Query('studentId') studentId?: string,
  ) {
    return this.adminService.getAllBookingsWithFilters({
      page: page ? parseInt(page) : 1,
      limit: limit ? parseInt(limit) : 20,
      status,
      teacherId,
      studentId,
    });
  }

  @Get('payments')
  @ApiOperation({ summary: 'Get all payments' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Payments retrieved successfully' })
  async getAllPayments(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.adminService.getAllPayments(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      status,
    );
  }

  @Get('payments/stats')
  @ApiOperation({ summary: 'Get payment statistics' })
  @ApiResponse({ status: 200, description: 'Payment statistics retrieved successfully' })
  async getPaymentStats() {
    return this.adminService.getPaymentStats();
  }

  @Put('users/:id/status')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Update user status' })
  @ApiResponse({ status: 200, description: 'User status updated successfully' })
  async updateUserStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateUserStatus(id, status);
  }

  @Post('users/:id/ban')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Ban user' })
  @ApiResponse({ status: 200, description: 'User banned successfully' })
  async banUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.banUser(id, user.id);
  }

  @Post('users/:id/activate')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Activate user' })
  @ApiResponse({ status: 200, description: 'User activated successfully' })
  async activateUser(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.activateUser(id, user.id);
  }

  @Delete('users/:id')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Delete user' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  async deleteUser(@Param('id') id: string) {
    return this.adminService.deleteUser(id);
  }

  @Post('bookings/:id/force-cancel')
  @Permissions('bookings.manage')
  @ApiOperation({ summary: 'Force cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  async forceCancelBooking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.forceCancelBooking(id, user.id);
  }

  @Post('bookings/:id/force-confirm')
  @Permissions('bookings.manage')
  @ApiOperation({ summary: 'Force confirm booking' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  async forceConfirmBooking(@Param('id') id: string, @CurrentUser() user: any) {
    return this.adminService.forceConfirmBooking(id, user.id);
  }

  @Get('bookings/export')
  @Permissions('bookings.manage')
  @ApiOperation({ summary: 'Export bookings as CSV' })
  @ApiResponse({ status: 200, description: 'Bookings exported successfully' })
  async exportBookings(@Query('status') status?: string) {
    const csv = await this.adminService.exportBookingsCSV({ status });
    return { csv };
  }

  @Get('reports/principal')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get principal/overall system report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Principal report retrieved successfully' })
  async getPrincipalReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getPrincipalReport(start, end);
  }

  @Get('reports/teachers')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get teacher report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'teacherId', required: false })
  @ApiResponse({ status: 200, description: 'Teacher report retrieved successfully' })
  async getTeacherReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('teacherId') teacherId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getTeacherReport(start, end, teacherId);
  }

  @Get('reports/students')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get student report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiQuery({ name: 'studentId', required: false })
  @ApiResponse({ status: 200, description: 'Student report retrieved successfully' })
  async getStudentReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('studentId') studentId?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getStudentReport(start, end, studentId);
  }

  @Get('reports/profits')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get profit/financial report' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Profit report retrieved successfully' })
  async getProfitReport(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : undefined;
    const end = endDate ? new Date(endDate) : undefined;
    return this.adminService.getProfitReport(start, end);
  }

  @Get('reports/daily')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get daily report' })
  @ApiQuery({ name: 'date', required: false })
  @ApiResponse({ status: 200, description: 'Daily report retrieved successfully' })
  async getDailyReport(@Query('date') date?: string) {
    const reportDate = date ? new Date(date) : new Date();
    return this.adminService.getDailyReport(reportDate);
  }

  @Get('reports/monthly')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get monthly report' })
  @ApiQuery({ name: 'year', required: false })
  @ApiQuery({ name: 'month', required: false })
  @ApiResponse({ status: 200, description: 'Monthly report retrieved successfully' })
  async getMonthlyReport(@Query('year') year?: string, @Query('month') month?: string) {
    const reportYear = year ? parseInt(year) : new Date().getFullYear();
    const reportMonth = month ? parseInt(month) : new Date().getMonth() + 1;
    return this.adminService.getMonthlyReport(reportYear, reportMonth);
  }

  @Get('reports/trends')
  @Permissions('reports.view')
  @ApiOperation({ summary: 'Get booking trends' })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  @ApiResponse({ status: 200, description: 'Trends retrieved successfully' })
  async getBookingTrends(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    const start = startDate ? new Date(startDate) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();
    return this.adminService.getBookingTrends(start, end);
  }

  @Post('notifications/global')
  @Permissions('notifications.send')
  @ApiOperation({ summary: 'Send global notification' })
  @ApiResponse({ status: 200, description: 'Notification sent successfully' })
  async sendGlobalNotification(@CurrentUser() user: any, @Body() dto: SendNotificationDto) {
    return this.adminService.sendGlobalNotification(user.id, dto.title, dto.message);
  }

  @Post('notifications/users')
  @Permissions('notifications.send')
  @ApiOperation({ summary: 'Send notification to specific users' })
  @ApiResponse({ status: 200, description: 'Notifications sent successfully' })
  async sendNotificationToUsers(@CurrentUser() user: any, @Body() dto: SendNotificationDto) {
    return this.adminService.sendNotificationToUsers(user.id, dto.userIds, dto.title, dto.message);
  }

  // Full CRUD Operations
  @Post('users')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({ status: 201, description: 'User created successfully' })
  async createUser(@Body() dto: CreateUserDto, @CurrentUser() user: any) {
    return this.adminService.createUser(dto, user.id);
  }

  @Put('users/:id')
  @Permissions('users.write')
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({ status: 200, description: 'User updated successfully' })
  async updateUser(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateUser(id, dto, user.id);
  }

  @Get('users/:id')
  @Permissions('users.read')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User retrieved successfully' })
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Put('teachers/:id')
  @Permissions('teachers.approve')
  @ApiOperation({ summary: 'Update teacher' })
  @ApiResponse({ status: 200, description: 'Teacher updated successfully' })
  async updateTeacher(
    @Param('id') id: string,
    @Body() dto: UpdateTeacherDto,
    @CurrentUser() user: any,
  ) {
    return this.adminService.updateTeacher(id, dto, user.id);
  }

  @Get('teachers/:id')
  @ApiOperation({ summary: 'Get teacher by ID' })
  @ApiResponse({ status: 200, description: 'Teacher retrieved successfully' })
  async getTeacherById(@Param('id') id: string) {
    return this.adminService.getTeacherById(id);
  }

  @Post('teachers')
  @Permissions('teachers.manage')
  @ApiOperation({ summary: 'Create new teacher (Admin only)' })
  @ApiResponse({ status: 201, description: 'Teacher created successfully' })
  async createTeacher(@Body() dto: CreateTeacherDto, @CurrentUser() user: any) {
    return this.adminService.createTeacher(dto, user.id);
  }

  @Get('wallets')
  @Permissions('payments.view')
  @ApiOperation({ summary: 'Get all teacher wallets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Wallets retrieved successfully' })
  async getAllTeacherWallets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllTeacherWallets(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Post('wallets/sync-payments')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Sync completed payments to teacher wallets' })
  @ApiResponse({ status: 200, description: 'Payments synced successfully' })
  async syncPaymentsToWallets() {
    return this.adminService.syncPaymentsToWallets();
  }

  @Get('wallets/:id')
  @Permissions('payments.view')
  @ApiOperation({ summary: 'Get teacher wallet details by wallet ID or teacher ID' })
  @ApiResponse({ status: 200, description: 'Wallet retrieved successfully' })
  async getTeacherWallet(@Param('id') id: string) {
    // Check if it's a wallet ID (UUID) or teacher ID
    // Try to find by wallet ID first
    const walletById = await this.prisma.teacherWallet.findUnique({
      where: { id },
    });
    
    if (walletById) {
      return this.adminService.getTeacherWallet(walletById.teacherId);
    }
    
    // If not found, treat as teacherId
    return this.adminService.getTeacherWallet(id);
  }

  @Post('wallets/:id/send-money')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Send money to teacher wallet' })
  @ApiResponse({ status: 200, description: 'Money sent successfully' })
  async sendMoneyToTeacher(
    @Param('id') id: string,
    @Body() body: { amount: number; paymentMethod: string; description?: string },
    @CurrentUser() admin: any,
  ) {
    // Check if it's a wallet ID (UUID) or teacher ID
    const walletById = await this.prisma.teacherWallet.findUnique({
      where: { id },
    });
    
    const teacherId = walletById ? walletById.teacherId : id;
    
    return this.adminService.sendMoneyToTeacher(
      teacherId,
      body.amount,
      body.paymentMethod,
      body.description || '',
      admin.id,
    );
  }

  @Post('wallets/create/:teacherId')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Create wallet for teacher' })
  @ApiResponse({ status: 201, description: 'Wallet created successfully' })
  async createWalletForTeacher(@Param('teacherId') teacherId: string) {
    return this.adminService.createWalletForTeacher(teacherId);
  }

  @Put('wallets/:id/disable')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Disable teacher wallet' })
  @ApiResponse({ status: 200, description: 'Wallet disabled successfully' })
  async disableWallet(@Param('id') id: string) {
    // Check if it's a wallet ID (UUID) or teacher ID
    const walletById = await this.prisma.teacherWallet.findUnique({
      where: { id },
    });
    
    const teacherId = walletById ? walletById.teacherId : id;
    return this.adminService.disableWallet(teacherId);
  }

  @Put('wallets/:id/enable')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Enable teacher wallet' })
  @ApiResponse({ status: 200, description: 'Wallet enabled successfully' })
  async enableWallet(@Param('id') id: string) {
    // Check if it's a wallet ID (UUID) or teacher ID
    const walletById = await this.prisma.teacherWallet.findUnique({
      where: { id },
    });
    
    const teacherId = walletById ? walletById.teacherId : id;
    return this.adminService.enableWallet(teacherId);
  }

  @Get('subscriptions')
  @Permissions('subscriptions.read')
  @ApiOperation({ summary: 'Get all subscriptions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Subscriptions retrieved successfully' })
  async getAllSubscriptions(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    // This will be handled by subscription controller
    // For now, redirect to subscription service
    return { message: 'Use /subscriptions/admin/all endpoint' };
  }

  // Student Wallet Management (Admin only)
  @Get('student-wallets')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Get all student wallets' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'search', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Student wallets retrieved successfully' })
  async getAllStudentWallets(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
  ) {
    return this.adminService.getAllStudentWallets(
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 20,
      search,
    );
  }

  @Get('student-wallets/:studentId')
  @Permissions('payments.view')
  @ApiOperation({ summary: 'Get student wallet by student ID' })
  @ApiResponse({ status: 200, description: 'Student wallet retrieved successfully' })
  async getStudentWallet(@Param('studentId') studentId: string) {
    return this.adminService.getStudentWallet(studentId);
  }

  @Post('student-wallets/deposit')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Deposit money to student wallet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Money deposited successfully' })
  async depositToStudentWallet(
    @Body() dto: DepositToWalletDto,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.depositToStudentWallet(dto, admin.id);
  }

  @Post('student-wallets/withdraw')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Withdraw money from student wallet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Money withdrawn successfully' })
  async withdrawFromStudentWallet(
    @Body() dto: WithdrawFromWalletDto,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.withdrawFromStudentWallet(dto, admin.id);
  }

  @Post('student-wallets/process-payment')
  @Permissions('payments.manage')
  @ApiOperation({ summary: 'Process payment from student wallet (Admin only)' })
  @ApiResponse({ status: 200, description: 'Payment processed successfully' })
  async processStudentPayment(
    @Body() dto: ProcessPaymentDto,
    @CurrentUser() admin: any,
  ) {
    return this.adminService.processStudentPayment(dto, admin.id);
  }

  @Get('student-wallets/:walletId/transactions')
  @Permissions('payments.view')
  @ApiOperation({ summary: 'Get student wallet transactions' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiResponse({ status: 200, description: 'Transactions retrieved successfully' })
  async getStudentWalletTransactions(
    @Param('walletId') walletId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    return this.adminService.getStudentWalletTransactions(
      walletId,
      page ? parseInt(page) : 1,
      limit ? parseInt(limit) : 50,
    );
  }
}
