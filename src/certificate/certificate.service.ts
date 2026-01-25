import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCertificateDto } from './dto/create-certificate.dto';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class CertificateService {
  constructor(private prisma: PrismaService) {}

  async createCertificate(dto: CreateCertificateDto, teacherId: string) {
    // Verify teacher can issue certificates
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
    }

    if (!teacher.canIssueCertificates) {
      throw new BadRequestException('Teacher is not authorized to issue certificates');
    }

    // Verify student exists
    const student = await this.prisma.user.findUnique({
      where: { id: dto.studentId },
    });

    if (!student) {
      throw new NotFoundException('Student not found');
    }

    // Get teacher user
    const teacherUser = await this.prisma.user.findUnique({
      where: { id: teacher.userId },
      select: { firstName: true, lastName: true },
    });

    // Generate PDF certificate
    const pdfUrl = await this.generateCertificatePDF({
      studentName: `${student.firstName} ${student.lastName}`,
      teacherName: `${teacherUser?.firstName || ''} ${teacherUser?.lastName || ''}`,
      certificateType: dto.certificateType,
      surahName: dto.surahName,
      issuedAt: new Date(),
    });

    // Create certificate record
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

  async getStudentCertificates(studentId: string) {
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

  async getTeacherIssuedCertificates(teacherId: string) {
    const teacher = await this.prisma.teacher.findUnique({
      where: { userId: teacherId },
    });

    if (!teacher) {
      throw new NotFoundException('Teacher not found');
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

  async revokeCertificate(certificateId: string, reason: string) {
    const certificate = await this.prisma.certificate.findUnique({
      where: { id: certificateId },
    });

    if (!certificate) {
      throw new NotFoundException('Certificate not found');
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

  private async generateCertificatePDF(data: {
    studentName: string;
    teacherName: string;
    certificateType: string;
    surahName?: string;
    issuedAt: Date;
  }): Promise<string> {
    const doc = new PDFDocument({
      size: 'A4',
      layout: 'landscape',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const fileName = `certificate-${Date.now()}.pdf`;
    const uploadsDir = path.join(process.cwd(), 'uploads', 'certificates');
    
    // Ensure directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filePath = path.join(uploadsDir, fileName);
    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    // Background decoration
    doc.rect(0, 0, doc.page.width, doc.page.height)
      .fill('#f8f9fa');

    // Border
    doc.lineWidth(3)
      .strokeColor('#1e3a8a')
      .rect(30, 30, doc.page.width - 60, doc.page.height - 60)
      .stroke();

    // Title
    doc.fontSize(36)
      .fillColor('#1e3a8a')
      .font('Helvetica-Bold')
      .text('شهادة إجازة', doc.page.width / 2, 100, { align: 'center' });

    // Subtitle
    doc.fontSize(20)
      .fillColor('#4b5563')
      .font('Helvetica')
      .text('Certificate of Ijaza', doc.page.width / 2, 160, { align: 'center' });

    // Certificate text
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

    // Date
    doc.fontSize(14)
      .fillColor('#6b7280')
      .font('Helvetica')
      .text(
        `تاريخ الإصدار: ${data.issuedAt.toLocaleDateString('ar-SA')}`,
        doc.page.width / 2,
        doc.page.height - 150,
        { align: 'center' }
      );

    // Footer
    doc.fontSize(12)
      .fillColor('#9ca3af')
      .font('Helvetica')
      .text('منصة شيخي - Shaykhi Platform', doc.page.width / 2, doc.page.height - 100, { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => {
        // In production, upload to S3 and return URL
        // For now, return relative path
        resolve(`/uploads/certificates/${fileName}`);
      });
      stream.on('error', reject);
    });
  }
}

