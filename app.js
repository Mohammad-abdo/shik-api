require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const { connect, disconnect } = require('./lib/prisma');
const responseTransform = require('./middleware/responseTransform');
const errorHandler = require('./middleware/errorHandler');
const routes = require('./routes');

const app = express();
const PORT = process.env.PORT || 3001;
const HOST = process.env.HOST || '0.0.0.0';

// Keep raw body for Stripe webhook verification
app.use(express.json({ limit: '10mb', verify: (req, res, buf) => { req.rawBody = buf; } }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: { success: false, message: 'Too many requests', data: null },
});
app.use(limiter);

// خدمة الملفات المرفوعة من داخل المشروع فقط (backend-js/uploads)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(responseTransform);

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
