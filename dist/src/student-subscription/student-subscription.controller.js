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
exports.StudentSubscriptionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const student_subscription_service_1 = require("./student-subscription.service");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const dto_1 = require("./dto");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
let StudentSubscriptionController = class StudentSubscriptionController {
    constructor(subscriptionService, prisma) {
        this.subscriptionService = subscriptionService;
        this.prisma = prisma;
    }
    async createPackage(dto, user) {
        return this.subscriptionService.createPackage(dto, user.id);
    }
    async getAllPackages(activeOnly) {
        return this.subscriptionService.getAllPackages(activeOnly === 'true');
    }
    async getPackageById(id) {
        return this.subscriptionService.getPackageById(id);
    }
    async updatePackage(id, dto) {
        return this.subscriptionService.updatePackage(id, dto);
    }
    async deletePackage(id) {
        return this.subscriptionService.deletePackage(id);
    }
    async subscribe(user, dto) {
        if (user.role !== 'STUDENT') {
            throw new Error('Only students can subscribe');
        }
        return this.subscriptionService.subscribe(user.id, dto);
    }
    async getMySubscriptions(user) {
        if (user.role !== 'STUDENT') {
            throw new Error('Only students can view subscriptions');
        }
        return this.subscriptionService.getStudentSubscriptions(user.id);
    }
    async getMyActiveSubscription(user) {
        if (user.role !== 'STUDENT') {
            throw new Error('Only students can view subscriptions');
        }
        return this.subscriptionService.getActiveSubscription(user.id);
    }
    async cancelSubscription(id, user) {
        if (user.role !== 'STUDENT') {
            throw new Error('Only students can cancel subscriptions');
        }
        return this.subscriptionService.cancelSubscription(id, user.id);
    }
    async getAllSubscriptions(page, limit, status) {
        return this.subscriptionService.getAllSubscriptions(page ? parseInt(page) : 1, limit ? parseInt(limit) : 20, status);
    }
};
exports.StudentSubscriptionController = StudentSubscriptionController;
__decorate([
    (0, common_1.Post)('packages'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('subscriptions.write'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create student subscription package (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Package created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateStudentPackageDto, Object]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "createPackage", null);
__decorate([
    (0, common_1.Get)('packages'),
    (0, swagger_1.ApiOperation)({ summary: 'Get all student subscription packages' }),
    (0, swagger_1.ApiQuery)({ name: 'activeOnly', required: false, type: Boolean }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Packages retrieved successfully' }),
    __param(0, (0, common_1.Query)('activeOnly')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "getAllPackages", null);
__decorate([
    (0, common_1.Get)('packages/:id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get package by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Package retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "getPackageById", null);
__decorate([
    (0, common_1.Put)('packages/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('subscriptions.write'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update package (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Package updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.UpdateStudentPackageDto]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "updatePackage", null);
__decorate([
    (0, common_1.Delete)('packages/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('subscriptions.write'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete package (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Package deleted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "deletePackage", null);
__decorate([
    (0, common_1.Post)('subscribe'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Subscribe to a package (Student only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Subscription created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.SubscribeStudentDto]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "subscribe", null);
__decorate([
    (0, common_1.Get)('my-subscriptions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my subscriptions (Student only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "getMySubscriptions", null);
__decorate([
    (0, common_1.Get)('my-active'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get my active subscription (Student only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Active subscription retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "getMyActiveSubscription", null);
__decorate([
    (0, common_1.Post)('cancel/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Cancel subscription (Student only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscription cancelled successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "cancelSubscription", null);
__decorate([
    (0, common_1.Get)('admin/all'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('subscriptions.read'),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all student subscriptions (Admin only)' }),
    (0, swagger_1.ApiQuery)({ name: 'page', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'limit', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'status', required: false, enum: client_1.SubscriptionStatus }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Subscriptions retrieved successfully' }),
    __param(0, (0, common_1.Query)('page')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('status')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], StudentSubscriptionController.prototype, "getAllSubscriptions", null);
exports.StudentSubscriptionController = StudentSubscriptionController = __decorate([
    (0, swagger_1.ApiTags)('student-subscriptions'),
    (0, common_1.Controller)('student-subscriptions'),
    __metadata("design:paramtypes", [student_subscription_service_1.StudentSubscriptionService,
        prisma_service_1.PrismaService])
], StudentSubscriptionController);
//# sourceMappingURL=student-subscription.controller.js.map