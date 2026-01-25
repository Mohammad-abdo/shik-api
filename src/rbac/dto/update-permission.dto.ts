import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class UpdatePermissionDto {
  @ApiProperty({ example: 'users.read', required: false })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiProperty({ example: 'Read users permission', required: false })
  @IsOptional()
  @IsString()
  description?: string;
}

