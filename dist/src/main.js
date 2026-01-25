"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
process.on('uncaughtException', (error) => {
    common_1.Logger.error('Uncaught Exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    common_1.Logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});
async function bootstrap() {
    try {
        const app = await core_1.NestFactory.create(app_module_1.AppModule, {
            rawBody: true,
            logger: ['error', 'warn', 'log', 'debug', 'verbose'],
        });
        app.enableCors({
            origin: true,
            credentials: true,
        });
        app.useGlobalPipes(new common_1.ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: true,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
            exceptionFactory: (errors) => {
                common_1.Logger.warn('Validation failed:', errors);
                return errors;
            },
        }));
        app.setGlobalPrefix('api');
        const config = new swagger_1.DocumentBuilder()
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
        const document = swagger_1.SwaggerModule.createDocument(app, config);
        swagger_1.SwaggerModule.setup('api/docs', app, document);
        const port = process.env.PORT || 3001;
        const host = process.env.HOST || '0.0.0.0';
        await app.listen(port, host);
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
            if (localIp !== 'localhost')
                break;
        }
        common_1.Logger.log(`🚀 Application is running on:`);
        common_1.Logger.log(`   Local:   http://localhost:${port}`);
        common_1.Logger.log(`   Network: http://${localIp}:${port}`);
        common_1.Logger.log(`📚 Swagger documentation:`);
        common_1.Logger.log(`   Local:   http://localhost:${port}/api/docs`);
        common_1.Logger.log(`   Network: http://${localIp}:${port}/api/docs`);
    }
    catch (error) {
        common_1.Logger.error('❌ Error starting the application:', error);
        process.exit(1);
    }
}
bootstrap().catch((error) => {
    common_1.Logger.error('❌ Fatal error during bootstrap:', error);
    process.exit(1);
});
//# sourceMappingURL=main.js.map