import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FileUploadService } from '../file-upload/file-upload.service';
import { CreateContentDto, ApproveContentDto, RejectContentDto } from './dto';
import { ContentStatus, ContentType } from '@prisma/client';

@Injectable()
export class ContentService {
  constructor(
    private prisma: PrismaService,
    private fileUploadService: FileUploadService,
  ) {}

  async create(teacherId: string, dto: CreateContentDto, file: Express.Multer.File) {
    // Upload file
    const fileUrl = await this.fileUploadService.uploadFile(file, 'content');

    // Create content record
    const content = await this.prisma.content.create({
      data: {
        teacherId,
        title: dto.title,
        description: dto.description,
        fileUrl,
        fileType: file.mimetype,
        contentType: dto.contentType,
        status: ContentStatus.PENDING,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return content;
  }

  async getPendingContent(page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const [content, total] = await Promise.all([
      this.prisma.content.findMany({
        where: { status: ContentStatus.PENDING },
        skip,
        take: limit,
        include: {
          teacher: {
            include: {
              user: {
                select: {
                  id: true,
                  firstName: true,
                  lastName: true,
                  email: true,
                  avatar: true,
                },
              },
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.content.count({
        where: { status: ContentStatus.PENDING },
      }),
    ]);

    return {
      content,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getContentByTeacher(teacherId: string, status?: ContentStatus) {
    const where: any = { teacherId };
    if (status) {
      where.status = status;
    }

    return this.prisma.content.findMany({
      where,
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async approve(contentId: string, adminId: string, dto: ApproveContentDto) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.status !== ContentStatus.PENDING) {
      throw new ForbiddenException('Content is not pending approval');
    }

    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ContentStatus.APPROVED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    return updated;
  }

  async reject(contentId: string, adminId: string, dto: RejectContentDto) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.status !== ContentStatus.PENDING) {
      throw new ForbiddenException('Content is not pending approval');
    }

    const updated = await this.prisma.content.update({
      where: { id: contentId },
      data: {
        status: ContentStatus.REJECTED,
        reviewedBy: adminId,
        reviewedAt: new Date(),
        rejectionReason: dto.reason,
      },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
    });

    // Optionally delete the file
    if (dto.deleteFile) {
      await this.fileUploadService.deleteFile(content.fileUrl);
    }

    return updated;
  }

  async getContentById(id: string) {
    const content = await this.prisma.content.findUnique({
      where: { id },
      include: {
        teacher: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    return content;
  }

  async deleteContent(contentId: string, teacherId: string) {
    const content = await this.prisma.content.findUnique({
      where: { id: contentId },
    });

    if (!content) {
      throw new NotFoundException('Content not found');
    }

    if (content.teacherId !== teacherId) {
      throw new ForbiddenException('You can only delete your own content');
    }

    // Delete file
    await this.fileUploadService.deleteFile(content.fileUrl);

    // Delete record
    await this.prisma.content.delete({
      where: { id: contentId },
    });

    return { message: 'Content deleted successfully' };
  }
}



