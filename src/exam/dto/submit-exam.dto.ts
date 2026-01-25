import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class AnswerDto {
  @ApiProperty({ example: 'question-uuid' })
  questionId: string;

  @ApiProperty({ example: 'Al-Fatiha' })
  answerText: string;
}

export class SubmitExamDto {
  @ApiProperty({ type: [AnswerDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnswerDto)
  answers: AnswerDto[];

  @ApiProperty({ example: 45, required: false })
  @IsOptional()
  @IsNumber()
  timeSpent?: number;
}

