import { BookingService } from './booking.service';
export declare class MobileBookingController {
    private readonly bookingService;
    constructor(bookingService: BookingService);
    create(user: any, dto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            booking: {
                id: string;
                student_id: any;
                student_name: string;
                sheikh_id: string;
                sheikh_name: string;
                sheikh_phone: string;
                booking_date: any;
                booking_time: any;
                duration_minutes: any;
                session_type: any;
                status: string;
                price: number;
                notes: string;
                meeting_link: any;
                created_at: Date;
                updated_at: Date;
            };
        };
    }>;
}
