"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStudentPackageDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_student_package_dto_1 = require("./create-student-package.dto");
class UpdateStudentPackageDto extends (0, swagger_1.PartialType)(create_student_package_dto_1.CreateStudentPackageDto) {
}
exports.UpdateStudentPackageDto = UpdateStudentPackageDto;
//# sourceMappingURL=update-student-package.dto.js.map