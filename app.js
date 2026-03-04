require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const swaggerUi = require('swagger-ui-express');
const { connect, disconnect } = require('./lib/prisma');
const { buildSwaggerSpec, buildMobileSwaggerSpec } = require('./lib/swagger');
const { buildSheikhMobileSwaggerSpec } = require('./lib/sheikhMobileSwagger');
const { corsHandler, addCorsHeaders } = require('./middleware/corsHandler');
const { keepAliveMiddleware, configureServer, setupGracefulShutdown, mobileHealthCheck } = require('./middleware/keepAlive');
const responseTransform = require('./middleware/responseTransform');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');
const { getAgoraConfigValidationErrors } = require('./utils/agora');

const app = express();
const PORT = process.env.PORT || 8002;
const HOST = process.env.HOST || '0.0.0.0';
const swaggerSpec = buildSwaggerSpec({ port: PORT });
const mobileSwaggerSpec = buildMobileSwaggerSpec({ port: PORT });
const sheikhMobileSwaggerSpec = buildSheikhMobileSwaggerSpec();

// Keep raw body for Stripe webhook verification
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Keep-alive middleware for mobile apps - must be first
app.use(keepAliveMiddleware);

// Mobile health check
app.use(mobileHealthCheck);

// Enhanced CORS handler - must be first
app.use(corsHandler);

// Standard CORS as fallback
const corsOptions = {
  origin: '*', // Allow all origins - simple and effective
  credentials: false, // Can't use credentials with wildcard origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers',
    'X-App-Version',
    'X-Platform'
  ],
  exposedHeaders: ['X-Request-Id', 'X-Response-Time'],
  maxAge: 86400, // 24 hours
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests', data: null },
});
app.use(limiter);

// خدمة الملفات المرفوعة من داخل المشروع فقط (backend-js/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Add CORS headers to all responses
app.use(addCorsHeaders);

app.use(responseTransform);

// Health check endpoint for CORS testing
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is healthy and CORS is working',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    port: PORT,
    cors: {
      origin: req.headers.origin,
      method: req.method
    }
  });
});

// Special mobile app health endpoint
app.get('/api/mobile/health', (req, res) => {
  res.json({
    success: true,
    message: 'Mobile server is running',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: {
      used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024)
    },
    server: {
      port: PORT,
      environment: process.env.NODE_ENV || 'development',
      keepAlive: true
    },
    mobile: {
      platform: req.headers['x-platform'] || 'unknown',
      appVersion: req.headers['x-app-version'] || 'unknown',
      userAgent: req.headers['user-agent'] || 'unknown'
    }
  });
});

// Swagger docs
app.use(
  '/api/docs',
  swaggerUi.serveFiles(swaggerSpec),
  swaggerUi.setup(swaggerSpec, {
    explorer: true,
    customSiteTitle: 'Shik API Docs (Web / Admin)',
    swaggerOptions: {
      url: '/api/openapi.json',
      docExpansion: 'none',
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// —— توثيق API الموبايل للطالب/اليوزر ——
// Student/User mobile docs: http://localhost:8002/api/mobile/docs
app.get('/api/mobile/openapi.json', (req, res) => {
  res.json(mobileSwaggerSpec);
});
app.use(
  '/api/mobile/docs',
  swaggerUi.serveFiles(mobileSwaggerSpec),
  swaggerUi.setup(mobileSwaggerSpec, {
    explorer: true,
    customSiteTitle: 'Shik Mobile API Docs (Student / User)',
    swaggerOptions: {
      url: '/api/mobile/openapi.json',
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

// —— توثيق API الموبايل للشيخ فقط ——
// Sheikh mobile docs: http://localhost:8002/api/sheikh/docs (و /api/v1/shike/mobile/docs)
app.get('/api/sheikh/openapi.json', (req, res) => {
  res.type('application/json').json(sheikhMobileSwaggerSpec);
});
app.get('/api/v1/shike/mobile/openapi.json', (req, res) => {
  res.type('application/json').json(sheikhMobileSwaggerSpec);
});
app.use(
  '/api/sheikh/docs',
  swaggerUi.serveFiles(sheikhMobileSwaggerSpec),
  swaggerUi.setup(sheikhMobileSwaggerSpec, {
    explorer: true,
    customSiteTitle: 'Sheikh Mobile API Docs',
    swaggerOptions: {
      url: '/api/sheikh/openapi.json',
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);
app.use(
  '/api/v1/shike/mobile/docs',
  swaggerUi.serveFiles(sheikhMobileSwaggerSpec),
  swaggerUi.setup(sheikhMobileSwaggerSpec, {
    explorer: true,
    customSiteTitle: 'Sheikh Mobile API Docs',
    swaggerOptions: {
      url: '/api/v1/shike/mobile/openapi.json',
      docExpansion: 'list',
      defaultModelsExpandDepth: -1,
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  })
);

app.use('/api', routes);

app.use(errorHandler);

// Improved error handling - don't crash server for mobile app stability
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception (keeping server alive):', err.message);
  console.error('Stack:', err.stack);

  // Don't exit for common mobile app errors
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE' || err.code === 'ETIMEDOUT') {
    console.log('📱 Mobile app connection error - continuing...');
    return;
  }

  // Log but don't crash for other errors (mobile apps need stable server)
  console.log('🔄 Server continuing for mobile app stability...');
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('⚠️  Unhandled Rejection (keeping server alive):', reason);
  console.log('📱 Continuing server operation for mobile app...');
});

async function start() {
  try {
    const agoraConfigErrors = getAgoraConfigValidationErrors();
    if (agoraConfigErrors.length > 0) {
      console.warn('⚠️  Agora configuration warnings:');
      agoraConfigErrors.forEach((error) => console.warn(`   - ${error}`));
      console.warn('   Video session token endpoints may fail until these are fixed.');
    }

    await connect();
    console.log('✅ Database connected successfully');

    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 Application is running on:`);
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   API:     http://localhost:${PORT}/api`);
      console.log(`🔗 Health check: http://localhost:${PORT}/api/health`);
      console.log(`📄 API docs (Web/Admin):  http://localhost:${PORT}/api/docs`);
      console.log(`📱 API docs (Student/User): http://localhost:${PORT}/api/mobile/docs`);
      console.log(`📘 API docs (Sheikh):      http://localhost:${PORT}/api/sheikh/docs`);
      console.log(`📱 Mobile health: http://localhost:${PORT}/api/mobile/health`);
      console.log(`🌐 CORS enabled for web and mobile apps`);
    });

    // Configure server for mobile apps and prevent crashes
    configureServer(server);

    // Setup graceful shutdown
    setupGracefulShutdown(server);

  } catch (error) {
    console.error('❌ Error starting the application:', error);

    // If port is in use, don't crash - log and continue
    if (error.code === 'EADDRINUSE') {
      console.log(`⚠️  Port ${PORT} is already in use. Server may already be running.`);
      console.log(`💡 Check if mobile app server is already running on port ${PORT}`);
      return;
    }

    await disconnect();
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
// After registering all routes
function printRoutes(app) {
  console.log('Registered Routes:');
  app._router.stack.forEach((middleware) => {
    if (middleware.route) {
      console.log(`${Object.keys(middleware.route.methods)} ${middleware.route.path}`);
    } else if (middleware.name === 'router') {
      middleware.handle.stack.forEach((handler) => {
        if (handler.route) {
          const path = handler.route.path;
          const methods = Object.keys(handler.route.methods);
          console.log(`${methods} /api/hero${path}`);
        }
      });
    }
  });
}

// Call this after all route registrations
printRoutes(app);
module.exports = app;



