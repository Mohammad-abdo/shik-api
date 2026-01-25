import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { VideoService } from './video.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('video')
@Controller('video')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class VideoController {
  constructor(private readonly videoService: VideoService) {}

  @Post('session/create')
  @ApiOperation({ summary: 'Create a video session for a booking' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async createSession(
    @Body('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.videoService.createSession(bookingId, user.id);
  }

  @Get('session/token/:bookingId')
  @ApiOperation({ summary: 'Get Agora token for joining session' })
  @ApiResponse({ status: 200, description: 'Token retrieved successfully' })
  async getSessionToken(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.videoService.getSessionToken(bookingId, user.id);
  }

  @Post('session/end')
  @ApiOperation({ summary: 'End a video session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async endSession(
    @Body('bookingId') bookingId: string,
    @CurrentUser() user: any,
  ) {
    return this.videoService.endSession(bookingId, user.id);
  }

  @Get('session/history')
  @ApiOperation({ summary: 'Get session history' })
  @ApiResponse({ status: 200, description: 'Session history retrieved successfully' })
  async getSessionHistory(@CurrentUser() user: any) {
    return this.videoService.getSessionHistory(user.id);
  }
}

