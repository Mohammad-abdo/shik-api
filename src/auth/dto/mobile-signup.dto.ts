import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Gender } from '@prisma/client';

export class MobileSignUpDto {
    @ApiProperty({ example: 'student', enum: ['student', 'sheikh'] })
    @IsEnum(['student', 'sheikh'])
    user_type: 'student' | 'sheikh';

    @ApiProperty({ example: 'محمد أحمد علي' })
    @IsString()
    @MinLength(3)
    name: string;

    @ApiProperty({ example: 15 })
    @IsNumber()
    @Min(5)
    @Max(100)
    age: number;

    @ApiProperty({ example: 'male', enum: ['male', 'female'] })
    @IsEnum(['male', 'female'])
    gender: 'male' | 'female';

    @ApiProperty({ example: 5 })
    @IsNumber()
    @Min(0)
    @Max(30)
    memorized_parts: number;

    @ApiProperty({ example: 'mohamed@example.com' })
    @IsEmail()
    email: string;

    @ApiProperty({ example: 'Mohamed123', minLength: 8 })
    @IsString()
    @MinLength(8)
    password: string;

    @ApiProperty({ example: '+201234567890' })
    @IsString()
    student_phone: string;

    @ApiProperty({ example: '+201987654321' })
    @IsString()
    parent_phone: string;

    @ApiProperty({ type: 'string', format: 'binary', required: false })
    @IsOptional()
    profile_image?: any;
}
