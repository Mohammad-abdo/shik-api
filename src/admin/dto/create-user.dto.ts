import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum, MinLength } from 'class-validator';
import { UserRoleEnum as UserRole, UserStatus } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'أحمد', required: false })
  @IsOptional()
  @IsString()
  firstNameAr?: string;

  @ApiProperty({ example: 'Mohamed' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'محمد', required: false })
  @IsOptional()
  @IsString()
  lastNameAr?: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ enum: UserRole, example: UserRole.STUDENT })
  @IsEnum(UserRole)
  role: UserRole;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE, required: false })
  @IsOptional()
  @IsEnum(UserStatus)
  status?: UserStatus;

  @ApiProperty({ example: ['role-id-1', 'role-id-2'], required: false })
  @IsOptional()
  @IsString({ each: true })
  roleIds?: string[];
}

