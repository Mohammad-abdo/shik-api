const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const pkg = require('../package.json');

function buildSwaggerSpec({ port }) {
  const baseUrl = process.env.SWAGGER_BASE_URL || `http://localhost:${port}/api`;
  const definition = {
    openapi: '3.0.3',
    info: {
      title: pkg.name || 'Shik API',
      version: pkg.version || '1.0.0',
      description: pkg.description || 'API documentation',
    },
    servers: [{ url: baseUrl }],
    tags: [
      { name: 'auth' },
      { name: 'users' },
      { name: 'admin' },
      { name: 'audit' },
      { name: 'courses' },
      { name: 'bookings' },
      { name: 'teachers' },
      { name: 'lessons' },
      { name: 'reviews' },
      { name: 'notifications' },
      { name: 'payments' },
      { name: 'files' },
      { name: 'video' },
      { name: 'subscriptions' },
      { name: 'student-subscriptions' },
      { name: 'certificates' },
      { name: 'content' },
      { name: 'pages' },
      { name: 'rbac' },
      { name: 'finance' },
      { name: 'sessions' },
      { name: 'quran-sheikhs' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ApiSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [true] },
            message: { type: 'string' },
            data: { type: 'object', additionalProperties: true },
          },
          required: ['success', 'message', 'data'],
          additionalProperties: true,
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            data: { type: 'null' },
            statusCode: { type: 'integer' },
            error_code: { type: 'string' },
          },
          required: ['success', 'message', 'data', 'statusCode'],
          additionalProperties: true,
        },
        AuthTokens: {
          type: 'object',
          properties: {
            accessToken: { type: 'string' },
            refreshToken: { type: 'string' },
          },
          required: ['accessToken', 'refreshToken'],
          additionalProperties: false,
        },
      },
    },
  };

  return swaggerJSDoc({
    definition,
    apis: [
      path.join(__dirname, '..', 'routes', '*.js'),
      path.join(__dirname, '..', 'routes', 'v1', '*.js'),
    ],
  });
}

module.exports = { buildSwaggerSpec };
