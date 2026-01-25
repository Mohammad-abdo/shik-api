import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsArray, IsOptional, IsUUID } from 'class-validator';

export class SendNotificationDto {
  @ApiProperty({ example: 'Important Announcement' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'This is an important message...' })
  @IsString()
  message: string;

  @ApiProperty({ example: ['user-id-1', 'user-id-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  userIds?: string[];
}



