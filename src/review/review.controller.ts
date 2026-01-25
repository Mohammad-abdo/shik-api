import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReviewService } from './review.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateReviewDto } from './dto';

@ApiTags('reviews')
@Controller('reviews')
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  @Post('bookings/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create review for booking' })
  @ApiResponse({ status: 201, description: 'Review created successfully' })
  async create(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.create(bookingId, user.id, dto);
  }

  @Get('teachers/:teacherId')
  @ApiOperation({ summary: 'Get reviews by teacher ID' })
  @ApiResponse({ status: 200, description: 'Reviews retrieved successfully' })
  async findByTeacher(@Param('teacherId') teacherId: string) {
    return this.reviewService.findByTeacher(teacherId);
  }

  @Put('bookings/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update review' })
  @ApiResponse({ status: 200, description: 'Review updated successfully' })
  async update(
    @Param('bookingId') bookingId: string,
    @CurrentUser() user: any,
    @Body() dto: CreateReviewDto,
  ) {
    return this.reviewService.update(bookingId, user.id, dto);
  }

  @Delete('bookings/:bookingId')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete review' })
  @ApiResponse({ status: 200, description: 'Review deleted successfully' })
  async delete(@Param('bookingId') bookingId: string, @CurrentUser() user: any) {
    return this.reviewService.delete(bookingId, user.id);
  }
}



