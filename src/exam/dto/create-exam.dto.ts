import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsNumber, IsEnum, IsDateString } from 'class-validator';

export enum ExamStatus {
  DRAFT = 'DRAFT',
  PUBLISHED = 'PUBLISHED',
  CLOSED = 'CLOSED',
}

export class CreateExamDto {
  @ApiProperty({ example: 'Quran Memorization Test' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'Test your memorization skills', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 60 })
  @IsNumber()
  duration: number;

  @ApiProperty({ example: 100, required: false })
  @IsOptional()
  @IsNumber()
  totalMarks?: number;

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  passingMarks?: number;

  @ApiProperty({ enum: ExamStatus, required: false })
  @IsOptional()
  @IsEnum(ExamStatus)
  status?: ExamStatus;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiProperty({ required: false })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

