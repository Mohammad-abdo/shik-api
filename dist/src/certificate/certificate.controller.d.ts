import { CertificateService } from './certificate.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
export declare class CertificateController {
    private readonly certificateService;
    constructor(certificateService: CertificateService);
    createCertificate(dto: CreateCertificateDto, user: any): Promise<{
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
    getTeacherCertificates(user: any): Promise<({
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
    revokeCertificate(id: string, reason: string): Promise<{
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
}
