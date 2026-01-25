import { Controller, Post, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { BookingService } from './booking.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Mobile Bookings')
@Controller('bookings')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class MobileBookingController {
    constructor(private readonly bookingService: BookingService) { }

    @Post()
    @ApiOperation({ summary: 'Create a new booking (Mobile)' })
    @ApiResponse({ status: 201, description: 'Booking created successfully' })
    async create(@CurrentUser() user: any, @Body() dto: any) {
        // Map mobile fields to backend service/DTO
        // spec: sheikh_id, booking_date, booking_time, duration_minutes, session_type
        const booking = await this.bookingService.create(user.id, {
            teacherId: dto.sheikh_id,
            date: dto.booking_date,
            startTime: dto.booking_time,
            duration: dto.duration_minutes / 60, // Convert minutes to hours
            notes: dto.notes,
        });

        return {
            success: true,
            message: 'تم حجز الجلسة بنجاح',
            data: {
                booking: {
                    id: booking.id,
                    student_id: user.id || user.sub,
                    student_name: `${user.firstName} ${user.lastName}`.trim(),
                    sheikh_id: booking.teacherId,
                    sheikh_name: '', // In a real app, populate this
                    sheikh_phone: '', // In a real app, populate this
                    booking_date: dto.booking_date,
                    booking_time: dto.booking_time,
                    duration_minutes: dto.duration_minutes,
                    session_type: dto.session_type,
                    status: booking.status.toLowerCase(),
                    price: booking.price,
                    notes: booking.notes,
                    meeting_link: (booking as any).meetingLink || null,
                    created_at: booking.createdAt,
                    updated_at: booking.updatedAt,
                }
            }
        };
    }
}
