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
exports.MobileSignUpDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class MobileSignUpDto {
}
exports.MobileSignUpDto = MobileSignUpDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'student', enum: ['student', 'sheikh'] }),
    (0, class_validator_1.IsEnum)(['student', 'sheikh']),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "user_type", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'محمد أحمد علي' }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(3),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 15 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(5),
    (0, class_validator_1.Max)(100),
    __metadata("design:type", Number)
], MobileSignUpDto.prototype, "age", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'male', enum: ['male', 'female'] }),
    (0, class_validator_1.IsEnum)(['male', 'female']),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "gender", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 5 }),
    (0, class_validator_1.IsNumber)(),
    (0, class_validator_1.Min)(0),
    (0, class_validator_1.Max)(30),
    __metadata("design:type", Number)
], MobileSignUpDto.prototype, "memorized_parts", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'mohamed@example.com' }),
    (0, class_validator_1.IsEmail)(),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Mohamed123', minLength: 8 }),
    (0, class_validator_1.IsString)(),
    (0, class_validator_1.MinLength)(8),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+201234567890' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "student_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: '+201987654321' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], MobileSignUpDto.prototype, "parent_phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ type: 'string', format: 'binary', required: false }),
    (0, class_validator_1.IsOptional)(),
    __metadata("design:type", Object)
], MobileSignUpDto.prototype, "profile_image", void 0);
//# sourceMappingURL=mobile-signup.dto.js.map