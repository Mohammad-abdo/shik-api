import { AuthService } from './auth.service';
import { SignUpDto, LoginDto, LoginMultiDto, VerifyOtpDto, RefreshTokenDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
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
    verifyEmail(dto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    verifyPhone(dto: VerifyOtpDto): Promise<{
        message: string;
    }>;
    refreshToken(dto: RefreshTokenDto): Promise<{
        accessToken: string;
        refreshToken: string;
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
    resendOtp(email?: string, phone?: string, type?: string): Promise<{
        message: string;
    }>;
    getMe(user: any): Promise<any>;
}
