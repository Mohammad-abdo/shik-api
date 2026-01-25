import { Controller, Post, Get, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { VideoProgressService } from './video-progress.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Mobile Video Progress')
@Controller()
export class VideoProgressController {
    constructor(private readonly videoProgressService: VideoProgressService) { }

    @Post('videos/:video_id/start')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Track when a student starts watching a video lesson' })
    async startWatching(
        @Param('video_id') videoId: string,
        @CurrentUser() user: any,
        @Body() dto: { lesson_id: string; course_id: string },
    ) {
        return this.videoProgressService.startWatching(videoId, user.id, dto.lesson_id, dto.course_id);
    }

    @Post('videos/:video_id/complete')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Mark a video as fully watched/completed' })
    async completeVideo(
        @Param('video_id') videoId: string,
        @CurrentUser() user: any,
        @Body() dto: { lesson_id: string; course_id: string; watch_duration_seconds?: number },
    ) {
        return this.videoProgressService.completeVideo(
            videoId,
            user.id,
            dto.lesson_id,
            dto.course_id,
            dto.watch_duration_seconds,
        );
    }

    @Get('courses/:course_id/progress')
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get user video watching progress for a specific course' })
    async getProgress(@Param('course_id') courseId: string, @CurrentUser() user: any) {
        return this.videoProgressService.getCourseProgress(courseId, user.id);
    }
}
