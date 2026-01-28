import { ContentService } from './content.service';
import { CreateContentDto, ApproveContentDto, RejectContentDto } from './dto';
import { PrismaService } from '../prisma/prisma.service';
export declare class ContentController {
    private readonly contentService;
    private readonly prisma;
    constructor(contentService: ContentService, prisma: PrismaService);
    create(user: any, dto: CreateContentDto, file: Express.Multer.File): Promise<{
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
    getPendingContent(page?: string, limit?: string): Promise<{
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
    getMyContent(user: any, status?: string): Promise<{
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
    approve(id: string, user: any, dto: ApproveContentDto): Promise<{
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
    reject(id: string, user: any, dto: RejectContentDto): Promise<{
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
    deleteContent(id: string, user: any): Promise<{
        message: string;
    }>;
}
