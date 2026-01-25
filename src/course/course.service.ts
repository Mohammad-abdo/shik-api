import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { CourseStatus } from '@prisma/client';

@Injectable()
export class CourseService {
  constructor(private prisma: PrismaService) { }

  async create(dto: CreateCourseDto, adminId: string) {
    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
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
        status: dto.status || CourseStatus.DRAFT,
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

  async findAll(
    page: number = 1,
    limit: number = 20,
    status?: CourseStatus,
    teacherId?: string,
    isFeatured?: boolean,
  ) {
    const skip = (page - 1) * limit;
    const where: any = {};

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

  async findCourseSheikhs(courseId: string, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    // For now, courses have one teacher in the schema. 
    // If it's many-to-many, we'd query the junction table.
    // Assuming 1:N for now as per schema: teacher     Teacher? @relation("TeacherCourses", fields: [teacherId], references: [id])
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          include: {
            user: true,
            _count: {
              select: {
                bookings: true,
                reviews: true,
                courses: true,
              }
            }
          }
        }
      }
    });

    if (!course || !course.teacher) {
      return { sheikhs: [], pagination: { current_page: page, total_pages: 0, total_sheikhs: 0, per_page: limit } };
    }

    const sheikh = course.teacher;
    const formattedSheikh = {
      id: sheikh.id,
      name: `${sheikh.user.firstName} ${sheikh.user.lastName}`.trim(),
      profile_image_url: sheikh.image,
      specialization: sheikh.specialtiesAr || sheikh.specialties,
      bio: sheikh.bioAr || sheikh.bio,
      rating: sheikh.rating,
      total_reviews: sheikh.totalReviews,
      total_students: 0, // Need to implement student count
      total_courses: sheikh._count.courses,
      is_available: true,
      session_price: sheikh.hourlyRate,
      created_at: sheikh.createdAt,
    };

    return {
      sheikhs: [formattedSheikh],
      pagination: {
        current_page: page,
        total_pages: 1,
        total_sheikhs: 1,
        per_page: limit,
      },
    };
  }

  async findCourseLessons(courseId: string, userId: string) {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: { courseId_studentId: { courseId, studentId: userId } }
    });

    if (!enrollment) {
      // throw new ForbiddenException('يجب التسجيل في الدورة أولاً للوصول إلى المحتوى');
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

    if (!course) throw new NotFoundException('الدورة غير موجودة');

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

  async findOne(id: string) {
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
      throw new NotFoundException('Course not found');
    }

    return course;
  }

  async update(id: string, dto: UpdateCourseDto) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    // Validate teacher if provided
    if (dto.teacherId) {
      const teacher = await this.prisma.teacher.findUnique({
        where: { id: dto.teacherId },
      });
      if (!teacher) {
        throw new NotFoundException('Teacher not found');
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

  async delete(id: string) {
    const course = await this.prisma.course.findUnique({
      where: { id },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    await this.prisma.course.delete({
      where: { id },
    });

    return { message: 'Course deleted successfully' };
  }

  async enrollStudent(courseId: string, studentId: string) {
    const course = await this.prisma.course.findUnique({
      where: { id: courseId },
    });

    if (!course) {
      throw new NotFoundException('Course not found');
    }

    if (course.status !== CourseStatus.PUBLISHED) {
      throw new BadRequestException('Course is not available for enrollment');
    }

    // Check if already enrolled
    const existingEnrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: {
          courseId,
          studentId,
        },
      },
    });

    if (existingEnrollment) {
      throw new BadRequestException('Student is already enrolled in this course');
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

  async checkEnrollment(courseId: string, studentId: string): Promise<boolean> {
    const enrollment = await this.prisma.courseEnrollment.findUnique({
      where: {
        courseId_studentId: { courseId, studentId },
      },
    });
    return !!enrollment;
  }
}

