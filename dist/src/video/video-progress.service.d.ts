import { PrismaService } from '../prisma/prisma.service';
export declare class VideoProgressService {
    private prisma;
    constructor(prisma: PrismaService);
    startWatching(videoId: string, userId: string, lessonId: string, courseId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            video_progress: {
                id: string;
                user_id: string;
                video_id: string;
                lesson_id: string;
                course_id: string;
                status: string;
                watch_progress: number;
                started_at: Date;
                completed_at: Date;
            };
        };
    }>;
    completeVideo(videoId: string, userId: string, lessonId: string, courseId: string, duration?: number): Promise<{
        success: boolean;
        message: string;
        data: {
            video_progress: {
                id: string;
                user_id: string;
                video_id: string;
                lesson_id: string;
                course_id: string;
                status: string;
                watch_progress: number;
                started_at: Date;
                completed_at: Date;
            };
            lesson_completed: boolean;
            course_progress: number;
        };
    }>;
    getCourseProgress(courseId: string, userId: string): Promise<{
        success: boolean;
        message: string;
        data: {
            course: {
                id: string;
                title: string;
                total_lessons: number;
                total_videos: number;
            };
            progress_summary: {
                completed_videos: number;
                watching_videos: number;
                remaining_videos: number;
                completed_lessons: number;
                course_progress: number;
            };
            current_video: {
                video_id: string;
                lesson_id: string;
                title: string;
                thumbnail_url: string;
                status: string;
                watch_progress: number;
                started_at: Date;
            };
            next_video: any;
            completed_videos: {
                video_id: string;
                lesson_id: string;
                title: string;
                completed_at: Date;
            }[];
        };
    }>;
    private updateCourseProgress;
}
