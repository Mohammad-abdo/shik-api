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
exports.ExamController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const exam_service_1 = require("./exam.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const permissions_guard_1 = require("../common/guards/permissions.guard");
const permissions_decorator_1 = require("../common/decorators/permissions.decorator");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const dto_1 = require("./dto");
let ExamController = class ExamController {
    constructor(examService) {
        this.examService = examService;
    }
    async createExam(dto, user) {
        return this.examService.createExam(dto, user.id);
    }
    async addQuestion(examId, dto, user) {
        return this.examService.addQuestion(examId, dto, user.id);
    }
    async publishExam(examId, user) {
        return this.examService.publishExam(examId, user.id);
    }
    async getExam(examId, user) {
        return this.examService.getExam(examId, user.id);
    }
    async submitExam(examId, dto, user) {
        return this.examService.submitExam(examId, dto, user.id);
    }
    async getResults(examId, user) {
        return this.examService.getExamResults(examId, user.id);
    }
    async gradeExam(examId, submissionId, user) {
        return this.examService.gradeExam(examId, submissionId, user.id);
    }
    async getStudentExams(user) {
        return this.examService.getStudentExams(user.id);
    }
    async getTeacherExams(user) {
        return this.examService.getTeacherExams(user.id);
    }
};
exports.ExamController = ExamController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new exam (Teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Exam created successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.CreateExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "createExam", null);
__decorate([
    (0, common_1.Post)(':id/questions'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Add question to exam (Teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Question added successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.AddQuestionDto, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "addQuestion", null);
__decorate([
    (0, common_1.Post)(':id/publish'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Publish exam (Teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exam published successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "publishExam", null);
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exam details' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exam retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getExam", null);
__decorate([
    (0, common_1.Post)(':id/submit'),
    (0, swagger_1.ApiOperation)({ summary: 'Submit exam (Student only)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Exam submitted successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.SubmitExamDto, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "submitExam", null);
__decorate([
    (0, common_1.Get)(':id/results'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.review'),
    (0, swagger_1.ApiOperation)({ summary: 'Get exam results (Teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Results retrieved successfully' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getResults", null);
__decorate([
    (0, common_1.Put)(':examId/submissions/:submissionId/grade'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.review'),
    (0, swagger_1.ApiOperation)({ summary: 'Grade exam submission (Teacher only)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exam graded successfully' }),
    __param(0, (0, common_1.Param)('examId')),
    __param(1, (0, common_1.Param)('submissionId')),
    __param(2, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "gradeExam", null);
__decorate([
    (0, common_1.Get)('student/my-exams'),
    (0, swagger_1.ApiOperation)({ summary: 'Get available exams for student' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exams retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getStudentExams", null);
__decorate([
    (0, common_1.Get)('teacher/my-exams'),
    (0, common_1.UseGuards)(permissions_guard_1.PermissionsGuard),
    (0, permissions_decorator_1.Permissions)('exams.create'),
    (0, swagger_1.ApiOperation)({ summary: 'Get teacher exams' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Exams retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], ExamController.prototype, "getTeacherExams", null);
exports.ExamController = ExamController = __decorate([
    (0, swagger_1.ApiTags)('exams'),
    (0, common_1.Controller)('exams'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [exam_service_1.ExamService])
], ExamController);
//# sourceMappingURL=exam.controller.js.map