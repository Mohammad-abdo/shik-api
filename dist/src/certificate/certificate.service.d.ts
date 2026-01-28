import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
export declare class CertificateService {
    private prisma;
    constructor(prisma: PrismaService);
    createCertificate(dto: CreateCertificateDto, teacherId: string): Promise<{
        teacher: {
            user: {
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
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        description: string | null;
        title: string;
        type: string | null;
        examId: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
        revocationReason: string | null;
        revokedAt: Date | null;
    }>;
    getStudentCertificates(studentId: string): Promise<({
        teacher: {
            user: {
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
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        description: string | null;
        title: string;
        type: string | null;
        examId: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
        revocationReason: string | null;
        revokedAt: Date | null;
    })[]>;
    getTeacherIssuedCertificates(teacherId: string): Promise<({
        student: {
            id: string;
            email: string;
            firstName: string;
            lastName: string;
        };
    } & {
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        description: string | null;
        title: string;
        type: string | null;
        examId: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
        revocationReason: string | null;
        revokedAt: Date | null;
    })[]>;
    revokeCertificate(certificateId: string, reason: string): Promise<{
        id: string;
        status: string | null;
        createdAt: Date;
        updatedAt: Date;
        teacherId: string;
        studentId: string;
        description: string | null;
        title: string;
        type: string | null;
        examId: string | null;
        pdfUrl: string | null;
        issuedAt: Date;
        revocationReason: string | null;
        revokedAt: Date | null;
    }>;
    private generateCertificatePDF;
}
