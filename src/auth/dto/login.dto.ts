import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, IsOptional, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export class LoginDto {
  @ApiProperty({ example: 'ahmed@example.com' })
  @IsEmail()
  @Transform(({ value }) => value?.trim().toLowerCase())
  email: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  password: string;

  @ApiProperty({ example: 'student', enum: ['student', 'sheikh', 'teacher'], required: false })
  @IsOptional()
  @IsEnum(['student', 'sheikh', 'teacher'])
  user_type?: 'student' | 'sheikh' | 'teacher';
}



