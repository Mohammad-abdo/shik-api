const fs = require('fs');
const path = require('path');
const swaggerJSDoc = require('swagger-jsdoc');
const pkg = require('../package.json');

function canonicalizePath(p) {
  return String(p || '')
    .replace(/\/:([A-Za-z0-9_]+)/g, '/{}')
    .replace(/\/\{\{[^}]+\}\}/g, '/{}')
    .replace(/\/\{[^}]+\}/g, '/{}')
    .replace(/\/+/g, '/')
    .replace(/\/$/, '') || '/';
}

function normalizePostmanPath(url) {
  if (!url) return '/';
  if (Array.isArray(url.path) && url.path.length) return '/' + url.path.join('/');
  if (typeof url.raw === 'string') {
    let x = url.raw
      .replace(/\{\{base_url\}\}/g, '')
      .replace(/^https?:\/\/[^/]+/i, '');
    if (!x.startsWith('/')) x = '/' + x;
    return x.split('?')[0];
  }
  return '/';
}

function loadPostmanExamples() {
  const collectionFiles = [
    path.join(__dirname, '..', 'postman', 'postman', 'Quran-Sheikhs-API.postman_collection.json'),
    path.join(__dirname, '..', 'postman', 'postman', 'Student-API.postman_collection.json'),
  ];

  const examples = new Map();

  function sanitizeExample(value) {
    if (Array.isArray(value)) return value.map(sanitizeExample);
    if (value && typeof value === 'object') {
      const out = {};
      for (const [k, v] of Object.entries(value)) out[k] = sanitizeExample(v);
      return out;
    }
    if (typeof value === 'string') {
      const varMatch = value.match(/^\{\{([^}]+)\}\}$/);
      if (varMatch) return exampleValueByName(varMatch[1]);
    }
    return value;
  }

  function addExample(method, routePath, body) {
    const cleanPath = routePath.replace(/^\/api(\/|$)/, '/').replace(/\/+/g, '/');
    const key = `${method.toLowerCase()} ${canonicalizePath(cleanPath)}`;
    if (!examples.has(key)) examples.set(key, sanitizeExample(body));
  }

  function walk(items) {
    for (const item of items || []) {
      if (item.request) {
        const method = String(item.request.method || 'GET').toLowerCase();
        const routePath = normalizePostmanPath(item.request.url);
        const rawBody = item.request?.body?.raw;
        if (rawBody && rawBody.trim()) {
          try {
            const parsed = JSON.parse(rawBody);
            addExample(method, routePath, parsed);
          } catch (_) {
            // Ignore non-JSON request body examples.
          }
        }
      }
      if (item.item) walk(item.item);
    }
  }

  for (const file of collectionFiles) {
    if (!fs.existsSync(file)) continue;
    try {
      const collection = JSON.parse(fs.readFileSync(file, 'utf8'));
      walk(collection.item);
    } catch (_) {
      // Ignore invalid collection format and continue with inferred examples.
    }
  }

  return examples;
}

function exampleValueByName(name) {
  const key = String(name || '').toLowerCase();
  if (key.includes('email')) return 'student@example.com';
  if (key.includes('password')) return 'P@ssw0rd123';
  if (key.includes('phone') || key.includes('mobile')) return '+201000000000';
  if (key.includes('token')) return 'sample-token-value';
  if (key.includes('otp')) return '123456';
  if (key.includes('id')) return 'clx123exampleid';
  if (key.includes('amount') || key.includes('price') || key.includes('total')) return 100;
  if (key.includes('is') || key.includes('has') || key.includes('enabled') || key.includes('active')) return true;
  if (key.includes('date')) return '2026-02-20';
  if (key.includes('time')) return '14:00';
  if (key.includes('name') || key.includes('title')) return 'Sample Value';
  if (key.includes('description')) return 'Sample description';
  if (key.includes('method')) return 'email';
  if (key.includes('language')) return 'en-gb';
  if (key.includes('currency')) return 'EGP';
  return 'sample-value';
}

function buildExampleFromSchema(schema = {}) {
  if (!schema || typeof schema !== 'object') return null;
  if (schema.example && typeof schema.example === 'object') return schema.example;

  const properties = schema.properties || {};
  const keys = Object.keys(properties);
  if (!keys.length) return null;

  const out = {};
  for (const key of keys) {
    const property = properties[key] || {};
    if (property.example !== undefined) {
      out[key] = property.example;
      continue;
    }

    if (property.enum && property.enum.length > 0) {
      out[key] = property.enum[0];
      continue;
    }

    if (property.type === 'number' || property.type === 'integer') {
      out[key] = key.toLowerCase().includes('amount') ? 100 : 1;
      continue;
    }

    if (property.type === 'boolean') {
      out[key] = true;
      continue;
    }

    if (property.type === 'array') {
      out[key] = [];
      continue;
    }

    if (property.type === 'object') {
      out[key] = {};
      continue;
    }

    out[key] = exampleValueByName(key);
  }

  return out;
}

function toWords(value) {
  return String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function inferTagDescription(tagName) {
  const key = String(tagName || '').toLowerCase();
  const descriptions = {
    auth: 'Authentication, registration, and account access endpoints.',
    users: 'Current user profile and account management endpoints.',
    admin: 'Administrative operations for platform management.',
    audit: 'Audit logs and system activity reporting endpoints.',
    courses: 'Course catalog, details, and enrollment endpoints.',
    bookings: 'Lesson booking lifecycle endpoints.',
    teachers: 'Teacher profiles, availability, and approval endpoints.',
    lessons: 'Lesson access and playback endpoints.',
    reviews: 'Teacher and booking review endpoints.',
    notifications: 'In-app notification sending and read-status endpoints.',
    payments: 'Payment intents, Fawry flows, and webhook endpoints.',
    files: 'File upload and media handling endpoints.',
    video: 'Video sessions, access tokens, and progress endpoints.',
    subscriptions: 'Subscription package and subscription management endpoints.',
    'student-subscriptions': 'Student-focused subscription package and plan endpoints.',
    certificates: 'Course completion certificate issuance and lookup endpoints.',
    content: 'Content moderation and publishing endpoints.',
    pages: 'Static page retrieval and editing endpoints.',
    rbac: 'Role-based access control roles and permissions endpoints.',
    finance: 'Wallets, payouts, and financial reporting endpoints.',
    sessions: 'Live session scheduling and state transition endpoints.',
    'quran-sheikhs': 'Quran sheikh listing, profiles, and review endpoints.',
    health: 'Service health and operational status endpoints.',
  };
  return descriptions[key] || `${toWords(tagName)} endpoints.`;
}

function inferOperationSummary(method, routePath) {
  const actionMap = {
    get: 'Retrieve',
    post: 'Create',
    put: 'Replace',
    patch: 'Update',
    delete: 'Delete',
  };
  const action = actionMap[String(method || '').toLowerCase()] || 'Handle';
  const clean = String(routePath || '/')
    .replace(/[{}]/g, '')
    .replace(/^\/+/, '')
    .replace(/\/+/g, ' ')
    .trim();
  return clean ? `${action} ${toWords(clean)}` : `${action} Root`;
}

function inferParameterDescription(parameter) {
  const name = String(parameter?.name || 'parameter');
  const location = String(parameter?.in || 'request');
  return `${toWords(name)} ${location} parameter.`;
}

function enrichSchemaDescription(schema, schemaName) {
  if (!schema || typeof schema !== 'object') return;

  if (!schema.description) {
    schema.description = schemaName
      ? `${toWords(schemaName)} schema.`
      : 'Schema definition.';
  }

  if (schema.properties && typeof schema.properties === 'object') {
    for (const [propName, propSchema] of Object.entries(schema.properties)) {
      if (!propSchema || typeof propSchema !== 'object') continue;
      if (!propSchema.description) {
        propSchema.description = `${toWords(propName)} field.`;
      }
      if (propSchema.items && typeof propSchema.items === 'object' && !propSchema.items.description) {
        propSchema.items.description = `${toWords(propName)} item.`;
      }
      enrichSchemaDescription(propSchema, propName);
    }
  }

  if (schema.items && typeof schema.items === 'object') {
    enrichSchemaDescription(schema.items, `${schemaName || 'item'} item`);
  }
}

function inferRequestExample(routePath, method) {
  const p = routePath.toLowerCase();
  const m = method.toLowerCase();

  if (p.includes('/auth/login')) {
    return { email: 'student@example.com', password: 'P@ssw0rd123' };
  }
  if (p.includes('/auth/signup') || p.includes('/auth/register')) {
    return {
      firstName: 'Ahmed',
      lastName: 'Ali',
      email: 'student@example.com',
      password: 'P@ssw0rd123',
      phone: '+201000000000',
    };
  }
  if (p.includes('/auth/refresh')) {
    return { refreshToken: 'sample-refresh-token' };
  }
  if (p.includes('/auth/verify-email')) {
    return { email: 'student@example.com', otp: '123456' };
  }
  if (p.includes('/auth/verify-phone')) {
    return { phone: '+201000000000', otp: '123456' };
  }
  if (p.includes('/forgot-password')) {
    return { email: 'student@example.com' };
  }
  if (p.includes('/reset-password')) {
    return { token: 'sample-reset-token', password: 'P@ssw0rd123' };
  }
  if (p.includes('/payments') && p.includes('/refund')) {
    return { amount: 50 };
  }
  if (p.includes('/payments') && p.includes('/intent')) {
    return { paymentMethod: 'CARD' };
  }
  if (p.includes('/fawry/checkout-link')) {
    return {
      bookingId: 'clx123exampleid',
      returnUrl: 'https://example.com/payment/callback',
      paymentMethod: 'CARD',
      language: 'en-gb',
    };
  }
  if (p.includes('/fawry/reference-number')) {
    return { bookingId: 'clx123exampleid', expiryHours: 24, language: 'en-gb' };
  }
  if (p.includes('/enroll') && m === 'post') {
    return { courseId: 'clxcourse123', studentId: 'clxstudent123' };
  }
  if (p.includes('/users/me/password')) {
    return { currentPassword: 'P@ssw0rd123', newPassword: 'N3wP@ssw0rd123' };
  }
  if (p.includes('/users/me')) {
    return { firstName: 'Ahmed', lastName: 'Ali', phone: '+201000000000' };
  }
  if (p.includes('/courses') && p.includes('/featured')) {
    return { isFeatured: true };
  }
  if (p.includes('/courses') && p.includes('/enroll-student')) {
    return { studentId: 'clxstudent123' };
  }
  if (p.includes('/courses') && m === 'post') {
    return {
      title: 'Tajweed Fundamentals',
      description: 'Beginner-friendly Tajweed course',
      price: 250,
      level: 'BEGINNER',
    };
  }
  if (p.includes('/bookings') && p.includes('/force-cancel')) {
    return { reason: 'Schedule conflict' };
  }
  if (p.includes('/bookings') && p.includes('/force-confirm')) {
    return { note: 'Confirmed by admin' };
  }
  if (p.includes('/bookings') && p.includes('/featured')) {
    return { isFeatured: true };
  }
  if (p.includes('/bookings') && m === 'post') {
    return {
      teacherId: 'clxteacher123',
      date: '2026-02-20',
      startTime: '14:00',
      duration: 60,
      notes: 'Focus on memorization',
    };
  }
  if (p.includes('/teachers') && p.includes('/schedules') && m === 'post') {
    return { dayOfWeek: 'MONDAY', startTime: '10:00', endTime: '14:00' };
  }
  if (p.includes('/teachers') && (m === 'post' || m === 'put')) {
    return {
      bio: 'Quran teacher with 10 years of experience',
      specialization: 'Tajweed',
      hourlyRate: 150,
    };
  }
  if (p.includes('/notifications') && p.includes('/broadcast')) {
    return { title: 'Platform update', message: 'New features are live now.' };
  }
  if (p.includes('/notifications') && (p.includes('/send') || p.includes('/users'))) {
    return { userId: 'clxuser123', title: 'Reminder', message: 'Your session starts soon.' };
  }
  if (p.includes('/payments') && p.includes('/webhook')) {
    return { event: 'payment_intent.succeeded', data: {} };
  }
  if (p.includes('/subscriptions') && p.includes('/packages')) {
    return { name: 'Monthly Plan', sessionsPerMonth: 8, price: 500 };
  }
  if (p.includes('/subscriptions') && p.includes('/subscribe')) {
    return { packageId: 'clxpackage123', teacherId: 'clxteacher123' };
  }
  if (p.includes('/subscriptions') && p.includes('/cancel')) {
    return { reason: 'No longer needed' };
  }
  if (p.includes('/student-wallets/deposit')) {
    return { studentId: 'clxstudent123', amount: 100 };
  }
  if (p.includes('/student-wallets/withdraw')) {
    return { studentId: 'clxstudent123', amount: 50 };
  }
  if (p.includes('/student-wallets/process-payment')) {
    return { studentId: 'clxstudent123', bookingId: 'clxbooking123', amount: 75 };
  }
  if (p.includes('/wallet') && p.includes('/payout-request')) {
    return { amount: 200, notes: 'Weekly payout' };
  }
  if (p.includes('/payouts/') && (p.includes('/approve') || p.includes('/reject') || p.includes('/complete'))) {
    return { note: 'Reviewed by finance admin' };
  }
  if (p.includes('/certificates') && m === 'post') {
    return {
      studentId: 'clxstudent123',
      courseId: 'clxcourse123',
      title: 'Completion Certificate',
      grade: 'A',
    };
  }
  if (p.includes('/content') && (p.includes('/approve') || p.includes('/reject'))) {
    return { note: 'Reviewed by moderator' };
  }
  if (p.includes('/pages') && m === 'patch') {
    return { title: 'About Us', content: 'Updated content', published: true };
  }
  if (p.includes('/rbac') && p.includes('/roles/assign')) {
    return { userId: 'clxuser123', roleId: 'clxrole123' };
  }
  if (p.includes('/rbac') && p.includes('/permissions/assign')) {
    return { roleId: 'clxrole123', permissionId: 'clxperm123' };
  }
  if (p.includes('/rbac') && p.includes('/roles') && (m === 'post' || m === 'put')) {
    return { name: 'CONTENT_MANAGER', description: 'Can manage content' };
  }
  if (p.includes('/rbac') && p.includes('/permissions') && (m === 'post' || m === 'put')) {
    return { name: 'content.approve', description: 'Approve content' };
  }
  if (p.includes('/reviews') && (m === 'post' || m === 'put')) {
    return { rating: 5, comment: 'Excellent session and clear explanation.' };
  }
  if (p.includes('/sessions') && p.includes('/bookings/') && p.includes('/start')) {
    return { notes: 'Session started on time' };
  }
  if (p.includes('/sessions') && p.includes('/bookings/') && p.includes('/end')) {
    return { notes: 'Session completed successfully' };
  }
  if (p.includes('/sessions') && p.includes('/bookings/') && m === 'post') {
    return { roomId: 'room-123', scheduledAt: '2026-02-20T14:00:00Z' };
  }
  if (p.includes('/video/session/create')) {
    return { bookingId: 'clxbooking123' };
  }
  if (p.includes('/video/session/end')) {
    return { sessionId: 'clxsession123' };
  }
  if (p.includes('/video/videos/') && p.includes('/start')) {
    return { watchedSeconds: 0 };
  }
  if (p.includes('/video/videos/') && p.includes('/complete')) {
    return { watchedSeconds: 1200 };
  }
  if (p.includes('/exams') && p.includes('/questions')) {
    return {
      questions: [
        { text: 'What is noon sakinah?', options: ['A', 'B', 'C'], correctAnswer: 0 },
      ],
    };
  }
  if (p.includes('/exams') && p.includes('/submit')) {
    return { answers: [{ questionId: 'clxq1', selectedOption: 0 }] };
  }
  if (p.includes('/exams') && p.includes('/grade')) {
    return { score: 85, feedback: 'Good understanding overall' };
  }
  if (p.includes('/exams') && m === 'post') {
    return { title: 'Midterm Tajweed Exam', duration: 30 };
  }
  if (p.includes('/quran-sheikhs/') && p.includes('/reviews') && m === 'post') {
    return { rating: 5, comment: 'Very clear and patient sheikh.' };
  }
  if (p.includes('/admin/users') && p.includes('/status')) {
    return { status: 'ACTIVE' };
  }
  if (p.includes('/admin/users') && p.includes('/ban')) {
    return { reason: 'Violation of platform policy' };
  }
  if (p.includes('/admin/users') && p.includes('/activate')) {
    return { note: 'Account restored' };
  }
  if (p.includes('/admin/users') && (m === 'post' || m === 'put')) {
    return {
      firstName: 'Sara',
      lastName: 'Mohamed',
      email: 'sara@example.com',
      role: 'STUDENT',
      status: 'ACTIVE',
    };
  }
  if (p.includes('/admin/teachers') && (m === 'post' || m === 'put')) {
    return { teacherType: 'FULL_TEACHER', isApproved: true };
  }
  if (p.includes('/admin/notifications/global')) {
    return { title: 'System notice', message: 'Maintenance tonight at 11 PM.' };
  }
  if (p.includes('/admin/wallets/') && p.includes('/send-money')) {
    return { amount: 300, note: 'Manual transfer' };
  }
  if (p.includes('/admin/student-wallets/deposit')) {
    return { studentId: 'clxstudent123', amount: 100 };
  }
  if (p.includes('/admin/student-wallets/withdraw')) {
    return { studentId: 'clxstudent123', amount: 50 };
  }
  if (p.includes('/admin/student-wallets/process-payment')) {
    return { studentId: 'clxstudent123', bookingId: 'clxbooking123', amount: 80 };
  }

  if (m === 'post') return { name: 'Sample', description: 'Sample description' };
  if (m === 'put' || m === 'patch') return { updated: true, note: 'Sample update payload' };
  return { sample: true };
}

function inferResponseDataExample(routePath, method) {
  const p = String(routePath || '').toLowerCase();
  const m = String(method || '').toLowerCase();

  if (p.includes('/auth/login') || p.includes('/auth/refresh')) {
    return {
      user: {
        id: 'clxuser123',
        firstName: 'Ahmed',
        lastName: 'Ali',
        email: 'student@example.com',
        role: 'STUDENT',
      },
      accessToken: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.sample',
      refreshToken: 'refresh-token-sample',
    };
  }
  if (p.includes('/auth/me') || p.includes('/users/me')) {
    return {
      id: 'clxuser123',
      firstName: 'Ahmed',
      lastName: 'Ali',
      email: 'student@example.com',
      phone: '+201000000000',
      role: 'STUDENT',
    };
  }
  if (m === 'get' && (p.includes('/courses') || p.includes('/teachers') || p.includes('/bookings'))) {
    return [{ id: 'clx123exampleid', name: 'Sample Value' }];
  }
  if (m === 'post') {
    return {
      id: 'clx123exampleid',
      ...inferRequestExample(routePath, method),
      createdAt: '2026-02-21T10:00:00.000Z',
    };
  }
  if (m === 'put' || m === 'patch') {
    return {
      id: 'clx123exampleid',
      ...inferRequestExample(routePath, method),
      updatedAt: '2026-02-21T10:00:00.000Z',
    };
  }
  if (m === 'delete') {
    return { id: 'clx123exampleid', deleted: true };
  }
  return { id: 'clx123exampleid', sample: true };
}

function inferResponseExample(routePath, method, statusCode) {
  const code = Number(statusCode);
  const successCode = Number.isFinite(code) ? code >= 200 && code < 300 : false;
  if (successCode) {
    return {
      success: true,
      message: code === 201 ? 'Resource created successfully' : 'Request completed successfully',
      data: inferResponseDataExample(routePath, method),
    };
  }

  if (code === 401) {
    return {
      success: false,
      message: 'Unauthorized',
      data: null,
      statusCode: 401,
      error_code: 'UNAUTHORIZED',
    };
  }

  if (code === 403) {
    return {
      success: false,
      message: 'Forbidden',
      data: null,
      statusCode: 403,
      error_code: 'FORBIDDEN',
    };
  }

  if (code === 404) {
    return {
      success: false,
      message: 'Resource not found',
      data: null,
      statusCode: 404,
      error_code: 'NOT_FOUND',
    };
  }

  return {
    success: false,
    message: 'Bad request',
    data: null,
    statusCode: Number.isFinite(code) ? code : 400,
    error_code: 'BAD_REQUEST',
  };
}

function buildSwaggerSpec({ port }) {
  const postmanExamples = loadPostmanExamples();
  const baseUrl = process.env.SWAGGER_BASE_URL || `http://localhost:${port}/api`;
  const definition = {
    openapi: '3.0.3',
    info: {
      title: pkg.name || 'Shik API',
      version: pkg.version || '1.0.0',
      description: pkg.description || 'API documentation',
    },
    servers: [{ url: baseUrl }, { url: 'https://shike.developteam.site/api/' }],
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
      { name: 'health' },
    ],
    paths: {
      '/health': {
        get: {
          tags: ['health'],
          summary: 'API health check',
          responses: {
            200: {
              description: 'Server is healthy',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiSuccess' },
                },
              },
            },
          },
        },
      },
      '/mobile/health': {
        get: {
          tags: ['health'],
          summary: 'Mobile API health check',
          responses: {
            200: {
              description: 'Mobile server is running',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiSuccess' },
                },
              },
            },
          },
        },
      },
    },
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
          example: {
            success: true,
            message: 'Request completed successfully',
            data: {
              id: 'clx123exampleid',
            },
          },
          required: ['success', 'message', 'data'],
          additionalProperties: true,
        },
        ApiError: {
          type: 'object',
          properties: {
            success: { type: 'boolean', enum: [false] },
            message: { type: 'string' },
            data: {
              nullable: true,
              type: 'object',
              additionalProperties: true,
            },
            statusCode: { type: 'integer' },
            error_code: { type: 'string' },
          },
          example: {
            success: false,
            message: 'Bad request',
            data: null,
            statusCode: 400,
            error_code: 'BAD_REQUEST',
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
      responses: {
        BadRequest: {
          description: 'Bad request',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Unauthorized: {
          description: 'Unauthorized',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        NotFound: {
          description: 'Not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
        InternalServerError: {
          description: 'Internal server error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/ApiError' },
            },
          },
        },
      },
    },
  };

  const spec = swaggerJSDoc({
    definition,
    apis: [
      path.join(__dirname, '..', 'routes', '*.js'),
      path.join(__dirname, '..', 'routes', 'v1', '*.js'),
    ],
  });

  const normalizedPaths = {};
  for (const [rawPath, methods] of Object.entries(spec.paths || {})) {
    const normalizedPath = rawPath === '/api' ? '/' : rawPath.replace(/^\/api(\/|$)/, '/');
    normalizedPaths[normalizedPath] = methods;
  }

  for (const [routePath, methods] of Object.entries({ ...normalizedPaths })) {
    if (!routePath.startsWith('/v1/quran-sheikhs')) continue;
    const mobileAliasPath = routePath.replace('/v1/quran-sheikhs', '/mobile/quran-sheikhs');
    if (!normalizedPaths[mobileAliasPath]) {
      normalizedPaths[mobileAliasPath] = methods;
    }
  }
  spec.paths = normalizedPaths;

  const httpMethods = ['get', 'post', 'put', 'patch', 'delete'];
  for (const [routePath, pathItem] of Object.entries(spec.paths || {})) {
    for (const method of httpMethods) {
      const operation = pathItem[method];
      if (!operation) continue;

      if (!Array.isArray(operation.tags) || operation.tags.length === 0) {
        const firstSegment = routePath.split('/').filter(Boolean)[0] || 'default';
        operation.tags = [firstSegment];
      }

      if (!operation.summary) {
        operation.summary = inferOperationSummary(method, routePath);
      }
      if (!operation.description) {
        operation.description = `${operation.summary}.`;
      }

      if (!operation.operationId) {
        const safePath = routePath
          .replace(/[{}]/g, '')
          .replace(/\/+/g, '_')
          .replace(/^_/, '')
          .replace(/[^a-zA-Z0-9_]/g, '_');
        operation.operationId = `${method}_${safePath || 'root'}`;
      }

      if (!operation.responses) operation.responses = {};
      if (!operation.responses['500']) {
        operation.responses['500'] = { $ref: '#/components/responses/InternalServerError' };
      }
      if (!operation.responses['400']) {
        operation.responses['400'] = { $ref: '#/components/responses/BadRequest' };
      }
      if (operation.security && operation.security.length > 0) {
        if (!operation.responses['401']) {
          operation.responses['401'] = { $ref: '#/components/responses/Unauthorized' };
        }
        if (!operation.responses['403']) {
          operation.responses['403'] = { $ref: '#/components/responses/Forbidden' };
        }
      }

      if (Array.isArray(operation.parameters)) {
        for (const parameter of operation.parameters) {
          if (!parameter || typeof parameter !== 'object') continue;
          if (!parameter.description) {
            parameter.description = inferParameterDescription(parameter);
          }
          if (parameter.example !== undefined) continue;
          parameter.example = exampleValueByName(parameter.name);
        }
      }

      const requestBody = operation.requestBody;
      if (requestBody && requestBody.content) {
        if (!requestBody.description) {
          requestBody.description = `${operation.summary} request payload.`;
        }
        for (const [contentType, mediaType] of Object.entries(requestBody.content)) {
          if (!mediaType || typeof mediaType !== 'object') continue;

          if (mediaType.schema && typeof mediaType.schema === 'object') {
            enrichSchemaDescription(mediaType.schema);
          }

          if (mediaType.example !== undefined || mediaType.examples !== undefined) continue;

          if (contentType === 'multipart/form-data') {
            mediaType.example = { file: '(binary)' };
            continue;
          }

          if (contentType === 'application/json') {
            const postmanKey = `${method} ${canonicalizePath(routePath)}`;
            const postmanExample = postmanExamples.get(postmanKey);
            const schemaExample = buildExampleFromSchema(mediaType.schema);
            mediaType.example = postmanExample || schemaExample || inferRequestExample(routePath, method);
          }
        }
      }

      for (const [statusCode, response] of Object.entries(operation.responses || {})) {
        if (!response || typeof response !== 'object') continue;
        if (response.$ref) continue;
        if (!response.description) {
          response.description = `HTTP ${statusCode} response.`;
        }
        if (response.content && typeof response.content === 'object') {
          for (const mediaType of Object.values(response.content)) {
            if (!mediaType || typeof mediaType !== 'object') continue;
            if (mediaType.schema && typeof mediaType.schema === 'object') {
              enrichSchemaDescription(mediaType.schema);
            }
            if (mediaType.example === undefined && mediaType.examples === undefined) {
              mediaType.example = inferResponseExample(routePath, method, statusCode);
            }
          }
        }
      }
    }
  }

  for (const tag of spec.tags || []) {
    if (!tag || typeof tag !== 'object') continue;
    if (!tag.description) {
      tag.description = inferTagDescription(tag.name);
    }
  }

  for (const server of spec.servers || []) {
    if (!server || typeof server !== 'object') continue;
    if (!server.description) {
      server.description = server.url.includes('localhost')
        ? 'Local development server.'
        : 'Deployed API server.';
    }
  }

  if (spec.components && spec.components.schemas) {
    for (const [schemaName, schema] of Object.entries(spec.components.schemas)) {
      enrichSchemaDescription(schema, schemaName);
    }
  }

  return spec;
}

module.exports = { buildSwaggerSpec };
