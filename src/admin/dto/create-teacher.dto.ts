import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNumber,
  MinLength,
  Min,
  IsArray,
  IsBoolean,
} from 'class-validator';
// ReadingType enum values
export type ReadingType =
  | 'HAFS'
  | 'WARSH'
  | 'QALOON'
  | 'IBN_KATHIR'
  | 'ABU_AMR'
  | 'IBN_AMER'
  | 'ASIM'
  | 'HAMZA'
  | 'AL_KISAI'
  | 'YAQUB';

export class CreateTeacherDto {
  // User fields
  @ApiProperty({ example: 'teacher@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  firstName: string;

  @ApiPropertyOptional({ example: 'أحمد' })
  @IsOptional()
  @IsString()
  firstNameAr?: string;

  @ApiProperty({ example: 'Mohamed' })
  @IsString()
  lastName: string;

  @ApiPropertyOptional({ example: 'محمد' })
  @IsOptional()
  @IsString()
  lastNameAr?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiPropertyOptional({ example: '+201234567890' })
  @IsOptional()
  @IsString()
  phone?: string;

  // Teacher profile fields
  @ApiPropertyOptional({ example: 'Experienced Quran teacher' })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiPropertyOptional({ example: 'معلم قرآن ذو خبرة' })
  @IsOptional()
  @IsString()
  bioAr?: string;

  @ApiPropertyOptional({ example: 'https://example.com/image.jpg' })
  @IsOptional()
  @IsString()
  image?: string;

  @ApiPropertyOptional({ example: 5, description: 'Years of experience' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  experience?: number;

  @ApiPropertyOptional({ example: 50.0, description: 'Hourly rate' })
  @IsOptional()
  @IsNumber()
  @Min(0)
  hourlyRate?: number;

  @ApiPropertyOptional({ example: ['Tajweed', 'Memorization'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiPropertyOptional({ example: ['تجويد', 'حفظ'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialtiesAr?: string[];

  @ApiPropertyOptional({ 
    enum: ['HAFS', 'WARSH', 'QALOON', 'IBN_KATHIR', 'ABU_AMR', 'IBN_AMER', 'ASIM', 'HAMZA', 'AL_KISAI', 'YAQUB'],
    example: 'HAFS'
  })
  @IsOptional()
  @IsString()
  readingType?: ReadingType;

  @ApiPropertyOptional({ example: 'حفص' })
  @IsOptional()
  @IsString()
  readingTypeAr?: string;

  @ApiPropertyOptional({ example: 'https://example.com/video.mp4' })
  @IsOptional()
  @IsString()
  introVideoUrl?: string;

  @ApiPropertyOptional({ example: ['Certificate 1', 'Certificate 2'], type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  certificates?: string[];

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  canIssueCertificates?: boolean;

  @ApiPropertyOptional({ example: true, default: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;
}

