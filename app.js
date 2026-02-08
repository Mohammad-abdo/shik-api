require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connect, disconnect } = require('./lib/prisma');
const { corsHandler, addCorsHeaders } = require('./middleware/corsHandler');
const responseTransform = require('./middleware/responseTransform');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Keep raw body for Stripe webhook verification
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Enhanced CORS handler - must be first
app.use(corsHandler);

// Standard CORS as fallback
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:5175',
    'http://localhost:5176',
    'http://localhost:5177',
    'http://localhost:5178',
    'https://tartel-jet.vercel.app',
    'https://tarteel-platform.vercel.app',
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With',
    'Accept',
    'Origin',
    'Access-Control-Request-Method',
    'Access-Control-Request-Headers'
  ],
  exposedHeaders: ['set-cookie'],
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
    cors: {
      origin: req.headers.origin,
      method: req.method,
      headers: req.headers
    }
  });
});

app.use('/api', routes);

app.use(errorHandler);

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

async function start() {
  try {
    await connect();
    app.listen(PORT, HOST, () => {
      console.log(`🚀 Application is running on:`);
      console.log(`   Local:   http://localhost:${PORT}`);
      console.log(`   API:     http://localhost:${PORT}/api`);
    });
  } catch (error) {
    console.error('❌ Error starting the application:', error);
    process.exit(1);
  }
}

start().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});

module.exports = app;
