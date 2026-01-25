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
exports.CreateCertificateDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
class CreateCertificateDto {
}
exports.CreateCertificateDto = CreateCertificateDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'student-uuid' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCertificateDto.prototype, "studentId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'booking-uuid', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCertificateDto.prototype, "bookingId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'MEMORIZATION', enum: ['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA'] }),
    (0, class_validator_1.IsEnum)(['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA']),
    __metadata("design:type", String)
], CreateCertificateDto.prototype, "certificateType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'سورة البقرة', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateCertificateDto.prototype, "surahName", void 0);
//# sourceMappingURL=create-certificate.dto.js.map