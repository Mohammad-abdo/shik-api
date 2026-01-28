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
exports.CourseService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
let CourseService = class CourseService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createTeacherCourse(dto, userId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher profile not found. Please create your teacher profile first.');
        }
        const course = await this.prisma.course.create({
            data: {
                title: dto.title,
                titleAr: dto.titleAr,
                description: dto.description,
                descriptionAr: dto.descriptionAr,
                teacherId: teacher.id,
                price: dto.price,
                duration: dto.duration,
                image: dto.image,
                introVideoUrl: dto.introVideoUrl,
                introVideoThumbnail: dto.introVideoThumbnail,
                status: dto.status || client_1.CourseStatus.DRAFT,
                createdBy: userId,
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });
        return course;
    }
    async create(dto, adminId) {
        if (dto.teacherId) {
            const teacher = await this.prisma.teacher.findUnique({
                where: { id: dto.teacherId },
            });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher not found');
            }
        }
        const course = await this.prisma.course.create({
            data: {
                title: dto.title,
                titleAr: dto.titleAr,
                description: dto.description,
                descriptionAr: dto.descriptionAr,
                teacherId: dto.teacherId,
                price: dto.price,
                duration: dto.duration,
                image: dto.image,
                introVideoUrl: dto.introVideoUrl,
                introVideoThumbnail: dto.introVideoThumbnail,
                status: dto.status || client_1.CourseStatus.DRAFT,
                createdBy: adminId,
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });
        return course;
    }
    async findAll(page = 1, limit = 20, status, teacherId, isFeatured) {
        const skip = (page - 1) * limit;
        const where = {};
        if (status) {
            where.status = status;
        }
        if (teacherId) {
            where.teacherId = teacherId;
        }
        if (isFeatured !== undefined) {
            where.isFeatured = isFeatured;
        }
        const [courses, total] = await Promise.all([
            this.prisma.course.findMany({
                where,
                skip,
                take: limit,
                include: {
                    teacher: {
                        include: {
                            user: {
                                select: {
                                    id: true,
                                    firstName: true,
                                    firstNameAr: true,
                                    lastName: true,
                                    lastNameAr: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    _count: {
                        select: {
                            enrollments: true,
                            lessons: true,
                        },
                    },
                },
                orderBy: {
                    createdAt: 'desc',
                },
            }),
            this.prisma.course.count({ where }),
        ]);
        return {
            courses,
            pagination: {
                current_page: page,
                per_page: limit,
                total_courses: total,
                total_pages: Math.ceil(total / limit),
            },
        };
    }
    async findCourseSheikhs(courseId, page = 1, limit = 10) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                            },
                        },
                        _count: {
                            select: {
                                bookings: true,
                                reviews: true,
                                courses: true,
                            },
                        },
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (!course.teacher) {
            return {
                teachers: [],
                total: 0,
            };
        }
        const uniqueStudentsResult = await this.prisma.booking.groupBy({
            by: ['studentId'],
            where: {
                teacherId: course.teacher.id,
            },
            _count: {
                studentId: true,
            },
        });
        const studentsCount = uniqueStudentsResult.length;
        const sheikh = course.teacher;
        const teacherName = sheikh.user.firstNameAr && sheikh.user.lastNameAr
            ? `${sheikh.user.firstNameAr} ${sheikh.user.lastNameAr}`.trim()
            : `${sheikh.user.firstName} ${sheikh.user.lastName}`.trim();
        const formattedTeacher = {
            id: sheikh.id,
            name: teacherName,
            profile_image: sheikh.image || null,
            bio: sheikh.bioAr || sheikh.bio || null,
            rating: sheikh.rating || 0,
            students_count: studentsCount,
            specialization: sheikh.specialtiesAr || sheikh.specialties || null,
        };
        return {
            teachers: [formattedTeacher],
            total: 1,
        };
    }
    async findCourseLessons(courseId, userId) {
        const enrollment = await this.prisma.courseEnrollment.findUnique({
            where: { courseId_studentId: { courseId, studentId: userId } }
        });
        if (!enrollment) {
        }
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
            include: {
                lessons: {
                    orderBy: { order: 'asc' },
                    include: {
                        videos: { orderBy: { order: 'asc' } },
                        videoProgress: { where: { userId } }
                    }
                }
            }
        });
        if (!course)
            throw new common_1.NotFoundException('الدورة غير موجودة');
        const lessons = course.lessons.map(lesson => ({
            id: lesson.id,
            title: lesson.titleAr || lesson.title,
            description: lesson.descriptionAr || lesson.description,
            order: lesson.order,
            duration_minutes: lesson.durationMinutes,
            is_free: lesson.isFree,
            is_completed: lesson.videoProgress.every(p => p.status === 'COMPLETED'),
            videos: lesson.videos.map(video => {
                const progress = lesson.videoProgress.find(p => p.videoId === video.id);
                return {
                    id: video.id,
                    title: video.titleAr || video.title,
                    description: video.descriptionAr || video.description,
                    video_url: video.videoUrl,
                    thumbnail_url: video.thumbnailUrl,
                    duration_seconds: video.durationSeconds,
                    order: video.order,
                    is_watched: progress?.status === 'COMPLETED',
                    watch_progress: progress?.watchProgress || 0,
                    created_at: video.createdAt,
                };
            })
        }));
        return {
            course: {
                id: course.id,
                title: course.titleAr || course.title,
                image_url: course.image,
            },
            lessons,
            total_lessons: course.totalLessons,
            total_videos: course.totalVideos,
            completed_lessons: lessons.filter(l => l.is_completed).length,
            course_progress: enrollment?.progress || 0,
        };
    }
    async findOne(id) {
        const course = await this.prisma.course.findUnique({
            where: { id },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                },
                enrollments: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                                avatar: true,
                            },
                        },
                    },
                    orderBy: {
                        enrolledAt: 'desc',
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        return course;
    }
    async update(id, dto) {
        const course = await this.prisma.course.findUnique({
            where: { id },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (dto.teacherId) {
            const teacher = await this.prisma.teacher.findUnique({
                where: { id: dto.teacherId },
            });
            if (!teacher) {
                throw new common_1.NotFoundException('Teacher not found');
            }
        }
        const updated = await this.prisma.course.update({
            where: { id },
            data: {
                ...(dto.title && { title: dto.title }),
                ...(dto.titleAr !== undefined && { titleAr: dto.titleAr }),
                ...(dto.description !== undefined && { description: dto.description }),
                ...(dto.descriptionAr !== undefined && { descriptionAr: dto.descriptionAr }),
                ...(dto.teacherId !== undefined && { teacherId: dto.teacherId }),
                ...(dto.price !== undefined && { price: dto.price }),
                ...(dto.duration !== undefined && { duration: dto.duration }),
                ...(dto.image !== undefined && { image: dto.image }),
                ...(dto.introVideoUrl !== undefined && { introVideoUrl: dto.introVideoUrl }),
                ...(dto.introVideoThumbnail !== undefined && { introVideoThumbnail: dto.introVideoThumbnail }),
                ...(dto.status && { status: dto.status }),
            },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                firstName: true,
                                firstNameAr: true,
                                lastName: true,
                                lastNameAr: true,
                                email: true,
                            },
                        },
                    },
                },
                _count: {
                    select: {
                        enrollments: true,
                    },
                },
            },
        });
        return updated;
    }
    async delete(id) {
        const course = await this.prisma.course.findUnique({
            where: { id },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        await this.prisma.course.delete({
            where: { id },
        });
        return { message: 'Course deleted successfully' };
    }
    async enrollStudent(courseId, studentId) {
        const course = await this.prisma.course.findUnique({
            where: { id: courseId },
        });
        if (!course) {
            throw new common_1.NotFoundException('Course not found');
        }
        if (course.status !== client_1.CourseStatus.PUBLISHED) {
            throw new common_1.BadRequestException('Course is not available for enrollment');
        }
        const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
            where: {
                courseId_studentId: {
                    courseId,
                    studentId,
                },
            },
        });
        if (existingEnrollment) {
            throw new common_1.BadRequestException('Student is already enrolled in this course');
        }
        const enrollment = await this.prisma.courseEnrollment.create({
            data: {
                courseId,
                studentId,
                status: 'ACTIVE',
                progress: 0,
            },
            include: {
                course: true,
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        firstNameAr: true,
                        lastName: true,
                        lastNameAr: true,
                        email: true,
                    },
                },
            },
        });
        return enrollment;
    }
    async checkEnrollment(courseId, studentId) {
        const enrollment = await this.prisma.courseEnrollment.findUnique({
            where: {
                courseId_studentId: { courseId, studentId },
            },
        });
        return !!enrollment;
    }
};
exports.CourseService = CourseService;
exports.CourseService = CourseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CourseService);
//# sourceMappingURL=course.service.js.map