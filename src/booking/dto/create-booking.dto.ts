import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsUUID, IsInt, IsOptional, IsNumber, Min, Matches } from 'class-validator';

export class CreateBookingDto {
  @ApiProperty({ example: 'uuid-of-teacher' })
  @IsUUID()
  teacherId: string;

  @ApiProperty({ example: '2024-12-25T10:00:00Z' })
  @IsString()
  date: string;

  @ApiProperty({ example: '10:00', description: 'HH:mm format' })
  @IsString()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
    message: 'startTime must be in HH:mm format',
  })
  startTime: string;

  @ApiProperty({ example: 1, description: 'Duration in hours' })
  @IsInt()
  @Min(1)
  duration: number;

  @ApiProperty({ example: 0, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discount?: number;

  @ApiProperty({ example: 'Special notes...', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}



