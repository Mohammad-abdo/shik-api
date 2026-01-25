import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';

export enum ForgotPasswordMethod {
  EMAIL = 'EMAIL',
  PHONE = 'PHONE',
}

export class ForgotPasswordDto {
  @ApiProperty({ enum: ForgotPasswordMethod, example: 'EMAIL' })
  @IsEnum(ForgotPasswordMethod)
  method: ForgotPasswordMethod;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;
}

export class ResetPasswordDto {
  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  otp: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  newPassword: string;

  @ApiProperty({ example: 'newPassword123' })
  @IsString()
  confirmPassword: string;
}

