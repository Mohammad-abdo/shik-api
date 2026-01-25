import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class RejectPayoutDto {
  @ApiProperty({ example: 'Insufficient documentation' })
  @IsString()
  @MinLength(5)
  reason: string;
}



