import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import {
  SignUpDto,
  MobileSignUpDto,
  LoginDto,
  VerifyOtpDto,
  RefreshTokenDto,
  LoginMultiDto,
  ForgotPasswordDto,
  ResetPasswordDto,
} from './dto';
import { JwtPayload } from '../common/interfaces/jwt-payload.interface';
import { OtpService } from './otp.service';
import { UserRoleEnum as UserRole, Gender } from '@prisma/client';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS = 5;
  private readonly LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private config: ConfigService,
    private otpService: OtpService,
  ) { }

  async signUp(dto: SignUpDto) {
    // Check if user already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: dto.email.trim().toLowerCase() },
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      },
    });

    if (existingUser) {
      throw new ConflictException('User with this email or phone already exists');
    }

    // Determine role from user_type or role field
    let userRole: UserRole = UserRole.STUDENT;
    if (dto.role) {
      userRole = dto.role;
    } else if (dto.user_type) {
      if (dto.user_type === 'sheikh' || dto.user_type === 'teacher') {
        userRole = UserRole.TEACHER;
      } else {
        userRole = UserRole.STUDENT;
      }
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email.trim().toLowerCase(),
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phone: dto.phone,
        role: userRole,
        status: 'ACTIVE',
      },
    });

    // Create teacher profile if user is a teacher
    if (userRole === UserRole.TEACHER && (dto.specialties || dto.hourlyRate)) {
      await this.prisma.teacher.create({
        data: {
          userId: user.id,
          specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
          hourlyRate: dto.hourlyRate || 0,
          isApproved: false,
        },
      });
    }

    // Generate tokens
    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async login(dto: LoginDto) {
    try {
      const normalizedEmail = dto.email.trim().toLowerCase();
      const user = await this.prisma.user.findUnique({
        where: { email: normalizedEmail },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid credentials');
      }

      await this.checkLoginAttempts(user.id);
      const isValid = await bcrypt.compare(dto.password, user.password);

      if (!isValid) {
        await this.recordFailedAttempt(user.id);
        throw new UnauthorizedException('Invalid credentials');
      }

      if (user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Account is not active');
      }

      await this.resetFailedAttempts(user.id);
      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return {
        user: this.sanitizeUser(user),
        ...tokens,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.warn(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
      throw new BadRequestException(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async mobileSignUp(dto: MobileSignUpDto, profileImageUrl?: string) {
    // Check if user exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ email: dto.email }, { student_phone: dto.student_phone }],
      },
    });

    if (existingUser) {
      throw new ConflictException('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(dto.password, 10);

    // Split name into firstName and lastName for compatibility
    const nameParts = dto.name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';

    // Create user
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        password: hashedPassword,
        firstName: firstName,
        lastName: lastName,
        role: dto.user_type === 'sheikh' ? UserRole.TEACHER : UserRole.STUDENT,
        age: dto.age,
        gender: dto.gender.toUpperCase() as Gender,
        memorized_parts: dto.memorized_parts,
        student_phone: dto.student_phone,
        parent_phone: dto.parent_phone,
        avatar: profileImageUrl,
        status: 'ACTIVE',
      },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      success: true,
      message: 'تم التسجيل بنجاح',
      data: {
        user: this.sanitizeMobileUser(user),
        auth_token: tokens.accessToken,
      },
    };
  }

  private sanitizeMobileUser(user: any) {
    return {
      id: user.id,
      user_type: user.role === UserRole.TEACHER ? 'sheikh' : 'student',
      name: `${user.firstName} ${user.lastName}`.trim(),
      email: user.email,
      age: user.age,
      gender: user.gender?.toLowerCase(),
      memorized_parts: user.memorized_parts,
      student_phone: user.student_phone,
      parent_phone: user.parent_phone,
      profile_image_url: user.avatar,
      created_at: user.createdAt,
      updated_at: user.updatedAt,
    };
  }

  async mobileLogin(dto: any) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
        errors: { credentials: ['البريد الإلكتروني أو كلمة المرور غير صحيحة'] }
      });
    }

    // Check user type
    const expectedRole = dto.user_type === 'sheikh' ? UserRole.TEACHER : UserRole.STUDENT;
    if (user.role !== expectedRole) {
      throw new UnauthorizedException({
        success: false,
        message: 'نوع المستخدم غير صحيح',
        errors: { user_type: [dto.user_type === 'sheikh' ? 'هذا الحساب مسجل كطالب وليس كشيخ' : 'هذا الحساب مسجل كشيخ وليس كطالب'] }
      });
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException({
        success: false,
        message: 'بيانات الدخول غير صحيحة',
        errors: { credentials: ['البريد الإلكتروني أو كلمة المرور غير صحيحة'] }
      });
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      success: true,
      message: 'تم تسجيل الدخول بنجاح',
      data: {
        user: this.sanitizeMobileUser(user),
        auth_token: tokens.accessToken,
      },
    };
  }

  async loginMulti(dto: LoginMultiDto) {
    let user;

    switch (dto.method) {
      case 'EMAIL_PASSWORD':
        if (!dto.email || !dto.password) {
          throw new BadRequestException('Email and password are required');
        }
        user = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
        await this.checkLoginAttempts(user.id);
        const isValid = await bcrypt.compare(dto.password, user.password);
        if (!isValid) {
          await this.recordFailedAttempt(user.id);
          throw new UnauthorizedException('Invalid credentials');
        }
        await this.resetFailedAttempts(user.id);
        break;

      case 'PHONE_PASSWORD':
        if (!dto.phone || !dto.password) {
          throw new BadRequestException('Phone and password are required');
        }
        user = await this.prisma.user.findUnique({
          where: { phone: dto.phone },
        });
        if (!user) {
          throw new UnauthorizedException('Invalid credentials');
        }
        await this.checkLoginAttempts(user.id);
        const isValidPhone = await bcrypt.compare(dto.password, user.password);
        if (!isValidPhone) {
          await this.recordFailedAttempt(user.id);
          throw new UnauthorizedException('Invalid credentials');
        }
        await this.resetFailedAttempts(user.id);
        break;

      case 'PHONE_OTP':
        if (!dto.phone || !dto.otp) {
          throw new BadRequestException('Phone and OTP are required');
        }
        const isValidOtp = await this.otpService.verifyOtp(
          dto.phone,
          dto.otp,
          'phone_login',
        );
        if (!isValidOtp) {
          throw new UnauthorizedException('Invalid OTP');
        }
        user = await this.prisma.user.findUnique({
          where: { phone: dto.phone },
        });
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        break;

      case 'EMAIL_OTP':
        if (!dto.email || !dto.otp) {
          throw new BadRequestException('Email and OTP are required');
        }
        const isValidEmailOtp = await this.otpService.verifyOtp(
          dto.email,
          dto.otp,
          'email_login',
        );
        if (!isValidEmailOtp) {
          throw new UnauthorizedException('Invalid OTP');
        }
        user = await this.prisma.user.findUnique({
          where: { email: dto.email },
        });
        if (!user) {
          throw new UnauthorizedException('User not found');
        }
        break;

      case 'GOOGLE':
        // TODO: Implement Google OAuth verification
        throw new BadRequestException('Google login not implemented yet');
      default:
        throw new BadRequestException('Invalid login method');
    }

    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('Account is not active');
    }

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      user: this.sanitizeUser(user),
      ...tokens,
    };
  }

  async sendLoginOtp(method: 'email' | 'phone', identifier: string) {
    if (method === 'email') {
      const user = await this.prisma.user.findUnique({
        where: { email: identifier },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.otpService.sendEmailOtp(identifier, 'email_login');
      return { message: 'OTP sent to email' };
    } else {
      const user = await this.prisma.user.findUnique({
        where: { phone: identifier },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.otpService.sendPhoneOtp(identifier, 'phone_login');
      return { message: 'OTP sent to phone' };
    }
  }

  async forgotPassword(dto: ForgotPasswordDto) {
    let user;
    if (dto.method === 'EMAIL') {
      if (!dto.email) {
        throw new BadRequestException('Email is required');
      }
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.otpService.sendEmailOtp(dto.email, 'password_reset');
      return { message: 'OTP sent to email' };
    } else {
      if (!dto.phone) {
        throw new BadRequestException('Phone is required');
      }
      user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }
      await this.otpService.sendPhoneOtp(dto.phone, 'password_reset');
      return { message: 'OTP sent to phone' };
    }
  }

  async resetPassword(dto: ResetPasswordDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    let user;
    let identifier: string;
    let otpType: string;

    if (dto.email) {
      identifier = dto.email;
      otpType = 'password_reset';
      user = await this.prisma.user.findUnique({
        where: { email: dto.email },
      });
    } else if (dto.phone) {
      identifier = dto.phone;
      otpType = 'password_reset';
      user = await this.prisma.user.findUnique({
        where: { phone: dto.phone },
      });
    } else {
      throw new BadRequestException('Email or phone is required');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Verify OTP
    const isValidOtp = await this.otpService.verifyOtp(identifier, dto.otp, otpType);
    if (!isValidOtp) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    // Update password
    await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    return { message: 'Password reset successfully' };
  }

  private async checkLoginAttempts(userId: string) {
    // This would typically be stored in Redis or a separate table
    // For now, we'll use a simple approach
    // In production, use Redis for rate limiting
  }

  private async recordFailedAttempt(userId: string) {
    // Record failed attempt
    // In production, use Redis
  }

  private async resetFailedAttempts(userId: string) {
    // Reset failed attempts
    // In production, use Redis
  }

  async verifyEmailOtp(dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto.email, dto.code, 'email_verification');

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { email: dto.email },
      data: { emailVerified: true },
    });

    return { message: 'Email verified successfully' };
  }

  async verifyPhoneOtp(dto: VerifyOtpDto) {
    const isValid = await this.otpService.verifyOtp(dto.phone, dto.code, 'phone_verification');

    if (!isValid) {
      throw new UnauthorizedException('Invalid or expired OTP');
    }

    await this.prisma.user.update({
      where: { phone: dto.phone },
      data: { phoneVerified: true },
    });

    return { message: 'Phone verified successfully' };
  }

  async refreshToken(dto: RefreshTokenDto) {
    try {
      const payload = this.jwtService.verify(dto.refreshToken, {
        secret: this.config.get<string>('JWT_REFRESH_SECRET'),
      });

      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
      });

      if (!user || user.status !== 'ACTIVE') {
        throw new UnauthorizedException('Invalid token');
      }

      const tokens = await this.generateTokens(user.id, user.email, user.role);

      return tokens;
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async validateUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        phone: true,
        firstName: true,
        lastName: true,
        avatar: true,
        role: true,
        status: true,
        emailVerified: true,
        phoneVerified: true,
      },
    });

    return user;
  }

  private async generateTokens(userId: string, email: string, role: UserRole) {
    try {
      const payload: JwtPayload = {
        sub: userId,
        email,
        role,
      };

      const jwtSecret = this.config.get<string>('JWT_SECRET');
      if (!jwtSecret) {
        throw new Error('JWT_SECRET is not configured in environment variables');
      }

      const accessToken = this.jwtService.sign(payload, {
        expiresIn: this.config.get<string>('JWT_EXPIRES_IN') || '15m',
      });

      const refreshSecret = this.config.get<string>('JWT_REFRESH_SECRET') || jwtSecret;
      const refreshToken = this.jwtService.sign(payload, {
        secret: refreshSecret,
        expiresIn: this.config.get<string>('JWT_REFRESH_EXPIRES_IN') || '7d',
      });

      return {
        accessToken,
        refreshToken,
      };
    } catch (error) {
      this.logger.error('Error generating tokens', error instanceof Error ? error.stack : String(error));
      throw new BadRequestException('Failed to generate authentication tokens');
    }
  }

  async mobileForgotPassword(dto: any) {
    const user = await this.prisma.user.findFirst({
      where: {
        email: dto.email,
        student_phone: dto.student_phone,
        parent_phone: dto.parent_phone,
      },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'المستخدم غير موجود',
        errors: { phone: ['بيانات التحقق غير صحيحة، أرقام الهاتف المدخلة لا تتطابق مع البيانات المسجلة'] }
      });
    }

    // In a real scenario, we'd send via SMS/Email
    // For now, using the otpService
    const otp = await this.otpService.sendPhoneOtp(dto.student_phone, 'password_reset');

    // Calculate expiry (e.g., 10 mins from now)
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);

    return {
      success: true,
      message: 'تم إرسال رمز التحقق بنجاح',
      data: {
        otp: (otp as any).code || '123456', // Fallback for dev
        expires_at: expiresAt,
        message: 'تم إرسال رمز التحقق إلى رقم الهاتف والبريد الإلكتروني'
      }
    };
  }

  async mobileResetPassword(dto: any) {
    if (dto.password !== dto.password_confirmation) {
      throw new BadRequestException({
        success: false,
        message: 'كلمات المرور غير متطابقة',
        errors: { password: ['كلمة المرور وتأكيد كلمة المرور غير متطابقين'] }
      });
    }

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email },
    });

    if (!user) {
      throw new NotFoundException({
        success: false,
        message: 'المستخدم غير موجود'
      });
    }

    // Verify OTP
    const isValid = await this.otpService.verifyOtp(user.student_phone || user.email, dto.otp, 'password_reset');
    if (!isValid && dto.otp !== '123456') { // Allow 123456 as default OTP for testing if needed
      throw new BadRequestException({
        success: false,
        message: 'رمز التحقق غير صحيح',
        errors: { otp: ['رمز التحقق المدخل غير صحيح'] }
      });
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);

    const updatedUser = await this.prisma.user.update({
      where: { id: user.id },
      data: { password: hashedPassword },
    });

    const tokens = await this.generateTokens(user.id, user.email, user.role);

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح',
      data: {
        user: this.sanitizeMobileUser(updatedUser),
        auth_token: tokens.accessToken,
      },
    };
  }

  private sanitizeUser(user: any) {
    const { password, ...sanitized } = user;
    return sanitized;
  }
}
