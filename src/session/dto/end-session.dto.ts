import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';

export class EndSessionDto {
  @ApiProperty({ example: 'https://example.com/recording.mp4', required: false })
  @IsOptional()
  @IsString()
  recordingUrl?: string;
}



