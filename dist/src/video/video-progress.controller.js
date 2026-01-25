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
exports.VideoProgressController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const video_progress_service_1 = require("./video-progress.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let VideoProgressController = class VideoProgressController {
    constructor(videoProgressService) {
        this.videoProgressService = videoProgressService;
    }
    async startWatching(videoId, user, dto) {
        return this.videoProgressService.startWatching(videoId, user.id, dto.lesson_id, dto.course_id);
    }
    async completeVideo(videoId, user, dto) {
        return this.videoProgressService.completeVideo(videoId, user.id, dto.lesson_id, dto.course_id, dto.watch_duration_seconds);
    }
    async getProgress(courseId, user) {
        return this.videoProgressService.getCourseProgress(courseId, user.id);
    }
};
exports.VideoProgressController = VideoProgressController;
__decorate([
    (0, common_1.Post)('videos/:video_id/start'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Track when a student starts watching a video lesson' }),
    __param(0, (0, common_1.Param)('video_id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], VideoProgressController.prototype, "startWatching", null);
__decorate([
    (0, common_1.Post)('videos/:video_id/complete'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Mark a video as fully watched/completed' }),
    __param(0, (0, common_1.Param)('video_id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], VideoProgressController.prototype, "completeVideo", null);
__decorate([
    (0, common_1.Get)('courses/:course_id/progress'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get user video watching progress for a specific course' }),
    __param(0, (0, common_1.Param)('course_id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideoProgressController.prototype, "getProgress", null);
exports.VideoProgressController = VideoProgressController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Video Progress'),
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [video_progress_service_1.VideoProgressService])
], VideoProgressController);
//# sourceMappingURL=video-progress.controller.js.map