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
exports.VideoService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const config_1 = require("@nestjs/config");
let VideoService = class VideoService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.appId = this.config.get('AGORA_APP_ID') || '';
        this.appCertificate = this.config.get('AGORA_APP_CERTIFICATE') || '';
    }
    async createSession(bookingId, userId) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                student: true,
                teacher: {
                    include: {
                        user: true,
                    },
                },
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.studentId !== userId && booking.teacher.userId !== userId) {
            throw new common_1.BadRequestException('You are not authorized to create session for this booking');
        }
        let session = await this.prisma.session.findUnique({
            where: { bookingId },
        });
        if (session) {
            const token = this.generateAgoraToken(session.roomId, userId);
            return {
                ...session,
                token,
            };
        }
        const roomId = `room_${bookingId}_${Date.now()}`;
        const token = this.generateAgoraToken(roomId, userId);
        session = await this.prisma.session.create({
            data: {
                bookingId,
                type: 'VIDEO',
                roomId,
                agoraToken: token,
                startedAt: new Date(),
            },
        });
        return session;
    }
    async getSessionToken(bookingId, userId) {
        const session = await this.prisma.session.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        student: true,
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.booking.studentId !== userId &&
            session.booking.teacher.userId !== userId) {
            throw new common_1.BadRequestException('You are not authorized to access this session');
        }
        const token = this.generateAgoraToken(session.roomId, userId);
        return {
            roomId: session.roomId,
            token,
            appId: this.appId,
        };
    }
    async endSession(bookingId, userId) {
        const session = await this.prisma.session.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        teacher: {
                            select: {
                                userId: true,
                            },
                        },
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.booking.studentId !== userId &&
            session.booking.teacher.userId !== userId) {
            throw new common_1.BadRequestException('You are not authorized to end this session');
        }
        const endedAt = new Date();
        const duration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60);
        await this.prisma.session.update({
            where: { id: session.id },
            data: {
                endedAt,
                duration,
            },
        });
        if (session.booking.status === 'CONFIRMED') {
            await this.prisma.booking.update({
                where: { id: bookingId },
                data: { status: 'COMPLETED' },
            });
        }
        return {
            message: 'Session ended successfully',
            duration,
        };
    }
    async getSessionHistory(userId, limit = 20) {
        const user = await this.prisma.user.findUnique({
            where: { id: userId },
        });
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const sessions = await this.prisma.session.findMany({
            where: {
                booking: {
                    OR: [
                        { studentId: userId },
                        { teacher: { userId } },
                    ],
                },
                endedAt: { not: null },
            },
            include: {
                booking: {
                    include: {
                        student: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                avatar: true,
                            },
                        },
                        teacher: {
                            include: {
                                user: {
                                    select: {
                                        id: true,
                                        firstName: true,
                                        lastName: true,
                                        avatar: true,
                                    },
                                },
                            },
                        },
                    },
                },
            },
            orderBy: { endedAt: 'desc' },
            take: limit,
        });
        return sessions;
    }
    generateAgoraToken(roomId, userId) {
        if (!this.appId || !this.appCertificate) {
            return 'mock_token_for_development';
        }
        const token = Buffer.from(`${this.appId}:${roomId}:${userId}:${Date.now()}`).toString('base64');
        return token;
    }
};
exports.VideoService = VideoService;
exports.VideoService = VideoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], VideoService);
//# sourceMappingURL=video.service.js.map