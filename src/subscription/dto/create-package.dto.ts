import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreatePackageDto {
  @ApiProperty({ description: 'Package name' })
  @IsString()
  name: string;

  @ApiPropertyOptional({ description: 'Package name in Arabic' })
  @IsOptional()
  @IsString()
  nameAr?: string;

  @ApiPropertyOptional({ description: 'Package description' })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({ description: 'Package description in Arabic' })
  @IsOptional()
  @IsString()
  descriptionAr?: string;

  @ApiProperty({ description: 'Package price per month' })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Duration in days', default: 30 })
  @IsOptional()
  @IsNumber()
  @Min(1)
  duration?: number;

  @ApiPropertyOptional({ description: 'Features list (JSON array)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  features?: string[];

  @ApiPropertyOptional({ description: 'Features list in Arabic (JSON array)', type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  featuresAr?: string[];

  @ApiPropertyOptional({ description: 'Maximum number of students' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxStudents?: number;

  @ApiPropertyOptional({ description: 'Maximum number of courses' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  maxCourses?: number;

  @ApiPropertyOptional({ description: 'Is package active', default: true })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Is popular package', default: false })
  @IsOptional()
  @IsBoolean()
  isPopular?: boolean;
}

