import { IsString, IsBoolean, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class SubscribeStudentDto {
  @ApiProperty({ description: 'Package ID' })
  @IsString()
  packageId: string;

  @ApiPropertyOptional({ description: 'Auto renew subscription', default: false })
  @IsOptional()
  @IsBoolean()
  autoRenew?: boolean;
}

