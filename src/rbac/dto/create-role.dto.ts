import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreateRoleDto {
  @ApiProperty({ example: 'SUPER_ADMIN' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Super administrator with all permissions', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}



