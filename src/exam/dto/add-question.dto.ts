import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNumber, IsEnum, IsOptional, IsArray } from 'class-validator';

export enum QuestionType {
  MCQ = 'MCQ',
  TRUE_FALSE = 'TRUE_FALSE',
  WRITTEN = 'WRITTEN',
}

export class AddQuestionDto {
  @ApiProperty({ example: 'What is the first surah of the Quran?' })
  @IsString()
  questionText: string;

  @ApiProperty({ enum: QuestionType, example: 'MCQ' })
  @IsEnum(QuestionType)
  questionType: QuestionType;

  @ApiProperty({ example: 10 })
  @IsNumber()
  marks: number;

  @ApiProperty({ example: ['Al-Fatiha', 'Al-Baqarah', 'Al-Imran'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  options?: string[];

  @ApiProperty({ example: 'Al-Fatiha', required: false })
  @IsOptional()
  @IsString()
  correctAnswer?: string;
}

