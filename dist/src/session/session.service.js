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
exports.SessionService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const client_1 = require("@prisma/client");
const crypto = require("crypto");
let SessionService = class SessionService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.agoraAppId = this.config.get('AGORA_APP_ID');
        this.agoraAppCertificate = this.config.get('AGORA_APP_CERTIFICATE');
    }
    async create(bookingId, dto) {
        const booking = await this.prisma.booking.findUnique({
            where: { id: bookingId },
            include: {
                teacher: true,
                student: true,
            },
        });
        if (!booking) {
            throw new common_1.NotFoundException('Booking not found');
        }
        if (booking.status !== 'CONFIRMED') {
            throw new common_1.BadRequestException('Booking must be confirmed before creating session');
        }
        const payment = await this.prisma.payment.findUnique({
            where: { bookingId },
        });
        if (!payment || payment.status !== 'COMPLETED') {
            throw new common_1.BadRequestException('Payment must be completed before creating session');
        }
        const existingSession = await this.prisma.session.findUnique({
            where: { bookingId },
        });
        if (existingSession) {
            return existingSession;
        }
        const roomId = `room_${bookingId}_${Date.now()}`;
        const agoraToken = this.generateAgoraToken(roomId, dto.userId);
        const session = await this.prisma.session.create({
            data: {
                bookingId,
                type: dto.type || client_1.SessionType.VIDEO,
                roomId,
                agoraToken,
            },
            include: {
                booking: {
                    include: {
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                        student: true,
                    },
                },
            },
        });
        return session;
    }
    async getSession(bookingId, userId) {
        const session = await this.prisma.session.findUnique({
            where: { bookingId },
            include: {
                booking: {
                    include: {
                        teacher: {
                            include: {
                                user: true,
                            },
                        },
                        student: true,
                    },
                },
            },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        if (session.booking.studentId !== userId &&
            session.booking.teacher.userId !== userId) {
            throw new common_1.BadRequestException('You do not have access to this session');
        }
        const agoraToken = this.generateAgoraToken(session.roomId, userId);
        return {
            ...session,
            agoraToken,
        };
    }
    async startSession(bookingId) {
        const session = await this.prisma.session.findUnique({
            where: { bookingId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const updated = await this.prisma.session.update({
            where: { bookingId },
            data: {
                startedAt: new Date(),
            },
        });
        return updated;
    }
    async endSession(bookingId, recordingUrl) {
        const session = await this.prisma.session.findUnique({
            where: { bookingId },
        });
        if (!session) {
            throw new common_1.NotFoundException('Session not found');
        }
        const startedAt = session.startedAt || new Date();
        const endedAt = new Date();
        const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60);
        const updated = await this.prisma.session.update({
            where: { bookingId },
            data: {
                endedAt,
                recordingUrl,
                duration,
            },
        });
        await this.prisma.booking.update({
            where: { id: bookingId },
            data: {
                status: 'COMPLETED',
            },
        });
        return updated;
    }
    generateAgoraToken(channelName, uid) {
        if (!this.agoraAppId || !this.agoraAppCertificate) {
            return `placeholder_token_${Date.now()}`;
        }
        const appID = this.agoraAppId;
        const appCertificate = this.agoraAppCertificate;
        const role = 1;
        const expirationTimeInSeconds = 3600;
        const currentTimestamp = Math.floor(Date.now() / 1000);
        const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
        const token = this.buildToken(appID, appCertificate, channelName, uid, role, privilegeExpiredTs);
        return token;
    }
    buildToken(appID, appCertificate, channelName, uid, role, privilegeExpiredTs) {
        const tokenVersion = '006';
        const content = this.buildContent(appID, channelName, uid, role, privilegeExpiredTs);
        const signature = this.generateSignature(appCertificate, content);
        return `${tokenVersion}${signature}${content}`;
    }
    buildContent(appID, channelName, uid, role, privilegeExpiredTs) {
        const content = Buffer.alloc(32);
        content.writeUInt32BE(0, 0);
        content.writeUInt32BE(privilegeExpiredTs, 4);
        content.writeUInt32BE(role, 8);
        content.write(appID, 12);
        content.writeUInt32BE(0, 24);
        content.write(channelName, 28);
        return content.toString('base64');
    }
    generateSignature(appCertificate, content) {
        const hmac = crypto.createHmac('sha256', Buffer.from(appCertificate, 'base64'));
        hmac.update(Buffer.from(content, 'base64'));
        return hmac.digest('base64');
    }
};
exports.SessionService = SessionService;
exports.SessionService = SessionService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], SessionService);
//# sourceMappingURL=session.service.js.map