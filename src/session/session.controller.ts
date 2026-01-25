import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { SessionService } from './session.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateSessionDto, EndSessionDto } from './dto';

@ApiTags('sessions')
@Controller('sessions')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class SessionController {
  constructor(private readonly sessionService: SessionService) {}

  @Post('bookings/:bookingId')
  @ApiOperation({ summary: 'Create session for booking' })
  @ApiResponse({ status: 201, description: 'Session created successfully' })
  async create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateSessionDto,
  ) {
    return this.sessionService.create(bookingId, { ...dto, userId: user.id });
  }

  @Get('bookings/:bookingId')
  @ApiOperation({ summary: 'Get session by booking ID' })
  @ApiResponse({ status: 200, description: 'Session retrieved successfully' })
  async getSession(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.sessionService.getSession(bookingId, user.id);
  }

  @Post('bookings/:bookingId/start')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Start session' })
  @ApiResponse({ status: 200, description: 'Session started successfully' })
  async startSession(@Param('bookingId') bookingId: string) {
    return this.sessionService.startSession(bookingId);
  }

  @Post('bookings/:bookingId/end')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'End session' })
  @ApiResponse({ status: 200, description: 'Session ended successfully' })
  async endSession(@Param('bookingId') bookingId: string, @Body() dto: EndSessionDto) {
    return this.sessionService.endSession(bookingId, dto.recordingUrl);
  }
}



