import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { SessionType } from '@prisma/client';

export class CreateSessionDto {
  @ApiProperty({ enum: SessionType, required: false, default: SessionType.VIDEO })
  @IsOptional()
  @IsEnum(SessionType)
  type?: SessionType;

  userId: string; // Injected from CurrentUser
}



