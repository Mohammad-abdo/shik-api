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
exports.CertificateService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const PDFDocument = require("pdfkit");
const fs = require("fs");
const path = require("path");
let CertificateService = class CertificateService {
    constructor(prisma) {
        this.prisma = prisma;
    }
    async createCertificate(dto, teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        if (!teacher.canIssueCertificates) {
            throw new common_1.BadRequestException('Teacher is not authorized to issue certificates');
        }
        const student = await this.prisma.user.findUnique({
            where: { id: dto.studentId },
        });
        if (!student) {
            throw new common_1.NotFoundException('Student not found');
        }
        const teacherUser = await this.prisma.user.findUnique({
            where: { id: teacher.userId },
            select: { firstName: true, lastName: true },
        });
        const pdfUrl = await this.generateCertificatePDF({
            studentName: `${student.firstName} ${student.lastName}`,
            teacherName: `${teacherUser?.firstName || ''} ${teacherUser?.lastName || ''}`,
            certificateType: dto.certificateType,
            surahName: dto.surahName,
            issuedAt: new Date(),
        });
        const certificate = await this.prisma.certificate.create({
            data: {
                studentId: dto.studentId,
                teacherId: teacher.id,
                ...(dto.bookingId && { bookingId: dto.bookingId }),
                type: dto.certificateType || 'IJAZA',
                title: `شهادة إجازة - ${dto.certificateType}`,
                description: dto.surahName ? `شهادة إجازة في ${dto.surahName}` : null,
                pdfUrl,
            },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
        });
        return certificate;
    }
    async getStudentCertificates(studentId) {
        return this.prisma.certificate.findMany({
            where: { studentId },
            include: {
                teacher: {
                    include: {
                        user: {
                            select: {
                                firstName: true,
                                lastName: true,
                            },
                        },
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
    async getTeacherIssuedCertificates(teacherId) {
        const teacher = await this.prisma.teacher.findUnique({
            where: { userId: teacherId },
        });
        if (!teacher) {
            throw new common_1.NotFoundException('Teacher not found');
        }
        return this.prisma.certificate.findMany({
            where: { teacherId: teacher.id },
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                    },
                },
            },
            orderBy: { issuedAt: 'desc' },
        });
    }
    async revokeCertificate(certificateId, reason) {
        const certificate = await this.prisma.certificate.findUnique({
            where: { id: certificateId },
        });
        if (!certificate) {
            throw new common_1.NotFoundException('Certificate not found');
        }
        return this.prisma.certificate.update({
            where: { id: certificateId },
            data: {
                status: 'REVOKED',
                revokedAt: new Date(),
                ...(reason && { revocationReason: reason }),
            },
        });
    }
    async generateCertificatePDF(data) {
        const doc = new PDFDocument({
            size: 'A4',
            layout: 'landscape',
            margins: { top: 50, bottom: 50, left: 50, right: 50 },
        });
        const fileName = `certificate-${Date.now()}.pdf`;
        const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
        if (!fs.existsSync(uploadsDir)) {
            fs.mkdirSync(uploadsDir, { recursive: true });
        }
        const filePath = path.join(uploadsDir, fileName);
        const stream = fs.createWriteStream(filePath);
        doc.pipe(stream);
        doc.rect(0, 0, doc.page.width, doc.page.height)
            .fill('#f8f9fa');
        doc.lineWidth(3)
            .strokeColor('#1e3a8a')
            .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
            .stroke();
        doc.fontSize(36)
            .fillColor('#1e3a8a')
            .font('Helvetica-Bold')
            .text('شهادة إجازة', doc.page.width / 2, 100, { align: 'center' });
        doc.fontSize(20)
            .fillColor('#4b5563')
            .font('Helvetica')
            .text('Certificate of Ijaza', doc.page.width / 2, 160, { align: 'center' });
        doc.fontSize(18)
            .fillColor('#1f2937')
            .font('Helvetica')
            .text('نشهد بأن', doc.page.width / 2, 250, { align: 'center' });
        doc.fontSize(24)
            .fillColor('#1e3a8a')
            .font('Helvetica-Bold')
            .text(data.studentName, doc.page.width / 2, 290, { align: 'center' });
        doc.fontSize(18)
            .fillColor('#1f2937')
            .font('Helvetica')
            .text('قد أتم حفظ وتلاوة', doc.page.width / 2, 340, { align: 'center' });
        if (data.surahName) {
            doc.fontSize(20)
                .fillColor('#059669')
                .font('Helvetica-Bold')
                .text(data.surahName, doc.page.width / 2, 380, { align: 'center' });
        }
        doc.fontSize(18)
            .fillColor('#1f2937')
            .font('Helvetica')
            .text('بإجازة من', doc.page.width / 2, 430, { align: 'center' });
        doc.fontSize(20)
            .fillColor('#1e3a8a')
            .font('Helvetica-Bold')
            .text(data.teacherName, doc.page.width / 2, 470, { align: 'center' });
        doc.fontSize(14)
            .fillColor('#6b7280')
            .font('Helvetica')
            .text(`تاريخ الإصدار: ${data.issuedAt.toLocaleDateString('ar-SA')}`, doc.page.width / 2, doc.page.height - 150, { align: 'center' });
        doc.fontSize(12)
            .fillColor('#9ca3af')
            .font('Helvetica')
            .text('منصة شيخي - Shaykhi Platform', doc.page.width / 2, doc.page.height - 100, { align: 'center' });
        doc.end();
        return new Promise((resolve, reject) => {
            stream.on('finish', () => {
                resolve(`/uploads/certificates/${fileName}`);
            });
            stream.on('error', reject);
        });
    }
};
exports.CertificateService = CertificateService;
exports.CertificateService = CertificateService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService])
], CertificateService);
//# sourceMappingURL=certificate.service.js.map