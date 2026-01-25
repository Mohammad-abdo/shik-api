import { Module, forwardRef } from '@nestjs/common';
import { CourseController } from './course.controller';
import { MobileCourseController } from './mobile-course.controller';
import { CourseService } from './course.service';
import { PrismaModule } from '../prisma/prisma.module';
import { TeacherModule } from '../teacher/teacher.module';

@Module({
  imports: [PrismaModule, forwardRef(() => TeacherModule)],
  // CourseController must be registered first to ensure 'featured' route is registered before ':id' routes
  controllers: [CourseController, MobileCourseController],
  providers: [CourseService],
  exports: [CourseService],
})
export class CourseModule { }

