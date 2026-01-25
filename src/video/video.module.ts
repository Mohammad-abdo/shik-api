import { Module } from '@nestjs/common';
import { VideoService } from './video.service';
import { VideoProgressService } from './video-progress.service';
import { VideoController } from './video.controller';
import { VideoProgressController } from './video-progress.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideoController, VideoProgressController],
  providers: [VideoService, VideoProgressService],
  exports: [VideoService, VideoProgressService],
})
export class VideoModule { }

