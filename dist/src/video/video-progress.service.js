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
Object.defineProperty(exports, "__esModule", { value: true });
exports.VideoProgressService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
let VideoProgressService = class VideoProgressService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async startWatching(videoId, userId, lessonId, courseId) {
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
    async completeVideo(videoId, userId, lessonId, courseId, duration) {
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
                lesson_completed: false,
                course_progress: 0,
            },
        };
    }
    async getCourseProgress(courseId, userId) {
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
        if (!course)
            throw new common_1.NotFoundException('Course not found');
        const progressList = await this.prisma.videoProgress.findMany({
            where: { userId, courseId },
            include: { video: true }
        });
        const completedVideos = progressList.filter(p => p.status === 'COMPLETED');
        const watchingVideos = progressList.filter(p => p.status === 'WATCHING');
        const allVideos = course.lessons.flatMap(l => l.videos.map(v => ({ ...v, lessonId: l.id })));
        const totalVideos = allVideos.length;
        const completedLessons = course.lessons.filter(lesson => {
            const lessonVideoIds = lesson.videos.map(v => v.id);
            if (lessonVideoIds.length === 0)
                return false;
            return lessonVideoIds.every(id => completedVideos.some(cv => cv.videoId === id));
        });
        let nextVideo = null;
        if (completedVideos.length < totalVideos) {
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
    async updateCourseProgress(userId, courseId) {
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
};
exports.VideoProgressService = VideoProgressService;
exports.VideoProgressService = VideoProgressService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], VideoProgressService);
//# sourceMappingURL=video-progress.service.js.map