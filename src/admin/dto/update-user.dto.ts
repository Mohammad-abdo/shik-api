import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRoleEnum as UserRole, UserStatus } from '@prisma/client';

export class UpdateUserDto {
  @ApiProperty({ example: 'ahmed@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: 'Ahmed', required: false })
  @IsOptional()
  @IsString()
  firstName?: string;

  @ApiProperty({ example: 'أحمد', required: false })
  @IsOptional()
  @IsString()
  firstNameAr?: string;

  @ApiProperty({ example: 'Mohamed', required: false })
  @IsOptional()
  @IsString()
  lastName?: string;

  @ApiProperty({ example: 'محمد', required: false })
  @IsOptional()
  @IsString()
  lastNameAr?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, required: false })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ enum: UserStatus, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: ['role-id-1', 'role-id-2'], required: false })
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}
