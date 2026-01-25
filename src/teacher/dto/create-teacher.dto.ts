import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsArray, Min } from 'class-validator';

export class CreateTeacherDto {
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

  @ApiProperty({ example: 50.0 })
  @IsNumber()
  @Min(0)
  hourlyRate: number;

  @ApiProperty({ example: ['tajweed', 'memorization', 'recitation'] })
  @IsArray()
  @IsString({ each: true })
  specialties: string[];
}



