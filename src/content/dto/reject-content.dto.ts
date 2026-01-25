import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsBoolean, MinLength } from 'class-validator';

export class RejectContentDto {
  @ApiProperty({ example: 'Content violates community guidelines' })
  @IsString()
  @MinLength(5)
  reason: string;

  @ApiProperty({ example: false, required: false })
  @IsOptional()
  @IsBoolean()
  deleteFile?: boolean;
}



