import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UserModule } from './user/user.module';
import { TeacherModule } from './teacher/teacher.module';
import { BookingModule } from './booking/booking.module';
import { PaymentModule } from './payment/payment.module';
import { SessionModule } from './session/session.module';
import { ReviewModule } from './review/review.module';
import { NotificationModule } from './notification/notification.module';
import { AdminModule } from './admin/admin.module';
import { FileUploadModule } from './file-upload/file-upload.module';
import { RbacModule } from './rbac/rbac.module';
import { AuditModule } from './audit/audit.module';
import { FinanceModule } from './finance/finance.module';
import { ContentModule } from './content/content.module';
import { CertificateModule } from './certificate/certificate.module';
import { VideoModule } from './video/video.module';
import { ExamModule } from './exam/exam.module';
import { CourseModule } from './course/course.module';
import { SubscriptionModule } from './subscription/subscription.module';
import { StudentSubscriptionModule } from './student-subscription/student-subscription.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 100,
      },
    ]),
    ScheduleModule.forRoot(),
    PrismaModule,
    AuthModule,
    UserModule,
    TeacherModule,
    BookingModule,
    PaymentModule,
    SessionModule,
    ReviewModule,
    NotificationModule,
    AdminModule,
    FileUploadModule,
    RbacModule,
    AuditModule,
    FinanceModule,
    ContentModule,
    CertificateModule,
    VideoModule,
    ExamModule,
    CourseModule,
    SubscriptionModule,
    StudentSubscriptionModule,
  ],
})
export class AppModule {}

