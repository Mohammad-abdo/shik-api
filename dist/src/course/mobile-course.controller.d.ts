import { CourseService } from './course.service';
export declare class MobileCourseController {
    private readonly courseService;
    constructor(courseService: CourseService);
    getDetails(id: string, user?: any): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                full_description: any;
                intro_video_url: any;
                intro_video_thumbnail: any;
                total_videos: any;
                updated_at: any;
                id: any;
                title: any;
                description: any;
                image_url: any;
                category: any;
                enrolled_students: any;
                total_lessons: any;
                duration_hours: any;
                rating: any;
                total_reviews: any;
                is_featured: any;
                is_enrolled: boolean;
                sheikhs_count: any;
                created_at: any;
            };
        };
    }>;
    getSheikhs(id: string, limit?: string, page?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            sheikhs: {
                id: string;
                name: string;
                profile_image_url: string;
                specialization: string;
                bio: string;
                rating: number;
                total_reviews: number;
                total_students: number;
                total_courses: number;
                is_available: boolean;
                session_price: number;
                created_at: Date;
            }[];
            pagination: {
                current_page: number;
                total_pages: number;
                total_sheikhs: number;
                per_page: number;
            };
        };
    }>;
    getLessons(id: string, user: any): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                id: string;
                title: string;
                image_url: string;
            };
            lessons: {
                id: string;
                title: string;
                description: string;
                order: number;
                duration_minutes: number;
                is_free: boolean;
                is_completed: boolean;
                videos: {
                    id: string;
                    title: string;
                    description: string;
                    video_url: string;
                    thumbnail_url: string;
                    duration_seconds: number;
                    order: number;
                    is_watched: boolean;
                    watch_progress: number;
                    created_at: Date;
                }[];
            }[];
            total_lessons: number;
            total_videos: number;
            completed_lessons: number;
            course_progress: number;
        };
    }>;
    private formatCourse;
    private formatCourseDetail;
}
