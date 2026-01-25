import { VideoProgressService } from './video-progress.service';
export declare class VideoProgressController {
    private readonly videoProgressService;
    constructor(videoProgressService: VideoProgressService);
    startWatching(videoId: string, user: any, dto: {
        lesson_id: string;
        course_id: string;
    }): Promise<{
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
    completeVideo(videoId: string, user: any, dto: {
        lesson_id: string;
        course_id: string;
        watch_duration_seconds?: number;
    }): Promise<{
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
    getProgress(courseId: string, user: any): Promise<{
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
}
