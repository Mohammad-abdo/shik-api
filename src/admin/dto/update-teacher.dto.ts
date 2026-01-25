import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsBoolean, IsArray, IsEnum, IsUrl } from 'class-validator';
// ReadingType is a string in the schema, not an enum

export class UpdateTeacherDto {
  @ApiProperty({ required: false })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ example: 'محفظ للقرآن الكريم', required: false })
  @IsOptional()
  @IsString()
  bioAr?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  experience?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsArray()
  specialties?: string[];

  @ApiProperty({ example: ['تجويد', 'حفظ'], required: false })
  @IsOptional()
  @IsArray()
  specialtiesAr?: string[];

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isApproved?: boolean;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsBoolean()
  isSuspended?: boolean;

  @ApiProperty({ example: 'HAFS', required: false })
  @IsOptional()
  @IsString()
  readingType?: string;

  @ApiProperty({ example: 'حفص', required: false })
  @IsOptional()
  @IsString()
  readingTypeAr?: string;

  @ApiProperty({ example: 'https://example.com/video.mp4', required: false })
  @IsOptional()
  @IsUrl()
  introVideoUrl?: string;

  @ApiProperty({ example: ['https://example.com/cert1.pdf'], required: false })
  @IsOptional()
  @IsArray()
  certificates?: string[];

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  canIssueCertificates?: boolean;
}
