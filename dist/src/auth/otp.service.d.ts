import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class OtpService {
    private prisma;
    private config;
    private transporter;
    constructor(prisma: PrismaService, config: ConfigService);
    generateOtp(length?: number): string;
    sendEmailOtp(email: string, type: string): Promise<void>;
    sendPhoneOtp(phone: string, type: string): Promise<void>;
    verifyOtp(emailOrPhone: string, code: string, type: string): Promise<boolean>;
}
