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
exports.TeacherController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teacher_service_1 = require("./teacher.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const roles_guard_1 = require("../common/guards/roles.guard");
const roles_decorator_1 = require("../common/decorators/roles.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const client_1 = require("@prisma/client");
const dto_1 = require("./dto");
let TeacherController = class TeacherController {
    constructor(teacherService) {
        this.teacherService = teacherService;
    }
    async findAll(specialties, minRating, search) {
        return this.teacherService.findAll({
            specialties: specialties ? specialties.split(',') : undefined,
            minRating: minRating ? parseFloat(minRating) : undefined,
            search,
        });
    }
    async findOne(id) {
        return this.teacherService.findOne(id);
    }
    async create(user, dto) {
        return this.teacherService.create(user.id, dto);
    }
    async update(id, user, dto) {
        return this.teacherService.update(id, user.id, dto);
    }
    async createSchedule(id, user, dto) {
        return this.teacherService.createSchedule(id, user.id, dto);
    }
    async updateSchedule(teacherId, scheduleId, user, dto) {
        return this.teacherService.updateSchedule(scheduleId, teacherId, user.id, dto);
    }
    async deleteSchedule(teacherId, scheduleId, user) {
        return this.teacherService.deleteSchedule(scheduleId, teacherId, user.id);
    }
    async approveTeacher(id, user) {
        return this.teacherService.approveTeacher(id, user.id);
    }
    async rejectTeacher(id) {
        return this.teacherService.rejectTeacher(id);
    }
};
exports.TeacherController = TeacherController;
__decorate([
    (0, common_1.Get)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get all teachers' }),
    (0, swagger_1.ApiQuery)({ name: 'specialties', required: false, type: [String] }),
    (0, swagger_1.ApiQuery)({ name: 'minRating', required: false, type: Number }),
    (0, swagger_1.ApiQuery)({ name: 'search', required: false, type: String }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teachers retrieved successfully' }),
    __param(0, (0, common_1.Query)('specialties')),
    __param(1, (0, common_1.Query)('minRating')),
    __param(2, (0, common_1.Query)('search')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher by ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher retrieved successfully' }),
    (0, swagger_1.ApiResponse)({ status: 404, description: 'Teacher not found' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "findOne", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create teacher profile' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Teacher profile created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, dto_1.CreateTeacherDto]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "create", null);
__decorate([
    (0, common_1.Put)(':id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update teacher profile' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher profile updated successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, dto_1.UpdateTeacherDto]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/schedules'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create teacher schedule' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Schedule created successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, dto_1.CreateScheduleDto]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "createSchedule", null);
__decorate([
    (0, common_1.Put)(':teacherId/schedules/:scheduleId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Update teacher schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule updated successfully' }),
    __param(0, (0, common_1.Param)('teacherId')),
    __param(1, (0, common_1.Param)('scheduleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __param(3, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object, dto_1.UpdateScheduleDto]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "updateSchedule", null);
__decorate([
    (0, common_1.Delete)(':teacherId/schedules/:scheduleId'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Delete teacher schedule' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Schedule deleted successfully' }),
    __param(0, (0, common_1.Param)('teacherId')),
    __param(1, (0, common_1.Param)('scheduleId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "deleteSchedule", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRoleEnum.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Approve teacher (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher approved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "approveTeacher", null);
__decorate([
    (0, common_1.Delete)(':id/reject'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    (0, roles_decorator_1.Roles)(client_1.UserRoleEnum.ADMIN),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Reject teacher (Admin only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Teacher rejected successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], TeacherController.prototype, "rejectTeacher", null);
exports.TeacherController = TeacherController = __decorate([
    (0, swagger_1.ApiTags)('teachers'),
    (0, common_1.Controller)('teachers'),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService])
], TeacherController);
//# sourceMappingURL=teacher.controller.js.map