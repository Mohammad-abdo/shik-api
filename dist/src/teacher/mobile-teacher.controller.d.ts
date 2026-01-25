import { TeacherService } from './teacher.service';
import { CourseService } from '../course/course.service';
export declare class MobileTeacherController {
    private readonly teacherService;
    private readonly courseService;
    constructor(teacherService: TeacherService, courseService: CourseService);
    getDetails(id: string): Promise<{
        success: boolean;
        message: string;
        data: {
            sheikh: {
                id: any;
                name: string;
                email: any;
                age: any;
                gender: any;
                profile_image_url: any;
                intro_video_url: any;
                intro_video_thumbnail: any;
                specialization: any;
                bio: any;
                full_bio: any;
                qualifications: any;
                rating: any;
                total_reviews: any;
                total_students: number;
                total_courses: any;
                memorized_parts: any;
                years_of_experience: any;
                is_available: boolean;
                session_price: any;
                availability_schedule: any;
                phone: any;
                created_at: any;
                updated_at: any;
            };
        };
    }>;
    getCourses(id: string, limit?: string, page?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            sheikh: {
                id: string;
                name: string;
                profile_image_url: string;
            };
            courses: {
                id: string;
                title: string;
                description: string;
                image_url: string;
                category: string;
                enrolled_students: number;
                total_lessons: number;
                rating: number;
                total_reviews: number;
                is_featured: boolean;
                created_at: Date;
            }[];
            pagination: {
                current_page: number;
                per_page: number;
                total_courses: number;
                total_pages: number;
            };
        };
    }>;
    private formatSheikhDetail;
}
