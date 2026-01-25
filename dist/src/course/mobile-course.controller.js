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
exports.MobileCourseController = void 0;
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const course_service_1 = require("./course.service");
const jwt_auth_guard_1 = require("../common/guards/jwt-auth.guard");
const current_user_decorator_1 = require("../common/decorators/current-user.decorator");
let MobileCourseController = class MobileCourseController {
    constructor(courseService) {
        this.courseService = courseService;
    }
    async getDetails(id, user) {
        const course = await this.courseService.findOne(id);
        const isEnrolled = user ? await this.courseService.checkEnrollment(course.id, user.id) : false;
        return {
            success: true,
            message: 'تم جلب تفاصيل الدورة بنجاح',
            data: {
                course: this.formatCourseDetail(course, isEnrolled),
            },
        };
    }
    async getSheikhs(id, limit, page) {
        const sheikhs = await this.courseService.findCourseSheikhs(id, page ? parseInt(page) : 1, limit ? parseInt(limit) : 10);
        return {
            success: true,
            message: 'تم جلب قائمة المشايخ بنجاح',
            data: sheikhs,
        };
    }
    async getLessons(id, user) {
        const lessons = await this.courseService.findCourseLessons(id, user.id);
        return {
            success: true,
            message: 'تم جلب الدروس بنجاح',
            data: lessons,
        };
    }
    formatCourse(course, isEnrolled = false) {
        return {
            id: course.id,
            title: course.titleAr || course.title,
            description: course.descriptionAr || course.description,
            image_url: course.image,
            category: course.category,
            enrolled_students: course._count?.enrollments || 0,
            total_lessons: course.totalLessons,
            duration_hours: course.duration,
            rating: course.rating,
            total_reviews: course.totalReviews,
            is_featured: course.isFeatured,
            is_enrolled: isEnrolled,
            sheikhs_count: course._count?.teacher || (course.teacherId ? 1 : 0),
            created_at: course.createdAt,
        };
    }
    formatCourseDetail(course, isEnrolled = false) {
        return {
            ...this.formatCourse(course, isEnrolled),
            full_description: course.fullDescriptionAr || course.fullDescription,
            intro_video_url: course.introVideoUrl,
            intro_video_thumbnail: course.introVideoThumbnail,
            total_videos: course.totalVideos,
            updated_at: course.updatedAt,
        };
    }
};
exports.MobileCourseController = MobileCourseController;
__decorate([
    (0, common_1.Get)('mobile/:id'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiOperation)({ summary: 'Get course details (Mobile)' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MobileCourseController.prototype, "getDetails", null);
__decorate([
    (0, common_1.Get)('mobile/:id/sheikhs'),
    (0, swagger_1.ApiOperation)({ summary: 'Get sheikhs for a course' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Query)('limit')),
    __param(2, (0, common_1.Query)('page')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Promise)
], MobileCourseController.prototype, "getSheikhs", null);
__decorate([
    (0, common_1.Get)('mobile/:id/lessons'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    (0, swagger_1.ApiBearerAuth)(),
    (0, swagger_1.ApiOperation)({ summary: 'Get course lessons and videos' }),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, current_user_decorator_1.CurrentUser)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], MobileCourseController.prototype, "getLessons", null);
exports.MobileCourseController = MobileCourseController = __decorate([
    (0, swagger_1.ApiTags)('Mobile Courses'),
    (0, common_1.Controller)('courses'),
    __metadata("design:paramtypes", [course_service_1.CourseService])
], MobileCourseController);
//# sourceMappingURL=mobile-course.controller.js.map