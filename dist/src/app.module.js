"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const throttler_1 = require("@nestjs/throttler");
const schedule_1 = require("@nestjs/schedule");
const prisma_module_1 = require("./prisma/prisma.module");
const auth_module_1 = require("./auth/auth.module");
const user_module_1 = require("./user/user.module");
const teacher_module_1 = require("./teacher/teacher.module");
const booking_module_1 = require("./booking/booking.module");
const payment_module_1 = require("./payment/payment.module");
const session_module_1 = require("./session/session.module");
const review_module_1 = require("./review/review.module");
const notification_module_1 = require("./notification/notification.module");
const admin_module_1 = require("./admin/admin.module");
const file_upload_module_1 = require("./file-upload/file-upload.module");
const rbac_module_1 = require("./rbac/rbac.module");
const audit_module_1 = require("./audit/audit.module");
const finance_module_1 = require("./finance/finance.module");
const content_module_1 = require("./content/content.module");
const certificate_module_1 = require("./certificate/certificate.module");
const video_module_1 = require("./video/video.module");
const exam_module_1 = require("./exam/exam.module");
const course_module_1 = require("./course/course.module");
const subscription_module_1 = require("./subscription/subscription.module");
const student_subscription_module_1 = require("./student-subscription/student-subscription.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            throttler_1.ThrottlerModule.forRoot([
                {
                    ttl: 60000,
                    limit: 100,
                },
            ]),
            schedule_1.ScheduleModule.forRoot(),
            prisma_module_1.PrismaModule,
            auth_module_1.AuthModule,
            user_module_1.UserModule,
            teacher_module_1.TeacherModule,
            booking_module_1.BookingModule,
            payment_module_1.PaymentModule,
            session_module_1.SessionModule,
            review_module_1.ReviewModule,
            notification_module_1.NotificationModule,
            admin_module_1.AdminModule,
            file_upload_module_1.FileUploadModule,
            rbac_module_1.RbacModule,
            audit_module_1.AuditModule,
            finance_module_1.FinanceModule,
            content_module_1.ContentModule,
            certificate_module_1.CertificateModule,
            video_module_1.VideoModule,
            exam_module_1.ExamModule,
            course_module_1.CourseModule,
            subscription_module_1.SubscriptionModule,
            student_subscription_module_1.StudentSubscriptionModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map