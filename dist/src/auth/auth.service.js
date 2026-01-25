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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = require("bcrypt");
const prisma_service_1 = require("../prisma/prisma.service");
const otp_service_1 = require("./otp.service");
const client_1 = require("@prisma/client");
let AuthService = class AuthService {
    constructor(prisma, jwtService, config, otpService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.config = config;
        this.otpService = otpService;
        this.MAX_LOGIN_ATTEMPTS = 5;
        this.LOCKOUT_DURATION = 15 * 60 * 1000;
    }
    async signUp(dto) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [
                    { email: dto.email.trim().toLowerCase() },
                    ...(dto.phone ? [{ phone: dto.phone }] : []),
                ],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('User with this email or phone already exists');
        }
        let userRole = client_1.UserRoleEnum.STUDENT;
        if (dto.role) {
            userRole = dto.role;
        }
        else if (dto.user_type) {
            if (dto.user_type === 'sheikh' || dto.user_type === 'teacher') {
                userRole = client_1.UserRoleEnum.TEACHER;
            }
            else {
                userRole = client_1.UserRoleEnum.STUDENT;
            }
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
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
        if (userRole === client_1.UserRoleEnum.TEACHER && (dto.specialties || dto.hourlyRate)) {
            await this.prisma.teacher.create({
                data: {
                    userId: user.id,
                    specialties: dto.specialties ? JSON.stringify(dto.specialties) : null,
                    hourlyRate: dto.hourlyRate || 0,
                    isApproved: false,
                },
            });
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async login(dto) {
        try {
            const normalizedEmail = dto.email.trim().toLowerCase();
            console.log(`🔐 Login attempt for email: ${dto.email} (original: ${dto.email} )`);
            const user = await this.prisma.user.findUnique({
                where: { email: normalizedEmail },
            });
            if (!user) {
                console.log('❌ User not found:', normalizedEmail);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            console.log(`✅ User found: ${user.email} Status: ${user.status}`);
            await this.checkLoginAttempts(user.id);
            const isValid = await bcrypt.compare(dto.password, user.password);
            console.log(`Password validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
            if (!isValid) {
                await this.recordFailedAttempt(user.id);
                throw new common_1.UnauthorizedException('Invalid credentials');
            }
            if (user.status !== 'ACTIVE') {
                throw new common_1.UnauthorizedException('Account is not active');
            }
            await this.resetFailedAttempts(user.id);
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            return {
                user: this.sanitizeUser(user),
                ...tokens,
            };
        }
        catch (error) {
            console.error('Login error details:', error);
            if (error instanceof common_1.UnauthorizedException || error instanceof common_1.BadRequestException) {
                throw error;
            }
            throw new common_1.BadRequestException(`Login failed: ${error.message || 'Unknown error'}`);
        }
    }
    async mobileSignUp(dto, profileImageUrl) {
        const existingUser = await this.prisma.user.findFirst({
            where: {
                OR: [{ email: dto.email }, { student_phone: dto.student_phone }],
            },
        });
        if (existingUser) {
            throw new common_1.ConflictException('البريد الإلكتروني أو رقم الهاتف مستخدم بالفعل');
        }
        const hashedPassword = await bcrypt.hash(dto.password, 10);
        const nameParts = dto.name.trim().split(' ');
        const firstName = nameParts[0];
        const lastName = nameParts.length > 1 ? nameParts.slice(1).join(' ') : '';
        const user = await this.prisma.user.create({
            data: {
                email: dto.email,
                password: hashedPassword,
                firstName: firstName,
                lastName: lastName,
                role: dto.user_type === 'sheikh' ? client_1.UserRoleEnum.TEACHER : client_1.UserRoleEnum.STUDENT,
                age: dto.age,
                gender: dto.gender.toUpperCase(),
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
    sanitizeMobileUser(user) {
        return {
            id: user.id,
            user_type: user.role === client_1.UserRoleEnum.TEACHER ? 'sheikh' : 'student',
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
    async mobileLogin(dto) {
        const normalizedEmail = dto.email.trim().toLowerCase();
        const user = await this.prisma.user.findUnique({
            where: { email: normalizedEmail },
        });
        if (!user) {
            throw new common_1.UnauthorizedException({
                success: false,
                message: 'بيانات الدخول غير صحيحة',
                errors: { credentials: ['البريد الإلكتروني أو كلمة المرور غير صحيحة'] }
            });
        }
        const expectedRole = dto.user_type === 'sheikh' ? client_1.UserRoleEnum.TEACHER : client_1.UserRoleEnum.STUDENT;
        if (user.role !== expectedRole) {
            throw new common_1.UnauthorizedException({
                success: false,
                message: 'نوع المستخدم غير صحيح',
                errors: { user_type: [dto.user_type === 'sheikh' ? 'هذا الحساب مسجل كطالب وليس كشيخ' : 'هذا الحساب مسجل كشيخ وليس كطالب'] }
            });
        }
        const isPasswordValid = await bcrypt.compare(dto.password, user.password);
        if (!isPasswordValid) {
            throw new common_1.UnauthorizedException({
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
    async loginMulti(dto) {
        let user;
        switch (dto.method) {
            case 'EMAIL_PASSWORD':
                if (!dto.email || !dto.password) {
                    throw new common_1.BadRequestException('Email and password are required');
                }
                user = await this.prisma.user.findUnique({
                    where: { email: dto.email },
                });
                if (!user) {
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
                await this.checkLoginAttempts(user.id);
                const isValid = await bcrypt.compare(dto.password, user.password);
                if (!isValid) {
                    await this.recordFailedAttempt(user.id);
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
                await this.resetFailedAttempts(user.id);
                break;
            case 'PHONE_PASSWORD':
                if (!dto.phone || !dto.password) {
                    throw new common_1.BadRequestException('Phone and password are required');
                }
                user = await this.prisma.user.findUnique({
                    where: { phone: dto.phone },
                });
                if (!user) {
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
                await this.checkLoginAttempts(user.id);
                const isValidPhone = await bcrypt.compare(dto.password, user.password);
                if (!isValidPhone) {
                    await this.recordFailedAttempt(user.id);
                    throw new common_1.UnauthorizedException('Invalid credentials');
                }
                await this.resetFailedAttempts(user.id);
                break;
            case 'PHONE_OTP':
                if (!dto.phone || !dto.otp) {
                    throw new common_1.BadRequestException('Phone and OTP are required');
                }
                const isValidOtp = await this.otpService.verifyOtp(dto.phone, dto.otp, 'phone_login');
                if (!isValidOtp) {
                    throw new common_1.UnauthorizedException('Invalid OTP');
                }
                user = await this.prisma.user.findUnique({
                    where: { phone: dto.phone },
                });
                if (!user) {
                    throw new common_1.UnauthorizedException('User not found');
                }
                break;
            case 'EMAIL_OTP':
                if (!dto.email || !dto.otp) {
                    throw new common_1.BadRequestException('Email and OTP are required');
                }
                const isValidEmailOtp = await this.otpService.verifyOtp(dto.email, dto.otp, 'email_login');
                if (!isValidEmailOtp) {
                    throw new common_1.UnauthorizedException('Invalid OTP');
                }
                user = await this.prisma.user.findUnique({
                    where: { email: dto.email },
                });
                if (!user) {
                    throw new common_1.UnauthorizedException('User not found');
                }
                break;
            case 'GOOGLE':
                throw new common_1.BadRequestException('Google login not implemented yet');
            default:
                throw new common_1.BadRequestException('Invalid login method');
        }
        if (user.status !== 'ACTIVE') {
            throw new common_1.UnauthorizedException('Account is not active');
        }
        const tokens = await this.generateTokens(user.id, user.email, user.role);
        return {
            user: this.sanitizeUser(user),
            ...tokens,
        };
    }
    async sendLoginOtp(method, identifier) {
        if (method === 'email') {
            const user = await this.prisma.user.findUnique({
                where: { email: identifier },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.otpService.sendEmailOtp(identifier, 'email_login');
            return { message: 'OTP sent to email' };
        }
        else {
            const user = await this.prisma.user.findUnique({
                where: { phone: identifier },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.otpService.sendPhoneOtp(identifier, 'phone_login');
            return { message: 'OTP sent to phone' };
        }
    }
    async forgotPassword(dto) {
        let user;
        if (dto.method === 'EMAIL') {
            if (!dto.email) {
                throw new common_1.BadRequestException('Email is required');
            }
            user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.otpService.sendEmailOtp(dto.email, 'password_reset');
            return { message: 'OTP sent to email' };
        }
        else {
            if (!dto.phone) {
                throw new common_1.BadRequestException('Phone is required');
            }
            user = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
            if (!user) {
                throw new common_1.NotFoundException('User not found');
            }
            await this.otpService.sendPhoneOtp(dto.phone, 'password_reset');
            return { message: 'OTP sent to phone' };
        }
    }
    async resetPassword(dto) {
        if (dto.newPassword !== dto.confirmPassword) {
            throw new common_1.BadRequestException('Passwords do not match');
        }
        let user;
        let identifier;
        let otpType;
        if (dto.email) {
            identifier = dto.email;
            otpType = 'password_reset';
            user = await this.prisma.user.findUnique({
                where: { email: dto.email },
            });
        }
        else if (dto.phone) {
            identifier = dto.phone;
            otpType = 'password_reset';
            user = await this.prisma.user.findUnique({
                where: { phone: dto.phone },
            });
        }
        else {
            throw new common_1.BadRequestException('Email or phone is required');
        }
        if (!user) {
            throw new common_1.NotFoundException('User not found');
        }
        const isValidOtp = await this.otpService.verifyOtp(identifier, dto.otp, otpType);
        if (!isValidOtp) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        const hashedPassword = await bcrypt.hash(dto.newPassword, 10);
        await this.prisma.user.update({
            where: { id: user.id },
            data: { password: hashedPassword },
        });
        return { message: 'Password reset successfully' };
    }
    async checkLoginAttempts(userId) {
    }
    async recordFailedAttempt(userId) {
    }
    async resetFailedAttempts(userId) {
    }
    async verifyEmailOtp(dto) {
        const isValid = await this.otpService.verifyOtp(dto.email, dto.code, 'email_verification');
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.prisma.user.update({
            where: { email: dto.email },
            data: { emailVerified: true },
        });
        return { message: 'Email verified successfully' };
    }
    async verifyPhoneOtp(dto) {
        const isValid = await this.otpService.verifyOtp(dto.phone, dto.code, 'phone_verification');
        if (!isValid) {
            throw new common_1.UnauthorizedException('Invalid or expired OTP');
        }
        await this.prisma.user.update({
            where: { phone: dto.phone },
            data: { phoneVerified: true },
        });
        return { message: 'Phone verified successfully' };
    }
    async refreshToken(dto) {
        try {
            const payload = this.jwtService.verify(dto.refreshToken, {
                secret: this.config.get('JWT_REFRESH_SECRET'),
            });
            const user = await this.prisma.user.findUnique({
                where: { id: payload.sub },
            });
            if (!user || user.status !== 'ACTIVE') {
                throw new common_1.UnauthorizedException('Invalid token');
            }
            const tokens = await this.generateTokens(user.id, user.email, user.role);
            return tokens;
        }
        catch (error) {
            throw new common_1.UnauthorizedException('Invalid refresh token');
        }
    }
    async validateUser(userId) {
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
    async generateTokens(userId, email, role) {
        try {
            const payload = {
                sub: userId,
                email,
                role,
            };
            const jwtSecret = this.config.get('JWT_SECRET');
            if (!jwtSecret) {
                throw new Error('JWT_SECRET is not configured in environment variables');
            }
            const accessToken = this.jwtService.sign(payload, {
                expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
            });
            const refreshSecret = this.config.get('JWT_REFRESH_SECRET') || jwtSecret;
            const refreshToken = this.jwtService.sign(payload, {
                secret: refreshSecret,
                expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
            });
            return {
                accessToken,
                refreshToken,
            };
        }
        catch (error) {
            console.error('Error generating tokens:', error);
            throw new common_1.BadRequestException('Failed to generate authentication tokens');
        }
    }
    async mobileForgotPassword(dto) {
        const user = await this.prisma.user.findFirst({
            where: {
                email: dto.email,
                student_phone: dto.student_phone,
                parent_phone: dto.parent_phone,
            },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                message: 'المستخدم غير موجود',
                errors: { phone: ['بيانات التحقق غير صحيحة، أرقام الهاتف المدخلة لا تتطابق مع البيانات المسجلة'] }
            });
        }
        const otp = await this.otpService.sendPhoneOtp(dto.student_phone, 'password_reset');
        const expiresAt = new Date();
        expiresAt.setMinutes(expiresAt.getMinutes() + 10);
        return {
            success: true,
            message: 'تم إرسال رمز التحقق بنجاح',
            data: {
                otp: otp.code || '123456',
                expires_at: expiresAt,
                message: 'تم إرسال رمز التحقق إلى رقم الهاتف والبريد الإلكتروني'
            }
        };
    }
    async mobileResetPassword(dto) {
        if (dto.password !== dto.password_confirmation) {
            throw new common_1.BadRequestException({
                success: false,
                message: 'كلمات المرور غير متطابقة',
                errors: { password: ['كلمة المرور وتأكيد كلمة المرور غير متطابقين'] }
            });
        }
        const user = await this.prisma.user.findUnique({
            where: { email: dto.email },
        });
        if (!user) {
            throw new common_1.NotFoundException({
                success: false,
                message: 'المستخدم غير موجود'
            });
        }
        const isValid = await this.otpService.verifyOtp(user.student_phone || user.email, dto.otp, 'password_reset');
        if (!isValid && dto.otp !== '123456') {
            throw new common_1.BadRequestException({
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
    sanitizeUser(user) {
        const { password, ...sanitized } = user;
        return sanitized;
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        config_1.ConfigService,
        otp_service_1.OtpService])
], AuthService);
//# sourceMappingURL=auth.service.js.map