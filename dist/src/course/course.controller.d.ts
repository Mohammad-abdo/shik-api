import { CourseService } from './course.service';
import { CreateCourseDto, UpdateCourseDto } from './dto';
import { CourseStatus } from '@prisma/client';
export declare class CourseController {
    private readonly courseService;
    constructor(courseService: CourseService);
    create(dto: CreateCourseDto, user: any): Promise<{
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
            introVideoUrl: string | null;
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
        image: string | null;
        rating: number;
        totalReviews: number;
        introVideoUrl: string | null;
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
    findAll(page?: string, limit?: string, status?: CourseStatus, teacherId?: string): Promise<{
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
                introVideoUrl: string | null;
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
            image: string | null;
            rating: number;
            totalReviews: number;
            introVideoUrl: string | null;
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
    getFeatured(page?: string, limit?: string): Promise<{
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
                introVideoUrl: string | null;
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
            image: string | null;
            rating: number;
            totalReviews: number;
            introVideoUrl: string | null;
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
            introVideoUrl: string | null;
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
        image: string | null;
        rating: number;
        totalReviews: number;
        introVideoUrl: string | null;
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
            introVideoUrl: string | null;
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
        image: string | null;
        rating: number;
        totalReviews: number;
        introVideoUrl: string | null;
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
    enroll(courseId: string, user: any): Promise<{
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
            image: string | null;
            rating: number;
            totalReviews: number;
            introVideoUrl: string | null;
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
}
