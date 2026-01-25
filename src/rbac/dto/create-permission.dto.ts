import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class CreatePermissionDto {
  @ApiProperty({ example: 'users.read' })
  @IsString()
  name: string;

  @ApiProperty({ example: 'Read users', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ example: 'users' })
  @IsString()
  resource: string;

  @ApiProperty({ example: 'read' })
  @IsString()
  action: string;
}



