import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CreateContentDto, ApproveContentDto, RejectContentDto } from './dto';
import { ContentStatus } from '@prisma/client';
export declare class ContentService {
    private prisma;
    private fileUploadService;
    constructor(prisma: PrismaService, fileUploadService: FileUploadService);
    create(teacherId: string, dto: CreateContentDto, file: Express.Multer.File): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        description: string | null;
        title: string;
        rejectionReason: string | null;
        contentType: import(".prisma/client").$Enums.ContentType;
        fileUrl: string;
        fileType: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    getPendingContent(page?: number, limit?: number): Promise<{
        content: ({
            teacher: {
                user: {
                    id: string;
                    email: string;
                    firstName: string;
                    lastName: string;
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
        } & {
            id: string;
            status: import(".prisma/client").$Enums.ContentStatus;
            createdAt: Date;
            updatedAt: Date;
            teacherId: string;
            description: string | null;
            title: string;
            rejectionReason: string | null;
            contentType: import(".prisma/client").$Enums.ContentType;
            fileUrl: string;
            fileType: string;
            reviewedBy: string | null;
            reviewedAt: Date | null;
        })[];
        pagination: {
            page: number;
            limit: number;
            total: number;
            totalPages: number;
        };
    }>;
    getContentByTeacher(teacherId: string, status?: ContentStatus): Promise<{
        id: string;
        status: import(".prisma/client").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        description: string | null;
        title: string;
        rejectionReason: string | null;
        contentType: import(".prisma/client").$Enums.ContentType;
        fileUrl: string;
        fileType: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }[]>;
    approve(contentId: string, adminId: string, dto: ApproveContentDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        description: string | null;
        title: string;
        rejectionReason: string | null;
        contentType: import(".prisma/client").$Enums.ContentType;
        fileUrl: string;
        fileType: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    reject(contentId: string, adminId: string, dto: RejectContentDto): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        description: string | null;
        title: string;
        rejectionReason: string | null;
        contentType: import(".prisma/client").$Enums.ContentType;
        fileUrl: string;
        fileType: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    getContentById(id: string): Promise<{
        teacher: {
            user: {
                id: string;
                email: string;
                firstName: string;
                lastName: string;
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
    } & {
        id: string;
        status: import(".prisma/client").$Enums.ContentStatus;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        description: string | null;
        title: string;
        rejectionReason: string | null;
        contentType: import(".prisma/client").$Enums.ContentType;
        fileUrl: string;
        fileType: string;
        reviewedBy: string | null;
        reviewedAt: Date | null;
    }>;
    deleteContent(contentId: string, teacherId: string): Promise<{
        message: string;
    }>;
}
