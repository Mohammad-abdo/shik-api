import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';

@Injectable()
export class OtpService {
  private transporter;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    // Initialize email transporter
    this.transporter = nodemailer.createTransport({
      host: this.config.get<string>('SMTP_HOST'),
      port: this.config.get<number>('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get<string>('SMTP_USER'),
        pass: this.config.get<string>('SMTP_PASS'),
      },
    });
  }

  generateOtp(length: number = 6): string {
    const digits = '0123456789';
    let otp = '';
    for (let i = 0; i < length; i++) {
      otp += digits[Math.floor(Math.random() * 10)];
    }
    return otp;
  }

  async sendEmailOtp(email: string, type: string): Promise<void> {
    const code = this.generateOtp(
      parseInt(this.config.get<string>('OTP_LENGTH') || '6'),
    );
    const expiresIn = parseInt(this.config.get<string>('OTP_EXPIRES_IN') || '300');

    // Save OTP to database
    await this.prisma.otp.create({
      data: {
        email,
        code,
        type,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    // Send email
    await this.transporter.sendMail({
      from: this.config.get<string>('SMTP_FROM'),
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

  async sendPhoneOtp(phone: string, type: string): Promise<void> {
    const code = this.generateOtp(
      parseInt(this.config.get<string>('OTP_LENGTH') || '6'),
    );
    const expiresIn = parseInt(this.config.get<string>('OTP_EXPIRES_IN') || '300');

    // Save OTP to database
    await this.prisma.otp.create({
      data: {
        phone,
        code,
        type,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
      },
    });

    // TODO: Integrate with SMS service (Twilio, etc.)
    // For now, just log the OTP
    console.log(`OTP for ${phone}: ${code}`);
  }

  async verifyOtp(emailOrPhone: string, code: string, type: string): Promise<boolean> {
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

    // Mark OTP as used
    await this.prisma.otp.update({
      where: { id: otp.id },
      data: { isUsed: true },
    });

    return true;
  }
}



