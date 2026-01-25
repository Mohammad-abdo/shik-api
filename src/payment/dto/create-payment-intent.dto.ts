import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePaymentIntentDto {
  @ApiProperty({ example: 'stripe', required: false })
  @IsOptional()
  @IsString()
  paymentMethod?: string;
}



