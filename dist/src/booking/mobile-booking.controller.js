"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.MobileBookingController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const booking_service_1 = require("./booking.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let MobileBookingController = class MobileBookingController {
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async create(user, dto) {
        const booking = await this.bookingService.create(user.id, {
            teacherId: dto.sheikh_id,
            date: dto.booking_date,
            startTime: dto.booking_time,
            duration: dto.duration_minutes / 60,
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
                    sheikh_name: '',
                    sheikh_phone: '',
                    booking_date: dto.booking_date,
                    booking_time: dto.booking_time,
                    duration_minutes: dto.duration_minutes,
                    session_type: dto.session_type,
                    status: booking.status.toLowerCase(),
                    price: booking.price,
                    notes: booking.notes,
                    meeting_link: booking.meetingLink || null,
                    created_at: booking.createdAt,
                    updated_at: booking.updatedAt,
                }
            }
        };
    }
};
exports.MobileBookingController = MobileBookingController;
__decorate([
    (0, common_1.Post)(),
    (0, swagger_1.ApiOperation)({ summary: 'Create a new booking (Mobile)' }),
    (0, swagger_1.ApiResponse)({ status: 201, description: 'Booking created successfully' }),
    __param(0, (0, current_user_decorator_1.CurrentUser)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], MobileBookingController.prototype, "create", null);
exports.MobileBookingController = MobileBookingController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Bookings'),
    (0, common_1.Controller)('bookings'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], MobileBookingController);
//# sourceMappingURL=mobile-booking.controller.js.map