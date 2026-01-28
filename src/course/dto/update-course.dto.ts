import { PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateCourseDto } from './create-course.dto';
import { IsOptional, IsArray, IsString } from 'class-validator';

export class UpdateCourseDto extends PartialType(CreateCourseDto) {
  @ApiPropertyOptional({ description: 'List of teacher IDs for the course', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  teacherIds?: string[];
}

