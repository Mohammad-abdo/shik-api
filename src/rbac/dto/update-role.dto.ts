import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdateRoleDto {
  @ApiProperty({ example: 'SUPPORT_ADMIN', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Support admin role', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

