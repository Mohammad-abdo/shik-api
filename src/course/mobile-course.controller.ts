import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CourseService } from './course.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Mobile Courses')
@Controller('courses')
export class MobileCourseController {
    constructor(private readonly courseService: CourseService) { }

    @Get('mobile/:id')
    @UseGuards(JwtAuthGuard)
    @ApiOperation({ summary: 'Get course details (Mobile)' })
    async getDetails(@Param('id') id: string, @CurrentUser() user?: any) {
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

    @Get('mobile/:id/sheikhs')
    @ApiOperation({ summary: 'Get sheikhs for a course' })
    async getSheikhs(
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        const sheikhs = await this.courseService.findCourseSheikhs(
            id,
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
        );
        return {
            success: true,
            message: 'تم جلب قائمة المشايخ بنجاح',
            data: sheikhs,
        };
    }

    @Get('mobile/:id/lessons')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get course lessons and videos' })
    async getLessons(@Param('id') id: string, @CurrentUser() user: any) {
        const lessons = await this.courseService.findCourseLessons(id, user.id);
        return {
            success: true,
            message: 'تم جلب الدروس بنجاح',
            data: lessons,
        };
    }

    private formatCourse(course: any, isEnrolled: boolean = false) {
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

    private formatCourseDetail(course: any, isEnrolled: boolean = false) {
        return {
            ...this.formatCourse(course, isEnrolled),
            full_description: course.fullDescriptionAr || course.fullDescription,
            intro_video_url: course.introVideoUrl,
            intro_video_thumbnail: course.introVideoThumbnail,
            total_videos: course.totalVideos,
            updated_at: course.updatedAt,
        };
    }
}
