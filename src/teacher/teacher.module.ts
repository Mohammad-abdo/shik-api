import { Module, forwardRef } from '@nestjs/common';
import { TeacherController } from './teacher.controller';
import { MobileTeacherController } from './mobile-teacher.controller';
import { TeacherService } from './teacher.service';
import { PrismaModule } from '../prisma/prisma.module';
import { CourseModule } from '../course/course.module';

@Module({
  imports: [PrismaModule, forwardRef(() => CourseModule)],
  controllers: [TeacherController, MobileTeacherController],
  providers: [TeacherService],
  exports: [TeacherService],
})
export class TeacherModule { }



