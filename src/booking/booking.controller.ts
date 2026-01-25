import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateBookingDto } from './dto';
import { BookingStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@ApiTags('bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BookingController {
  constructor(
    private readonly bookingService: BookingService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new booking' })
  @ApiResponse({ status: 201, description: 'Booking created successfully' })
  async create(@CurrentUser() user: any, @Body() dto: CreateBookingDto) {
    return this.bookingService.create(user.id, dto);
  }

  @Get('my-bookings')
  @ApiOperation({ summary: 'Get current user bookings' })
  @ApiQuery({ name: 'status', required: false, enum: BookingStatus })
  @ApiResponse({ status: 200, description: 'Bookings retrieved successfully' })
  async getMyBookings(
    @CurrentUser() user: any,
    @Query('status') status?: BookingStatus,
  ) {
    if (user.role === 'TEACHER') {
      const teacher = await this.prisma.teacher.findUnique({
        where: { userId: user.id },
      });
      if (teacher) {
        return this.bookingService.findByTeacher(teacher.id, status);
      }
    }
    return this.bookingService.findByStudent(user.id, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get booking by ID' })
  @ApiResponse({ status: 200, description: 'Booking retrieved successfully' })
  @ApiResponse({ status: 404, description: 'Booking not found' })
  async findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingService.findOne(id, user.id, user.role);
  }

  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Confirm booking (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Booking confirmed successfully' })
  async confirm(@Param('id') id: string, @CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    if (!teacher) {
      throw new BadRequestException('Teacher profile not found');
    }
    return this.bookingService.confirm(id, teacher.id, user.id);
  }

  @Post(':id/cancel')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancel booking' })
  @ApiResponse({ status: 200, description: 'Booking cancelled successfully' })
  async cancel(@Param('id') id: string, @CurrentUser() user: any) {
    return this.bookingService.cancel(id, user.id, user.role);
  }

  @Post(':id/reject')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Reject booking (Teacher only)' })
  @ApiResponse({ status: 200, description: 'Booking rejected successfully' })
  async reject(@Param('id') id: string, @CurrentUser() user: any) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: user.id },
    });
    if (!teacher) {
      throw new BadRequestException('Teacher profile not found');
    }
    return this.bookingService.reject(id, teacher.id, user.id);
  }
}

