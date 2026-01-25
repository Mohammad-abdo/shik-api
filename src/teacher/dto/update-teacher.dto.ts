import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';

export class UpdateTeacherDto {
  @ApiProperty({ example: 'Experienced Quran teacher...', required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'https://example.com/image.jpg', required: false })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiProperty({ example: 5, required: false })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @ApiProperty({ example: 50.0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiProperty({ example: ['tajweed', 'memorization'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];
}



