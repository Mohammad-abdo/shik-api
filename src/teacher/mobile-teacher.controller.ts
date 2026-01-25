import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { TeacherService } from './teacher.service';
import { CourseService } from '../course/course.service';

@ApiTags('Mobile Sheikhs')
@Controller('sheikhs')
export class MobileTeacherController {
    constructor(
        private readonly teacherService: TeacherService,
        private readonly courseService: CourseService,
    ) { }

    @Get(':id')
    @ApiOperation({ summary: 'Get sheikh details' })
    async getDetails(@Param('id') id: string) {
        const sheikh = await this.teacherService.findOne(id);
        return {
            success: true,
            message: 'تم جلب بيانات الشيخ بنجاح',
            data: {
                sheikh: this.formatSheikhDetail(sheikh),
            },
        };
    }

    @Get(':id/courses')
    @ApiOperation({ summary: 'Get courses by sheikh' })
    async getCourses(
        @Param('id') id: string,
        @Query('limit') limit?: string,
        @Query('page') page?: string,
    ) {
        const result = await this.courseService.findAll(
            page ? parseInt(page) : 1,
            limit ? parseInt(limit) : 10,
            'PUBLISHED' as any,
            id,
        );

        // Get sheikh info for the response header
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

    private formatSheikhDetail(sheikh: any) {
        // Format schedules into daily slots
        const schedule: any = {
            saturday: [], sunday: [], monday: [], tuesday: [], wednesday: [], thursday: [], friday: []
        };

        if (sheikh.schedules) {
            sheikh.schedules.forEach((s: any) => {
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
            total_students: 0, // Placeholder
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
}
