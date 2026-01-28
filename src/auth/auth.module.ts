import { Module, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { MobileAuthController, MobileUserController } from './mobile-auth.controller';
import { AuthService } from './auth.service';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { OtpService } from './otp.service';
import { FileUploadModule } from '../file-upload/file-upload.module';

@Module({
  imports: [
    PassportModule,
    FileUploadModule,
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const jwtSecret = config.get<string>('JWT_SECRET');
        if (!jwtSecret) {
          Logger.warn('JWT_SECRET is not set in environment variables. Please set JWT_SECRET in your .env file.');
          throw new Error('JWT_SECRET is required but not configured');
        }
        return {
          secret: jwtSecret,
          signOptions: {
            expiresIn: config.get<string>('JWT_EXPIRES_IN') || '15m',
          },
        };
      },
    }),
  ],
  controllers: [AuthController, MobileAuthController, MobileUserController],
  providers: [AuthService, JwtStrategy, LocalStrategy, OtpService],
  exports: [AuthService],
})
export class AuthModule { }



