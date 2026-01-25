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
exports.MobileTeacherController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const teacher_service_1 = require("./teacher.service");
const course_service_1 = require("../course/course.service");
let MobileTeacherController = class MobileTeacherController {
    constructor(teacherService, courseService) {
        this.teacherService = teacherService;
        this.courseService = courseService;
    }
    async getDetails(id) {
        const sheikh = await this.teacherService.findOne(id);
        return {
            success: true,
            message: 'تم جلب بيانات الشيخ بنجاح',
            data: {
                sheikh: this.formatSheikhDetail(sheikh),
            },
        };
    }
    async getCourses(id, limit, page) {
        const result = await this.courseService.findAll(page ? parseInt(page) : 1, limit ? parseInt(limit) : 10, 'PUBLISHED', id);
        const sheikh = await this.teacherService.findOne(id);
        return {
            success: true,
            message: 'تم جلب دورات الشيخ بنجاح',
            data: {
                sheikh: {
                    id: sheikh.id,
                    name: `${sheikh.user.firstName} ${sheikh.user.lastName}`.trim(),
                    profile_image_url: sheikh.image,
                },
                courses: result.courses.map(c => ({
                    id: c.id,
                    title: c.titleAr || c.title,
                    description: c.descriptionAr || c.description,
                    image_url: c.image,
                    category: c.category,
                    enrolled_students: c._count?.enrollments || 0,
                    total_lessons: c.totalLessons,
                    rating: c.rating,
                    total_reviews: c.totalReviews,
                    is_featured: c.isFeatured,
                    created_at: c.createdAt,
                })),
                pagination: result.pagination,
            },
        };
    }
    formatSheikhDetail(sheikh) {
        const schedule = {
            saturday: [], sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
        };
        if (sheikh.schedules) {
            sheikh.schedules.forEach((s) => {
                const day = s.dayOfWeek.toLowerCase();
                if (schedule[day]) {
                    schedule[day].push(`${s.startTime}-${s.endTime}`);
                }
            });
        }
        return {
            id: sheikh.id,
            name: `${sheikh.user.firstName} ${sheikh.user.lastName}`.trim(),
            email: sheikh.user.email,
            age: sheikh.user.age,
            gender: sheikh.user.gender?.toLowerCase(),
            profile_image_url: sheikh.image,
            intro_video_url: sheikh.introVideoUrl,
            intro_video_thumbnail: sheikh.introVideoThumbnail,
            specialization: sheikh.specialtiesAr || sheikh.specialties,
            bio: sheikh.bioAr || sheikh.bio,
            full_bio: sheikh.fullBioAr || sheikh.fullBio,
            qualifications: sheikh.certificates ? (typeof sheikh.certificates === 'string' ? JSON.parse(sheikh.certificates) : sheikh.certificates) : [],
            rating: sheikh.rating,
            total_reviews: sheikh.totalReviews,
            total_students: 0,
            total_courses: sheikh._count?.courses || 0,
            memorized_parts: sheikh.user.memorized_parts,
            years_of_experience: sheikh.experience,
            is_available: true,
            session_price: sheikh.hourlyRate,
            availability_schedule: schedule,
            phone: sheikh.user.phone,
            created_at: sheikh.createdAt,
            updated_at: sheikh.updatedAt,
        };
    }
};
exports.MobileTeacherController = MobileTeacherController;
__decorate([
    (0, common_1.Get)(':id'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sheikh details' }),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], MobileTeacherController.prototype, "getDetails", null);
__decorate([
    (0, common_1.Get)(':id/courses'),
    (0, swagger_1.ApiOperation)({ summary: 'Get courses by sheikh' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MobileTeacherController.prototype, "getCourses", null);
exports.MobileTeacherController = MobileTeacherController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Sheikhs'),
    (0, common_1.Controller)('sheikhs'),
    __metadata("design:paramtypes", [teacher_service_1.TeacherService,
        course_service_1.CourseService])
], MobileTeacherController);
//# sourceMappingURL=mobile-teacher.controller.js.map