import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsArray, IsNumber } from 'class-validator';
import { UserRoleEnum as UserRole } from '@prisma/client';

export class SignUpDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'Ahmed' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'Mohamed' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'password123', minLength: 6 })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: UserRole, required: false, default: UserRole.STUDENT })
  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @ApiProperty({ example: 'student', enum: ['student', 'sheikh', 'teacher'], required: false })
  @IsOptional()
  @IsEnum(['student', 'sheikh', 'teacher'])
  user_type?: 'student' | 'sheikh' | 'teacher';

  @ApiProperty({ example: ['tajweed', 'memorization'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  specialties?: string[];

  @ApiProperty({ example: 50, required: false })
  @IsOptional()
  @IsNumber()
  hourlyRate?: number;
}



