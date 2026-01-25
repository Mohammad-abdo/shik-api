import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsEnum, IsOptional } from 'class-validator';
import { ContentType } from '@prisma/client';

export class CreateContentDto {
  @ApiProperty({ example: 'Quran Recitation Lesson' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is a lesson about...', required: false })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ enum: ContentType, example: ContentType.VIDEO })
  @IsEnum(ContentType)
  contentType: ContentType;
}



