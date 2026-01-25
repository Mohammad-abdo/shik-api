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
exports.SessionController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const session_service_1 = require("./session.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
const dto_1 = require("./dto");
let SessionController = class SessionController {
    constructor(sessionService) {
        this.sessionService = sessionService;
    }
    async create(bookingId, user, dto) {
        return this.sessionService.create(bookingId, { ...dto, userId: user.id });
    }
    async getSession(bookingId, user) {
        return this.sessionService.getSession(bookingId, user.id);
    }
    async startSession(bookingId) {
        return this.sessionService.startSession(bookingId);
    }
    async endSession(bookingId, dto) {
        return this.sessionService.endSession(bookingId, dto.recordingUrl);
    }
};
exports.SessionController = SessionController;
__decorate([
    (0, common_1.Post)('bookings/:bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Create session for booking' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Session created successfully' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, dto_1.CreateSessionDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "create", null);
__decorate([
    (0, common_1.Get)('bookings/:bookingId'),
    (0, swagger_1.ApiOperation)({ summary: 'Get session by booking ID' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session retrieved successfully' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "getSession", null);
__decorate([
    (0, common_1.Post)('bookings/:bookingId/start'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Start session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session started successfully' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "startSession", null);
__decorate([
    (0, common_1.Post)('bookings/:bookingId/end'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'End session' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Session ended successfully' }),
    __param(0, (0, common_1.Param)('bookingId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, dto_1.EndSessionDto]),
    __metadata("design:returntype", Promise)
], SessionController.prototype, "endSession", null);
exports.SessionController = SessionController = __decorate([
    (0, swagger_1.ApiTags)('sessions'),
    (0, common_1.Controller)('sessions'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [session_service_1.SessionService])
], SessionController);
//# sourceMappingURL=session.controller.js.map