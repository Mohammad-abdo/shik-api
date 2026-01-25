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
exports.MobileUserController = exports.MobileAuthController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const swagger_1 = require("@nestjs/swagger");
const auth_service_1 = require("./auth.service");
const dto_1 = require("./dto");
const file_upload_service_1 = require("../file-upload/file-upload.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let MobileAuthController = class MobileAuthController {
    constructor(authService, fileUploadService) {
        this.authService = authService;
        this.fileUploadService = fileUploadService;
    }
    async register(dto, profileImage) {
        let profileImageUrl;
        if (profileImage) {
            try {
                profileImageUrl = await this.fileUploadService.uploadFile(profileImage, 'profiles');
            }
            catch (error) {
                console.error('File upload error:', error);
                console.warn('Continuing registration without profile image due to upload failure');
            }
        }
        return this.authService.mobileSignUp(dto, profileImageUrl);
    }
    async login(dto) {
        return this.authService.mobileLogin(dto);
    }
    async forgotPassword(dto) {
        return this.authService.mobileForgotPassword(dto);
    }
    async resetPassword(dto) {
        return this.authService.mobileResetPassword(dto);
    }
};
exports.MobileAuthController = MobileAuthController;
__decorate([
    (0, common_1.Post)('register'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('profile_image')),
    (0, swagger_1.ApiConsumes)('multipart/form-data'),
    (0, swagger_1.ApiOperation)({ summary: 'Register a new user (Mobile)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'User registered successfully' }),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [dto_1.MobileSignUpDto, Object]),
    __metadata("design:returntype", Promise)
], MobileAuthController.prototype, "register", null);
__decorate([
    (0, common_1.Post)('login'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Login user (Mobile)' }),
    (0, swagger_1.ApiResponse)({ status: 200, description: 'Login successful' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MobileAuthController.prototype, "login", null);
__decorate([
    (0, common_1.Post)('forgot-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Request OTP code for password reset' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MobileAuthController.prototype, "forgotPassword", null);
__decorate([
    (0, common_1.Post)('reset-password'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    (0, swagger_1.ApiOperation)({ summary: 'Verify OTP and set new password' }),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MobileAuthController.prototype, "resetPassword", null);
exports.MobileAuthController = MobileAuthController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Auth'),
    (0, common_1.Controller)('auth'),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        file_upload_service_1.FileUploadService])
], MobileAuthController);
let MobileUserController = class MobileUserController {
    constructor(authService) {
        this.authService = authService;
    }
    async getProfile(user) {
        return {
            success: true,
            message: 'تم جلب البيانات بنجاح',
            data: {
                user: this.sanitizeMobileUser(user),
            },
        };
    }
    sanitizeMobileUser(user) {
        return {
            id: user.id || user.sub,
            user_type: user.role === 'TEACHER' ? 'sheikh' : 'student',
            name: `${user.firstName} ${user.lastName}`.trim(),
            email: user.email,
            age: user.age,
            gender: user.gender?.toLowerCase(),
            memorized_parts: user.memorized_parts,
            student_phone: user.student_phone,
            parent_phone: user.parent_phone,
            profile_image_url: user.avatar,
            created_at: user.createdAt,
            updated_at: user.updatedAt,
        };
    }
};
exports.MobileUserController = MobileUserController;
__decorate([
    (0, common_1.Get)(),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get authenticated user complete profile' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], MobileUserController.prototype, "getProfile", null);
exports.MobileUserController = MobileUserController = __decorate([
    (0, swagger_1.ApiTags)('Mobile User'),
    (0, common_1.Controller)('user'),
    __metadata("design:paramtypes", [auth_service_1.AuthService])
], MobileUserController);
//# sourceMappingURL=mobile-auth.controller.js.map