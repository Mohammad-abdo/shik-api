import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, Min } from 'class-validator';

export class CreatePayoutRequestDto {
  @ApiProperty({ example: 100.0 })
  @IsNumber()
  @Min(1)
  amount: number;
}



