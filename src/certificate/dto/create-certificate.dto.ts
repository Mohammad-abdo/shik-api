import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum } from 'class-validator';

export class CreateCertificateDto {
  @ApiProperty({ example: 'student-uuid' })
  @IsString()
  studentId: string;

  @ApiProperty({ example: 'booking-uuid', required: false })
  @IsOptional()
  @IsString()
  bookingId?: string;

  @ApiProperty({ example: 'MEMORIZATION', enum: ['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA'] })
  @IsEnum(['MEMORIZATION', 'RECITATION', 'TAJWEED', 'IJAZA'])
  certificateType: string;

  @ApiProperty({ example: 'سورة البقرة', required: false })
  @IsOptional()
  @IsString()
  surahName?: string;
}

