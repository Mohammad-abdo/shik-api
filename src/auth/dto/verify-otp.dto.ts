import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEmail, ValidateIf } from 'class-validator';

export class VerifyOtpDto {
  @ApiProperty({ example: 'ahmed@example.com', required: false })
  @ValidateIf((o) => !o.phone)
  @IsEmail()
  email?: string;

  @ApiProperty({ example: '+201234567890', required: false })
  @ValidateIf((o) => !o.email)
  @IsString()
  phone?: string;

  @ApiProperty({ example: '123456' })
  @IsString()
  code: string;
}



