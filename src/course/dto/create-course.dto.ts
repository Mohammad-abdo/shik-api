import { IsString, IsOptional, IsNumber, IsEnum, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CourseStatus } from '@prisma/client';

export class CreateCourseDto {
  @ApiProperty({ description: 'Course title' })
  @IsString()
  title: string;

  @ApiPropertyOptional({ description: 'Course title in Arabic' })
  @IsOptional()
  @IsString()
  titleAr?: string;

  @ApiPropertyOptional({ description: 'Course description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Course description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiPropertyOptional({ description: 'Teacher ID to assign the course to' })
  @IsOptional()
  @IsString()
  teacherId?: string;

  @ApiProperty({ description: 'Course price', default: 0 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Course duration in hours' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  duration?: number;

  @ApiPropertyOptional({ description: 'Course image URL' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ description: 'Intro video URL for the course' })
  @IsOptional()
  @IsString()
  introVideoUrl?: string;

  @ApiPropertyOptional({ description: 'Intro video thumbnail URL' })
  @IsOptional()
  @IsString()
  introVideoThumbnail?: string;

  @ApiPropertyOptional({ description: 'Course status', enum: CourseStatus, default: CourseStatus.DRAFT })
  @IsOptional()
  @IsEnum(CourseStatus)
  status?: CourseStatus;
}

