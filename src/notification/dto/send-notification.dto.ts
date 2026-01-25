import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsArray, IsEnum } from 'class-validator';
import { NotificationType } from '@prisma/client';

export enum NotificationChannel {
  EMAIL = 'EMAIL',
  SMS = 'SMS',
  PUSH = 'PUSH',
  IN_APP = 'IN_APP',
}

export class SendNotificationDto {
  @ApiProperty({ example: 'user-uuid', required: false })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiProperty({ example: ['user-uuid-1', 'user-uuid-2'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  userIds?: string[];

  @ApiProperty({ enum: NotificationType, example: 'BOOKING_CONFIRMED' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'تم تأكيد الحجز' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'تم تأكيد حجزك بنجاح' })
  @IsString()
  message: string;

  @ApiProperty({ example: { bookingId: 'uuid' }, required: false })
  @IsOptional()
  data?: any;

  @ApiProperty({ enum: NotificationChannel, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];
}

export class BroadcastNotificationDto {
  @ApiProperty({ enum: NotificationType, example: 'BOOKING_CONFIRMED' })
  @IsEnum(NotificationType)
  type: NotificationType;

  @ApiProperty({ example: 'إعلان عام' })
  @IsString()
  title: string;

  @ApiProperty({ example: 'رسالة إعلانية لجميع المستخدمين' })
  @IsString()
  message: string;

  @ApiProperty({ example: { key: 'value' }, required: false })
  @IsOptional()
  data?: any;

  @ApiProperty({ enum: NotificationChannel, isArray: true, required: false })
  @IsOptional()
  @IsArray()
  @IsEnum(NotificationChannel, { each: true })
  channels?: NotificationChannel[];

  @ApiProperty({ example: ['STUDENT', 'TEACHER'], required: false })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  roles?: string[];
}

