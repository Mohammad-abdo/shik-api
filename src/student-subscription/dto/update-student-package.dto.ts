import { PartialType } from '@nestjs/swagger';
import { CreateStudentPackageDto } from './create-student-package.dto';

export class UpdateStudentPackageDto extends PartialType(CreateStudentPackageDto) {}

