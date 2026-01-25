import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { SignUpDto, MobileSignUpDto, LoginDto, VerifyOtpDto, RefreshTokenDto, LoginMultiDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { OtpService } from './otp.service';
export declare class AuthService {
    private prisma;
    private jwtService;
    private config;
    private otpService;
    private readonly MAX_LOGIN_ATTEMPTS;
    private readonly LOCKOUT_DURATION;
    constructor(prisma: PrismaService, jwtService: JwtService, config: ConfigService, otpService: OtpService);
    signUp(dto: SignUpDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    login(dto: LoginDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    mobileSignUp(dto: MobileSignUpDto, profileImageUrl?: string): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
                id: any;
                user_type: string;
                name: string;
                email: any;
                age: any;
                gender: any;
                memorized_parts: any;
                student_phone: any;
                parent_phone: any;
                profile_image_url: any;
                created_at: any;
                updated_at: any;
            };
            auth_token: string;
        };
    }>;
    private sanitizeMobileUser;
    mobileLogin(dto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
                id: any;
                user_type: string;
                name: string;
                email: any;
                age: any;
                gender: any;
                memorized_parts: any;
                student_phone: any;
                parent_phone: any;
                profile_image_url: any;
                created_at: any;
                updated_at: any;
            };
            auth_token: string;
        };
    }>;
    loginMulti(dto: LoginMultiDto): Promise<{
        accessToken: string;
        refreshToken: string;
        user: any;
    }>;
    sendLoginOtp(method: 'email' | 'phone', identifier: string): Promise<{
        message: string;
    }>;
    forgotPassword(dto: ForgotPasswordDto): Promise<{
        message: string;
    }>;
    resetPassword(dto: ResetPasswordDto): Promise<{
        message: string;
    }>;
    private checkLoginAttempts;
    private recordFailedAttempt;
    private resetFailedAttempts;
    verifyEmailOtp(dto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    verifyPhoneOtp(dto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    validateUser(userId: string): Promise<{
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
        avatar: string;
        role: import(".prisma/client").$Enums.UserRoleEnum;
        status: import(".prisma/client").$Enums.UserStatus;
        emailVerified: boolean;
        phoneVerified: boolean;
    }>;
    private generateTokens;
    mobileForgotPassword(dto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            otp: any;
            expires_at: Date;
            message: string;
        };
    }>;
    mobileResetPassword(dto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            user: {
                id: any;
                user_type: string;
                name: string;
                email: any;
                age: any;
                gender: any;
                memorized_parts: any;
                student_phone: any;
                parent_phone: any;
                profile_image_url: any;
                created_at: any;
                updated_at: any;
            };
            auth_token: string;
        };
    }>;
    private sanitizeUser;
}
