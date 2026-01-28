import { PrismaService } from '../prisma/prisma.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { CourseStatus } from '@prisma/client';
export declare class CourseService {
    private prisma;
    constructor(prisma: PrismaService);
    createTeacherCourse(dto: CreateCourseDto, userId: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            introVideoUrl: string | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        _count: {
            enrollments: number;
        };
        enrollments: ({
            student: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            courseId: string;
            enrolledAt: Date;
            completedAt: Date | null;
            progress: number;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        createdAt: Date;
        updatedAt: Date;
        introVideoUrl: string | null;
        image: string | null;
        rating: number;
        totalReviews: number;
        teacherId: string | null;
        duration: number | null;
        price: number;
        description: string | null;
        descriptionAr: string | null;
        createdBy: string | null;
        title: string;
        titleAr: string | null;
        category: string | null;
        fullDescription: string | null;
        fullDescriptionAr: string | null;
        introVideoThumbnail: string | null;
        isFeatured: boolean;
        level: import(".prisma/client").$Enums.CourseLevel | null;
        totalLessons: number;
        totalVideos: number;
    }>;
    create(dto: CreateCourseDto, adminId: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            introVideoUrl: string | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        _count: {
            enrollments: number;
        };
        enrollments: ({
            student: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            courseId: string;
            enrolledAt: Date;
            completedAt: Date | null;
            progress: number;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        createdAt: Date;
        updatedAt: Date;
        introVideoUrl: string | null;
        image: string | null;
        rating: number;
        totalReviews: number;
        teacherId: string | null;
        duration: number | null;
        price: number;
        description: string | null;
        descriptionAr: string | null;
        createdBy: string | null;
        title: string;
        titleAr: string | null;
        category: string | null;
        fullDescription: string | null;
        fullDescriptionAr: string | null;
        introVideoThumbnail: string | null;
        isFeatured: boolean;
        level: import(".prisma/client").$Enums.CourseLevel | null;
        totalLessons: number;
        totalVideos: number;
    }>;
    findAll(page?: number, limit?: number, status?: CourseStatus, teacherId?: string, isFeatured?: boolean): Promise<{
        courses: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    firstNameAr: string;
                    lastName: string;
                    lastNameAr: string;
                };
            } & {
                id: string;
                createdAt: Date;
                updatedAt: Date;
                certificates: string | null;
                canIssueCertificates: boolean | null;
                introVideoUrl: string | null;
                specialties: string | null;
                specialtiesAr: string | null;
                userId: string;
                bio: string | null;
                bioAr: string | null;
                image: string | null;
                experience: number | null;
                hourlyRate: number;
                rating: number;
                totalReviews: number;
                isApproved: boolean;
                approvedAt: Date | null;
                approvedBy: string | null;
                readingType: string | null;
                readingTypeAr: string | null;
            };
            _count: {
                enrollments: number;
                lessons: number;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            introVideoUrl: string | null;
            image: string | null;
            rating: number;
            totalReviews: number;
            teacherId: string | null;
            duration: number | null;
            price: number;
            description: string | null;
            descriptionAr: string | null;
            createdBy: string | null;
            title: string;
            titleAr: string | null;
            category: string | null;
            fullDescription: string | null;
            fullDescriptionAr: string | null;
            introVideoThumbnail: string | null;
            isFeatured: boolean;
            level: import(".prisma/client").$Enums.CourseLevel | null;
            totalLessons: number;
            totalVideos: number;
        })[];
        pagination: {
            current_page: number;
            per_page: number;
            total_courses: number;
            total_pages: number;
        };
    }>;
    findCourseSheikhs(courseId: string, page?: number, limit?: number): Promise<{
        teachers: {
            id: string;
            name: string;
            profile_image: string;
            bio: string;
            rating: number;
            students_count: number;
            specialization: string;
        }[];
        total: number;
    }>;
    findCourseLessons(courseId: string, userId: string): Promise<{
        course: {
            id: string;
            title: string;
            image_url: string;
        };
        lessons: {
            id: string;
            title: string;
            description: string;
            order: number;
            duration_minutes: number;
            is_free: boolean;
            is_completed: boolean;
            videos: {
                id: string;
                title: string;
                description: string;
                video_url: string;
                thumbnail_url: string;
                duration_seconds: number;
                order: number;
                is_watched: boolean;
                watch_progress: number;
                created_at: Date;
            }[];
        }[];
        total_lessons: number;
        total_videos: number;
        completed_lessons: number;
        course_progress: number;
    }>;
    findOne(id: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            introVideoUrl: string | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        _count: {
            enrollments: number;
        };
        enrollments: ({
            student: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
                avatar: string;
            };
        } & {
            id: string;
            status: import(".prisma/client").$Enums.EnrollmentStatus;
            createdAt: Date;
            updatedAt: Date;
            studentId: string;
            courseId: string;
            enrolledAt: Date;
            completedAt: Date | null;
            progress: number;
        })[];
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        createdAt: Date;
        updatedAt: Date;
        introVideoUrl: string | null;
        image: string | null;
        rating: number;
        totalReviews: number;
        teacherId: string | null;
        duration: number | null;
        price: number;
        description: string | null;
        descriptionAr: string | null;
        createdBy: string | null;
        title: string;
        titleAr: string | null;
        category: string | null;
        fullDescription: string | null;
        fullDescriptionAr: string | null;
        introVideoThumbnail: string | null;
        isFeatured: boolean;
        level: import(".prisma/client").$Enums.CourseLevel | null;
        totalLessons: number;
        totalVideos: number;
    }>;
    update(id: string, dto: UpdateCourseDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                firstNameAr: string;
                lastName: string;
                lastNameAr: string;
            };
        } & {
            id: string;
            createdAt: Date;
            updatedAt: Date;
            certificates: string | null;
            canIssueCertificates: boolean | null;
            introVideoUrl: string | null;
            specialties: string | null;
            specialtiesAr: string | null;
            userId: string;
            bio: string | null;
            bioAr: string | null;
            image: string | null;
            experience: number | null;
            hourlyRate: number;
            rating: number;
            totalReviews: number;
            isApproved: boolean;
            approvedAt: Date | null;
            approvedBy: string | null;
            readingType: string | null;
            readingTypeAr: string | null;
        };
        _count: {
            enrollments: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.CourseStatus;
        createdAt: Date;
        updatedAt: Date;
        introVideoUrl: string | null;
        image: string | null;
        rating: number;
        totalReviews: number;
        teacherId: string | null;
        duration: number | null;
        price: number;
        description: string | null;
        descriptionAr: string | null;
        createdBy: string | null;
        title: string;
        titleAr: string | null;
        category: string | null;
        fullDescription: string | null;
        fullDescriptionAr: string | null;
        introVideoThumbnail: string | null;
        isFeatured: boolean;
        level: import(".prisma/client").$Enums.CourseLevel | null;
        totalLessons: number;
        totalVideos: number;
    }>;
    delete(id: string): Promise<{
        message: string;
    }>;
    enrollStudent(courseId: string, studentId: string): Promise<{
        student: {
            id: string;
            email: string;
            firstName: string;
            firstNameAr: string;
            lastName: string;
            lastNameAr: string;
        };
        course: {
            id: string;
            status: import(".prisma/client").$Enums.CourseStatus;
            createdAt: Date;
            updatedAt: Date;
            introVideoUrl: string | null;
            image: string | null;
            rating: number;
            totalReviews: number;
            teacherId: string | null;
            duration: number | null;
            price: number;
            description: string | null;
            descriptionAr: string | null;
            createdBy: string | null;
            title: string;
            titleAr: string | null;
            category: string | null;
            fullDescription: string | null;
            fullDescriptionAr: string | null;
            introVideoThumbnail: string | null;
            isFeatured: boolean;
            level: import(".prisma/client").$Enums.CourseLevel | null;
            totalLessons: number;
            totalVideos: number;
        };
    } & {
        id: string;
        status: import(".prisma/client").$Enums.EnrollmentStatus;
        createdAt: Date;
        updatedAt: Date;
        studentId: string;
        courseId: string;
        enrolledAt: Date;
        completedAt: Date | null;
        progress: number;
    }>;
    checkEnrollment(courseId: string, studentId: string): Promise<boolean>;
}
