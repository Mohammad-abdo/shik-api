import { AuthService } from './auth.service';
import { MobileSignUpDto } from './dto';
import { FileUploadService } from '../file-upload/file-upload.service';
export declare class MobileAuthController {
    private readonly authService;
    private readonly fileUploadService;
    constructor(authService: AuthService, fileUploadService: FileUploadService);
    register(dto: MobileSignUpDto, profileImage?: Express.Multer.File): Promise<{
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
    login(dto: any): Promise<{
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
    forgotPassword(dto: any): Promise<{
        success: boolean;
        message: string;
        data: {
            otp: any;
            expires_at: Date;
            message: string;
        };
    }>;
    resetPassword(dto: any): Promise<{
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
}
export declare class MobileUserController {
    private readonly authService;
    constructor(authService: AuthService);
    getProfile(user: any): Promise<{
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
        };
    }>;
    private sanitizeMobileUser;
}
