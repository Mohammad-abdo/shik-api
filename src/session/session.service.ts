import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { CreateSessionDto } from './dto';
import { SessionType } from '@prisma/client';
import * as crypto from 'crypto';

@Injectable()
export class SessionService {
  private agoraAppId: string;
  private agoraAppCertificate: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.agoraAppId = this.config.get<string>('AGORA_APP_ID');
    this.agoraAppCertificate = this.config.get<string>('AGORA_APP_CERTIFICATE');
  }

  async create(bookingId: string, dto: CreateSessionDto) {
    const booking = await this.prisma.booking.findUnique({
      where: { id: bookingId },
      include: {
        teacher: true,
        student: true,
      },
    });

    if (!booking) {
      throw new NotFoundException('Booking not found');
    }

    if (booking.status !== 'CONFIRMED') {
      throw new BadRequestException('Booking must be confirmed before creating session');
    }

    // Check if payment is completed
    const payment = await this.prisma.payment.findUnique({
      where: { bookingId },
    });

    if (!payment || payment.status !== 'COMPLETED') {
      throw new BadRequestException('Payment must be completed before creating session');
    }

    // Check if session already exists
    const existingSession = await this.prisma.session.findUnique({
      where: { bookingId },
    });

    if (existingSession) {
      return existingSession;
    }

    // Generate room ID
    const roomId = `room_${bookingId}_${Date.now()}`;

    // Generate Agora token
    const agoraToken = this.generateAgoraToken(roomId, dto.userId);

    // Create session
    const session = await this.prisma.session.create({
      data: {
        bookingId,
        type: dto.type || SessionType.VIDEO,
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

  async getSession(bookingId: string, userId: string) {
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
      throw new NotFoundException('Session not found');
    }

    // Check permissions
    if (
      session.booking.studentId !== userId &&
      session.booking.teacher.userId !== userId
    ) {
      throw new BadRequestException('You do not have access to this session');
    }

    // Generate fresh token
    const agoraToken = this.generateAgoraToken(session.roomId, userId);

    return {
      ...session,
      agoraToken,
    };
  }

  async startSession(bookingId: string) {
    const session = await this.prisma.session.findUnique({
      where: { bookingId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const updated = await this.prisma.session.update({
      where: { bookingId },
      data: {
        startedAt: new Date(),
      },
    });

    return updated;
  }

  async endSession(bookingId: string, recordingUrl?: string) {
    const session = await this.prisma.session.findUnique({
      where: { bookingId },
    });

    if (!session) {
      throw new NotFoundException('Session not found');
    }

    const startedAt = session.startedAt || new Date();
    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - startedAt.getTime()) / 1000 / 60); // minutes

    const updated = await this.prisma.session.update({
      where: { bookingId },
      data: {
        endedAt,
        recordingUrl,
        duration,
      },
    });

    // Update booking status to completed
    await this.prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'COMPLETED',
      },
    });

    return updated;
  }

  private generateAgoraToken(channelName: string, uid: string): string {
    if (!this.agoraAppId || !this.agoraAppCertificate) {
      // Return placeholder token if Agora is not configured
      return `placeholder_token_${Date.now()}`;
    }

    const appID = this.agoraAppId;
    const appCertificate = this.agoraAppCertificate;
    const role = 1; // 1 = publisher, 2 = subscriber
    const expirationTimeInSeconds = 3600; // 1 hour

    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Build token
    const token = this.buildToken(
      appID,
      appCertificate,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );

    return token;
  }

  private buildToken(
    appID: string,
    appCertificate: string,
    channelName: string,
    uid: string,
    role: number,
    privilegeExpiredTs: number,
  ): string {
    const tokenVersion = '006';
    const content = this.buildContent(
      appID,
      channelName,
      uid,
      role,
      privilegeExpiredTs,
    );
    const signature = this.generateSignature(appCertificate, content);
    return `${tokenVersion}${signature}${content}`;
  }

  private buildContent(
    appID: string,
    channelName: string,
    uid: string,
    role: number,
    privilegeExpiredTs: number,
  ): string {
    const content = Buffer.alloc(32);
    content.writeUInt32BE(0, 0); // salt
    content.writeUInt32BE(privilegeExpiredTs, 4); // ts
    content.writeUInt32BE(role, 8); // role
    content.write(appID, 12);
    content.writeUInt32BE(0, 24); // uid
    content.write(channelName, 28);

    return content.toString('base64');
  }

  private generateSignature(appCertificate: string, content: string): string {
    const hmac = crypto.createHmac('sha256', Buffer.from(appCertificate, 'base64'));
    hmac.update(Buffer.from(content, 'base64'));
    return hmac.digest('base64');
  }
}



