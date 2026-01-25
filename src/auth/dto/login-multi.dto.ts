import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEmail, IsEnum } from 'class-validator';

export enum LoginMethod {
  EMAIL_PASSWORD = 'EMAIL_PASSWORD',
  PHONE_PASSWORD = 'PHONE_PASSWORD',
  PHONE_OTP = 'PHONE_OTP',
  EMAIL_OTP = 'EMAIL_OTP',
  GOOGLE = 'GOOGLE',
}

export class LoginMultiDto {
  @ApiProperty({ enum: LoginMethod, example: 'EMAIL_PASSWORD' })
  @IsEnum(LoginMethod)
  method: LoginMethod;

  @ApiProperty({ example: 'user@example.com', required: false })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @IsOptional()
  @IsString()
  phone?: string;

  @ApiProperty({ example: 'password123', required: false })
  @IsOptional()
  @IsString()
  password?: string;

  @ApiProperty({ example: '123456', required: false })
  @IsOptional()
  @IsString()
  otp?: string;

  @ApiProperty({ example: 'google_token', required: false })
  @IsOptional()
  @IsString()
  googleToken?: string;
}

