import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { ResponseTransformInterceptor } from './common/interceptors/response-transform.interceptor';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  Logger.error('Uncaught Exception:', error);
  // Don't exit the process, let NestJS handle it
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: any, promise: Promise<any>) => {
  Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit the process, let NestJS handle it
});

async function bootstrap() {
  try {
    const app = await NestFactory.create(AppModule, {
      rawBody: true, // Enable raw body for Stripe webhooks
      logger: ['error', 'warn', 'log', 'debug', 'verbose'],
    });

    // Enable CORS
    app.enableCors({
      origin: true, // Allow all origins in development
      credentials: true,
    });

    // Global validation pipe with error handling
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        transformOptions: {
          enableImplicitConversion: true,
        },
        exceptionFactory: (errors) => {
          Logger.warn('Validation failed:', errors);
          return errors;
        },
      }),
    );

    // API prefix
    app.setGlobalPrefix('api');

    // Unified response format & exception handling
    app.useGlobalInterceptors(new ResponseTransformInterceptor());
    app.useGlobalFilters(new AllExceptionsFilter());

    // Swagger documentation
    const config = new DocumentBuilder()
      .setTitle('Shaykhi API')
      .setDescription('Quran teaching and recitation booking platform API')
      .setVersion('1.0')
      .addBearerAuth()
      .addTag('auth', 'Authentication endpoints')
      .addTag('users', 'User management')
      .addTag('teachers', 'Teacher management')
      .addTag('bookings', 'Booking management')
      .addTag('payments', 'Payment processing')
      .addTag('sessions', 'Video/Voice call sessions')
      .addTag('reviews', 'Reviews and ratings')
      .addTag('notifications', 'Notifications')
      .addTag('admin', 'Admin operations')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);

    const port = process.env.PORT || 3001;
    const host = process.env.HOST || '0.0.0.0'; // Listen on all network interfaces
    
    await app.listen(port, host);

    // Get local IP address for network access
    const os = require('os');
    const networkInterfaces = os.networkInterfaces();
    let localIp = 'localhost';
    
    for (const interfaceName in networkInterfaces) {
      const addresses = networkInterfaces[interfaceName];
      for (const address of addresses) {
        if (address.family === 'IPv4' && !address.internal) {
          localIp = address.address;
          break;
        }
      }
      if (localIp !== 'localhost') break;
    }

    Logger.log(`🚀 Application is running on:`);
    Logger.log(`   Local:   http://localhost:${port}`);
    Logger.log(`   Network: http://${localIp}:${port}`);
    Logger.log(`📚 Swagger documentation:`);
    Logger.log(`   Local:   http://localhost:${port}/api/docs`);
    Logger.log(`   Network: http://${localIp}:${port}/api/docs`);
  } catch (error) {
    Logger.error('❌ Error starting the application:', error);
    process.exit(1);
  }
}

bootstrap().catch((error) => {
  Logger.error('❌ Fatal error during bootstrap:', error);
  process.exit(1);
});

