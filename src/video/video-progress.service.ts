import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class VideoProgressService {
    constructor(private prisma: PrismaService) { }

    async startWatching(videoId: string, userId: string, lessonId: string, courseId: string) {
        const progress = await this.prisma.videoProgress.upsert({
            where: {
                userId_videoId: { userId, videoId },
            },
            update: {
                status: 'WATCHING',
                updatedAt: new Date(),
            },
            create: {
                userId,
                videoId,
                lessonId,
                courseId,
                status: 'WATCHING',
                watchProgress: 0,
            },
        });

        return {
            success: true,
            message: 'تم تسجيل بداية المشاهدة بنجاح',
            data: {
                video_progress: {
                    id: progress.id,
                    user_id: progress.userId,
                    video_id: progress.videoId,
                    lesson_id: progress.lessonId,
                    course_id: progress.courseId,
                    status: progress.status.toLowerCase(),
                    watch_progress: progress.watchProgress,
                    started_at: progress.startedAt,
                    completed_at: progress.completedAt,
                },
            },
        };
    }

    async completeVideo(videoId: string, userId: string, lessonId: string, courseId: string, duration?: number) {
        const progress = await this.prisma.videoProgress.upsert({
            where: {
                userId_videoId: { userId, videoId },
            },
            update: {
                status: 'COMPLETED',
                watchProgress: 100,
                watchDurationSeconds: duration || 0,
                completedAt: new Date(),
                updatedAt: new Date(),
            },
            create: {
                userId,
                videoId,
                lessonId,
                courseId,
                status: 'COMPLETED',
                watchProgress: 100,
                watchDurationSeconds: duration || 0,
                completedAt: new Date(),
            },
        });

        // Update course enrollment progress
        await this.updateCourseProgress(userId, courseId);

        return {
            success: true,
            message: 'تم إكمال الفيديو بنجاح',
            data: {
                video_progress: {
                    id: progress.id,
                    user_id: progress.userId,
                    video_id: progress.videoId,
                    lesson_id: progress.lessonId,
                    course_id: progress.courseId,
                    status: progress.status.toLowerCase(),
                    watch_progress: progress.watchProgress,
                    started_at: progress.startedAt,
                    completed_at: progress.completedAt,
                },
                lesson_completed: false, // Should calculate
                course_progress: 0, // Should return updated progress
            },
        };
    }

    async getCourseProgress(courseId: string, userId: string) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                        videos: { orderBy: { order: 'asc' } }
                    }
                }
            }
        });

        if (!course) throw new NotFoundException('Course not found');

        const progressList = await this.prisma.videoProgress.findMany({
            where: { userId, courseId },
            include: { video: true }
        });

        const completedVideos = progressList.filter(p => p.status === 'COMPLETED');
        const watchingVideos = progressList.filter(p => p.status === 'WATCHING');

        const allVideos = course.lessons.flatMap(l => l.videos.map(v => ({ ...v, lessonId: l.id })));
        const totalVideos = allVideos.length;

        // Calculate completed lessons (all videos in lesson are completed)
        const completedLessons = course.lessons.filter(lesson => {
            const lessonVideoIds = lesson.videos.map(v => v.id);
            if (lessonVideoIds.length === 0) return false;
            return lessonVideoIds.every(id => completedVideos.some(cv => cv.videoId === id));
        });

        // Find next video
        let nextVideo = null;
        if (completedVideos.length < totalVideos) {
            // Get all video IDs in order
            const completedVideoIds = new Set(completedVideos.map(cv => cv.videoId));
            const nextV = allVideos.find(v => !completedVideoIds.has(v.id));
            if (nextV) {
                nextVideo = {
                    video_id: nextV.id,
                    lesson_id: nextV.lessonId,
                    title: nextV.titleAr || nextV.title,
                    thumbnail_url: nextV.thumbnailUrl,
                    duration_seconds: nextV.durationSeconds,
                };
            }
        }

        return {
            success: true,
            message: 'تم جلب بيانات التقدم بنجاح',
            data: {
                course: {
                    id: course.id,
                    title: course.titleAr || course.title,
                    total_lessons: course.lessons.length,
                    total_videos: totalVideos,
                },
                progress_summary: {
                    completed_videos: completedVideos.length,
                    watching_videos: watchingVideos.length,
                    remaining_videos: totalVideos - completedVideos.length,
                    completed_lessons: completedLessons.length,
                    course_progress: totalVideos > 0 ? parseFloat(((completedVideos.length / totalVideos) * 100).toFixed(1)) : 0,
                },
                current_video: watchingVideos.length > 0 ? {
                    video_id: watchingVideos[0].videoId,
                    lesson_id: watchingVideos[0].lessonId,
                    title: watchingVideos[0].video.titleAr || watchingVideos[0].video.title,
                    thumbnail_url: watchingVideos[0].video.thumbnailUrl,
                    status: 'watching',
                    watch_progress: watchingVideos[0].watchProgress,
                    started_at: watchingVideos[0].startedAt,
                } : null,
                next_video: nextVideo,
                completed_videos: completedVideos.map(p => ({
                    video_id: p.videoId,
                    lesson_id: p.lessonId,
                    title: p.video.titleAr || p.video.title,
                    completed_at: p.completedAt,
                }))
            }
        };
    }

    private async updateCourseProgress(userId: string, courseId: string) {
        const lessons = await this.prisma.lesson.findMany({
            where: { courseId },
            include: { _count: { select: { videos: true } } }
        });
        const totalVideos = lessons.reduce((acc, l) => acc + l._count.videos, 0);

        const completedVideos = await this.prisma.videoProgress.count({
            where: { userId, courseId, status: 'COMPLETED' }
        });

        const progress = totalVideos > 0 ? (completedVideos / totalVideos) * 100 : 0;

        await this.prisma.courseEnrollment.update({
            where: { courseId_studentId: { courseId, studentId: userId } },
            data: {
                progress,
                status: progress === 100 ? 'COMPLETED' : 'ACTIVE',
                completedAt: progress === 100 ? new Date() : null
            }
        });
    }
}
