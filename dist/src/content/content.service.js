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
exports.ContentService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const file_upload_service_1 = require("../file-upload/file-upload.service");
const client_1 = require("@prisma/client");
let ContentService = class ContentService {
    constructor(prisma, fileUploadService) {
        this.prisma = prisma;
        this.fileUploadService = fileUploadService;
    }
    async create(teacherId, dto, file) {
        const fileUrl = await this.fileUploadService.uploadFile(file, 'content');
        const content = await this.prisma.content.create({
            data: {
                teacherId,
                title: dto.title,
                description: dto.description,
                fileUrl,
                fileType: file.mimetype,
                contentType: dto.contentType,
                status: client_1.ContentStatus.PENDING,
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
    async getPendingContent(page = 1, limit = 20) {
        const skip = (page - 1) * limit;
        const [content, total] = await Promise.all([
            this.prisma.content.findMany({
                where: { status: client_1.ContentStatus.PENDING },
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
                where: { status: client_1.ContentStatus.PENDING },
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
    async getContentByTeacher(teacherId, status) {
        const where = { teacherId };
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
    async approve(contentId, adminId, dto) {
        const content = await this.prisma.content.findUnique({
            where: { id: contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        if (content.status !== client_1.ContentStatus.PENDING) {
            throw new common_1.ForbiddenException('Content is not pending approval');
        }
        const updated = await this.prisma.content.update({
            where: { id: contentId },
            data: {
                status: client_1.ContentStatus.APPROVED,
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
    async reject(contentId, adminId, dto) {
        const content = await this.prisma.content.findUnique({
            where: { id: contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        if (content.status !== client_1.ContentStatus.PENDING) {
            throw new common_1.ForbiddenException('Content is not pending approval');
        }
        const updated = await this.prisma.content.update({
            where: { id: contentId },
            data: {
                status: client_1.ContentStatus.REJECTED,
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
        if (dto.deleteFile) {
            await this.fileUploadService.deleteFile(content.fileUrl);
        }
        return updated;
    }
    async getContentById(id) {
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
            throw new common_1.NotFoundException('Content not found');
        }
        return content;
    }
    async deleteContent(contentId, teacherId) {
        const content = await this.prisma.content.findUnique({
            where: { id: contentId },
        });
        if (!content) {
            throw new common_1.NotFoundException('Content not found');
        }
        if (content.teacherId !== teacherId) {
            throw new common_1.ForbiddenException('You can only delete your own content');
        }
        await this.fileUploadService.deleteFile(content.fileUrl);
        await this.prisma.content.delete({
            where: { id: contentId },
        });
        return { message: 'Content deleted successfully' };
    }
};
exports.ContentService = ContentService;
exports.ContentService = ContentService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        file_upload_service_1.FileUploadService])
], ContentService);
//# sourceMappingURL=content.service.js.map