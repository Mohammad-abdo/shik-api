import {
    Controller,
    Post,
    Body,
    HttpCode,
    HttpStatus,
    UseInterceptors,
    UploadedFile,
    Get,
    UseGuards,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { MobileSignUpDto, ForgotPasswordDto, ResetPasswordDto } from './dto';
import { FileUploadService } from '../file-upload/file-upload.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@ApiTags('Mobile Auth')
@Controller('auth')
export class MobileAuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly fileUploadService: FileUploadService,
    ) { }

    @Post('register')
    @UseInterceptors(FileInterceptor('profile_image'))
    @ApiConsumes('multipart/form-data')
    @ApiOperation({ summary: 'Register a new user (Mobile)' })
    @ApiResponse({ status: 201, description: 'User registered successfully' })
    async register(
        @Body() dto: MobileSignUpDto,
        @UploadedFile() profileImage?: Express.Multer.File,
    ) {
        let profileImageUrl: string | undefined;
        if (profileImage) {
            try {
                profileImageUrl = await this.fileUploadService.uploadFile(profileImage, 'profiles');
            } catch (error) {
                console.error('File upload error:', error);
                // Continue registration without profile image if upload fails
                // You can either throw the error or continue without the image
                // For now, we'll continue without the image
                console.warn('Continuing registration without profile image due to upload failure');
            }
        }
        return this.authService.mobileSignUp(dto, profileImageUrl);
    }

    @Post('login')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Login user (Mobile)' })
    @ApiResponse({ status: 200, description: 'Login successful' })
    async login(@Body() dto: any) {
        return this.authService.mobileLogin(dto);
    }

    @Post('forgot-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Request OTP code for password reset' })
    async forgotPassword(@Body() dto: any) {
        // Mobile spec for forgot-password requires email, student_phone, parent_phone
        // Implementation in service might need adjustment
        return this.authService.mobileForgotPassword(dto);
    }

    @Post('reset-password')
    @HttpCode(HttpStatus.OK)
    @ApiOperation({ summary: 'Verify OTP and set new password' })
    async resetPassword(@Body() dto: any) {
        return this.authService.mobileResetPassword(dto);
    }
}

@ApiTags('Mobile User')
@Controller('user')
export class MobileUserController {
    constructor(private readonly authService: AuthService) { }

    @Get()
    @UseGuards(JwtAuthGuard)
    @ApiBearerAuth()
    @ApiOperation({ summary: 'Get authenticated user complete profile' })
    async getProfile(@CurrentUser() user: any) {
        return {
            success: true,
            message: 'تم جلب البيانات بنجاح',
            data: {
                user: this.sanitizeMobileUser(user),
            },
        };
    }

    private sanitizeMobileUser(user: any) {
        return {
            id: user.id || user.sub,
            user_type: user.role === 'TEACHER' ? 'sheikh' : 'student',
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
}
