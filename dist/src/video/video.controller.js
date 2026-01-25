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
exports.VideoController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const video_service_1 = require("./video.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let VideoController = class VideoController {
    constructor(videoService) {
        this.videoService = videoService;
    }
    async createSession(bookingId, user) {
        return this.videoService.createSession(bookingId, user.id);
    }
    async getSessionToken(bookingId, user) {
        return this.videoService.getSessionToken(bookingId, user.id);
    }
    async endSession(bookingId, user) {
        return this.videoService.endSession(bookingId, user.id);
    }
    async getSessionHistory(user) {
        return this.videoService.getSessionHistory(user.id);
    }
};
exports.VideoController = VideoController;
__decorate([
    (0, common_1.Post)('session/create'),
    (0, swagger_1.ApiOperation)({ summary: 'Create a video session for a booking' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session created successfully' }),
    __param(0, (0, common_1.Body)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "createSession", null);
__decorate([
    (0, common_1.Get)('session/token/:bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get Agora token for joining session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Token retrieved successfully' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getSessionToken", null);
__decorate([
    (0, common_1.Post)('session/end'),
    (0, swagger_1.ApiOperation)({ summary: 'End a video session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session ended successfully' }),
    __param(0, (0, common_1.Body)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "endSession", null);
__decorate([
    (0, common_1.Get)('session/history'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session history' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session history retrieved successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], VideoController.prototype, "getSessionHistory", null);
exports.VideoController = VideoController = __decorate([
    (0, swagger_1.ApiTags)('video'),
    (0, common_1.Controller)('video'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [video_service_1.VideoService])
], VideoController);
//# sourceMappingURL=video.controller.js.map