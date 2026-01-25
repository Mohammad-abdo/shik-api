import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
// Using agora-token instead of deprecated agora-access-token
// For now, we'll use a simple token generation
// In production, use: npm install agora-token

@Injectable()
export class VideoService {
  private readonly appId: string;
  private readonly appCertificate: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.appId = this.config.get<string>('AGORA_APP_ID') || '';
    this.appCertificate = this.config.get<string>('AGORA_APP_CERTIFICATE') || '';
  }

  async createSession(bookingId: string, userId: string) {
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
      throw new NotFoundException('Booking not found');
    }

    // Check if user is part of this booking
    if (booking.studentId !== userId && booking.teacher.userId !== userId) {
      throw new BadRequestException('You are not authorized to create session for this booking');
    }

    // Check if session already exists
    let session = await this.prisma.session.findUnique({
      where: { bookingId },
    });

    if (session) {
      // Generate new token
      const token = this.generateAgoraToken(session.roomId, userId);
      return {
        ...session,
        token,
      };
    }

    // Create new session
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

  async getSessionToken(bookingId: string, userId: string) {
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
      throw new NotFoundException('Session not found');
    }

    // Check authorization
    if (
      session.booking.studentId !== userId &&
      session.booking.teacher.userId !== userId
    ) {
      throw new BadRequestException('You are not authorized to access this session');
    }

    // Generate new token
    const token = this.generateAgoraToken(session.roomId, userId);

    return {
      roomId: session.roomId,
      token,
      appId: this.appId,
    };
  }

  async endSession(bookingId: string, userId: string) {
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
      throw new NotFoundException('Session not found');
    }

    // Check authorization
    if (
      session.booking.studentId !== userId &&
      session.booking.teacher.userId !== userId
    ) {
      throw new BadRequestException('You are not authorized to end this session');
    }

    const endedAt = new Date();
    const duration = Math.floor((endedAt.getTime() - session.startedAt.getTime()) / 1000 / 60); // minutes

    await this.prisma.session.update({
      where: { id: session.id },
      data: {
        endedAt,
        duration,
      },
    });

    // Update booking status if needed
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

  async getSessionHistory(userId: string, limit = 20) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
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

  private generateAgoraToken(roomId: string, userId: string): string {
    if (!this.appId || !this.appCertificate) {
      // Return mock token for development
      return 'mock_token_for_development';
    }

    // In production, use agora-token package:
    // import { RtcTokenBuilder, RtcRole } from 'agora-token';
    // const role = RtcRole.PUBLISHER;
    // const expirationTimeInSeconds = 3600;
    // const currentTimestamp = Math.floor(Date.now() / 1000);
    // const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;
    // return RtcTokenBuilder.buildTokenWithUid(
    //   this.appId,
    //   this.appCertificate,
    //   roomId,
    //   parseInt(userId.slice(-8), 16) || 0,
    //   role,
    //   privilegeExpiredTs,
    // );

    // For now, return a simple token
    const token = Buffer.from(
      `${this.appId}:${roomId}:${userId}:${Date.now()}`,
    ).toString('base64');
    return token;
  }
}

