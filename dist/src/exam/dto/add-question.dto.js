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
exports.AddQuestionDto = exports.QuestionType = void 0;
const swagger_1 = require("@nestjs/swagger");
const class_validator_1 = require("class-validator");
var QuestionType;
(function (QuestionType) {
    QuestionType["MCQ"] = "MCQ";
    QuestionType["TRUE_FALSE"] = "TRUE_FALSE";
    QuestionType["WRITTEN"] = "WRITTEN";
})(QuestionType || (exports.QuestionType = QuestionType = {}));
class AddQuestionDto {
}
exports.AddQuestionDto = AddQuestionDto;
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'What is the first surah of the Quran?' }),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddQuestionDto.prototype, "questionText", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ enum: QuestionType, example: 'MCQ' }),
    (0, class_validator_1.IsEnum)(QuestionType),
    __metadata("design:type", String)
], AddQuestionDto.prototype, "questionType", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 10 }),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], AddQuestionDto.prototype, "marks", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran'], required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsArray)(),
    (0, class_validator_1.IsString)({ each: true }),
    __metadata("design:type", Array)
], AddQuestionDto.prototype, "options", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ example: 'Al-Fatiha', required: false }),
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], AddQuestionDto.prototype, "correctAnswer", void 0);
//# sourceMappingURL=add-question.dto.js.map