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
exports.OtpService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const prisma_service_1 = require("../prisma/prisma.service");
const nodemailer = require("nodemailer");
let OtpService = class OtpService {
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        this.transporter = nodemailer.createTransport({
            host: this.config.get('SMTP_HOST'),
            port: this.config.get('SMTP_PORT'),
            secure: false,
            auth: {
                user: this.config.get('SMTP_USER'),
                pass: this.config.get('SMTP_PASS'),
            },
        });
    }
    generateOtp(length = 6) {
        const digits = '0123456789';
        let otp = '';
        for (let i = 0; i < length; i++) {
            otp += digits[Math.floor(Math.random() * 10)];
        }
        return otp;
    }
    async sendEmailOtp(email, type) {
        const code = this.generateOtp(parseInt(this.config.get('OTP_LENGTH') || '6'));
        const expiresIn = parseInt(this.config.get('OTP_EXPIRES_IN') || '300');
        await this.prisma.otp.create({
            data: {
                email,
                code,
                type,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
            },
        });
        await this.transporter.sendMail({
            from: this.config.get('SMTP_FROM'),
            to: email,
            subject: 'Verification Code - Shaykhi',
            html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Your Verification Code</h2>
          <p>Your verification code is: <strong style="font-size: 24px; color: #22c55e;">${code}</strong></p>
          <p>This code will expire in ${expiresIn / 60} minutes.</p>
          <p>If you didn't request this code, please ignore this email.</p>
        </div>
      `,
        });
    }
    async sendPhoneOtp(phone, type) {
        const code = this.generateOtp(parseInt(this.config.get('OTP_LENGTH') || '6'));
        const expiresIn = parseInt(this.config.get('OTP_EXPIRES_IN') || '300');
        await this.prisma.otp.create({
            data: {
                phone,
                code,
                type,
                expiresAt: new Date(Date.now() + expiresIn * 1000),
            },
        });
        console.log(`OTP for ${phone}: ${code}`);
    }
    async verifyOtp(emailOrPhone, code, type) {
        const otp = await this.prisma.otp.findFirst({
            where: {
                OR: [{ email: emailOrPhone }, { phone: emailOrPhone }],
                code,
                type,
                isUsed: false,
                expiresAt: {
                    gt: new Date(),
                },
            },
            orderBy: {
                createdAt: 'desc',
            },
        });
        if (!otp) {
            return false;
        }
        await this.prisma.otp.update({
            where: { id: otp.id },
            data: { isUsed: true },
        });
        return true;
    }
};
exports.OtpService = OtpService;
exports.OtpService = OtpService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], OtpService);
//# sourceMappingURL=otp.service.js.map