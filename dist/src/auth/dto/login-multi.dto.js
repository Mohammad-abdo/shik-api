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
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoginMultiDto = exports.LoginMethod = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var LoginMethod;
(function (LoginMethod) {
    LoginMethod["EMAIL_PASSWORD"] = "EMAIL_PASSWORD";
    LoginMethod["PHONE_PASSWORD"] = "PHONE_PASSWORD";
    LoginMethod["PHONE_OTP"] = "PHONE_OTP";
    LoginMethod["EMAIL_OTP"] = "EMAIL_OTP";
    LoginMethod["GOOGLE"] = "GOOGLE";
})(LoginMethod || (exports.LoginMethod = LoginMethod = {}));
class LoginMultiDto {
}
exports.LoginMultiDto = LoginMultiDto;
__decorate([
    (0, swagger_1.ApiProperty)({ enum: LoginMethod, example: 'EMAIL_PASSWORD' }),
    (0, class_validator_1.IsEnum)(LoginMethod),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "method", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'user@example.com', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+201234567890', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'password123', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '123456', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "otp", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'google_token', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], LoginMultiDto.prototype, "googleToken", void 0);
//# sourceMappingURL=login-multi.dto.js.map