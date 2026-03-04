/**
 * Swagger spec مستقل لـ Sheikh Mobile API
 * Local:  http://localhost:8002/api/v1/shike/mobile/docs
 * Server: https://shike.developteam.site/api/v1/shike/mobile/docs
 */

const PORT = process.env.PORT || 8002;
const localBase = `http://localhost:${PORT}/api/v1/shike/mobile`;
const serverBase = 'https://shike.developteam.site/api/v1/shike/mobile';

const bearerAuth = [{ bearerAuth: [] }];

function buildSheikhMobileSwaggerSpec() {
  return {
    openapi: '3.0.3',
    info: {
      title: 'Sheikh Mobile API',
      version: '1.0.0',
      description:
        'APIs for Sheikh Mobile App (تطبيق الشيخ).\n\n' +
        'Auth, Profile, My Students, Sessions, Session Evaluation (Memorization / Revision / Report), Wallet.\n\n' +
        '**Test credentials (seed):**\n' +
        '- Phone: `+201234567895`\n' +
        '- Password: `teacher123`\n' +
        '- Teacher: Abdelrahman El-Masry (28 sessions)',
    },
    servers: [
      { url: localBase, description: 'Local development server' },
      { url: serverBase, description: 'Production server' },
    ],
    tags: [
      { name: 'Auth', description: 'Register, Login, Logout, Delete Account' },
      { name: 'Profile', description: 'Profile & static pages (About, Privacy)' },
      { name: 'Students', description: 'My Students (paid subscriptions only)' },
      { name: 'Sessions', description: 'Today / All sessions' },
      { name: 'Session Evaluation', description: 'Memorization, Revision, Report (مطابق لصفحة الحجوزات)' },
      { name: 'Wallet', description: 'Wallet details & Withdraw' },
    ],
    components: {
      securitySchemes: {
        bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      },
      schemas: {
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            statusCode: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      // ─── Auth ─────────────────────────────────────────
      '/register': {
        post: {
          tags: ['Auth'],
          summary: 'Register a new Sheikh',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['name', 'email', 'password', 'confirmPassword'],
                  properties: {
                    name: { type: 'string', example: 'أحمد الشيخ' },
                    email: { type: 'string', example: 'sheikh@example.com' },
                    phone: { type: 'string', example: '+201012345678' },
                    password: { type: 'string', example: 'password123' },
                    confirmPassword: { type: 'string', example: 'password123' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Sheikh registered',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'Sheikh registered successfully',
                    data: {
                      id: 'uuid',
                      name: 'أحمد الشيخ',
                      email: 'sheikh@example.com',
                      phone: '+201012345678',
                      token: 'jwt-token',
                    },
                  },
                },
              },
            },
            409: { description: 'Email/Phone already exists' },
          },
        },
      },

      '/login': {
        post: {
          tags: ['Auth'],
          summary: 'Login with phone + password',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['phone', 'password'],
                  properties: {
                    phone: { type: 'string', example: '+201234567895' },
                    password: { type: 'string', example: 'teacher123' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Login success',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    data: {
                      token: 'jwt-token',
                      sheikh: { id: 'uuid', name: 'Abdelrahman El-Masry', email: 'teacher1@shaykhi.com' },
                    },
                  },
                },
              },
            },
            401: { description: 'Invalid credentials' },
          },
        },
      },

      '/send-login-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Send login OTP (to phone or email)',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['method', 'identifier'],
                  properties: {
                    method: { type: 'string', enum: ['phone', 'email'], example: 'phone', description: 'OTP delivery method' },
                    identifier: { type: 'string', example: '+201234567895', description: 'Phone number or email' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'OTP sent',
              content: {
                'application/json': {
                  example: { success: true, message: 'OTP sent to phone', data: { otp: '123456', expires_at: '2026-03-04T13:10:00.000Z' } },
                },
              },
            },
            404: { description: 'User not found' },
          },
        },
      },

      '/resend-otp': {
        post: {
          tags: ['Auth'],
          summary: 'Resend OTP to phone or email',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    phone: { type: 'string', example: '+201234567895', description: 'Phone (preferred for mobile)' },
                    email: { type: 'string', example: 'teacher1@shaykhi.com', description: 'Email (alternative)' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'OTP resent',
              content: { 'application/json': { example: { success: true, message: 'OTP resent to phone' } } },
            },
            400: { description: 'Email or phone is required' },
            404: { description: 'User not found' },
          },
        },
      },

      '/forgot-password': {
        post: {
          tags: ['Auth'],
          summary: 'Start password reset (sends OTP)',
          description: 'For mobile: send `student_phone`, `parent_phone`, `email`. For web: send `method` (EMAIL/PHONE) + `email`/`phone`.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    student_phone: { type: 'string', example: '+201234567895', description: 'Mobile flow — student phone' },
                    parent_phone: { type: 'string', example: '+201234567800', description: 'Mobile flow — parent phone' },
                    email: { type: 'string', example: 'teacher1@shaykhi.com' },
                    method: { type: 'string', enum: ['EMAIL', 'PHONE'], description: 'Web flow' },
                    phone: { type: 'string', description: 'Web flow — phone' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'OTP sent for password reset',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'تم إرسال رمز التحقق بنجاح',
                    data: { otp: '123456', expires_at: '2026-03-04T13:10:00.000Z', message: 'تم إرسال رمز التحقق' },
                  },
                },
              },
            },
            404: { description: 'User not found' },
          },
        },
      },

      '/reset-password': {
        post: {
          tags: ['Auth'],
          summary: 'Complete password reset with OTP',
          description: 'For mobile: send `email`, `otp`, `password`, `password_confirmation`. For web: send `email`/`phone`, `otp`, `newPassword`.',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    email: { type: 'string', example: 'teacher1@shaykhi.com' },
                    otp: { type: 'string', example: '123456' },
                    password: { type: 'string', example: 'newPassword123', description: 'Mobile flow' },
                    password_confirmation: { type: 'string', example: 'newPassword123', description: 'Mobile flow' },
                    newPassword: { type: 'string', description: 'Web flow' },
                    phone: { type: 'string', description: 'Web flow — if phone-based reset' },
                  },
                },
              },
            },
          },
          responses: {
            200: {
              description: 'Password reset successfully',
              content: {
                'application/json': {
                  example: {
                    success: true,
                    message: 'تم تغيير كلمة المرور بنجاح',
                    data: {
                      user: { id: 'uuid', name: 'Abdelrahman El-Masry', email: 'teacher1@shaykhi.com' },
                      auth_token: 'jwt-token',
                    },
                  },
                },
              },
            },
            400: { description: 'Invalid or expired OTP / Passwords do not match' },
            404: { description: 'User not found' },
          },
        },
      },

      '/logout': {
        post: {
          tags: ['Auth'],
          summary: 'Logout',
          security: bearerAuth,
          responses: { 200: { description: 'Logged out' } },
        },
      },

      '/delete-account': {
        delete: {
          tags: ['Auth'],
          summary: 'Delete account (soft-delete)',
          security: bearerAuth,
          responses: { 200: { description: 'Account deactivated' } },
        },
      },

      // ─── Profile ──────────────────────────────────────
      '/profile': {
        get: {
          tags: ['Profile'],
          summary: 'Get my profile',
          security: bearerAuth,
          responses: {
            200: {
              description: 'Sheikh profile',
              content: {
                'application/json': {
                  example: {
                    id: 'uuid',
                    name: 'Abdelrahman El-Masry',
                    email: 'teacher1@shaykhi.com',
                    phone: '+201234567895',
                    hourPrice: 180,
                    totalHoursCompleted: 4,
                    walletBalance: 1401.25,
                  },
                },
              },
            },
          },
        },
        put: {
          tags: ['Profile'],
          summary: 'Update profile',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string', example: 'أحمد الشيخ' },
                    email: { type: 'string', example: 'sheikh@example.com' },
                    hourPrice: { type: 'number', example: 120 },
                  },
                },
              },
            },
          },
          responses: { 200: { description: 'Updated profile returned' } },
        },
      },

      '/about': {
        get: {
          tags: ['Profile'],
          summary: 'About App (public)',
          responses: { 200: { description: 'About page content' } },
        },
      },

      '/privacy-policy': {
        get: {
          tags: ['Profile'],
          summary: 'Privacy Policy (public)',
          responses: { 200: { description: 'Privacy policy content' } },
        },
      },

      // ─── My Students ─────────────────────────────────
      '/my-students': {
        get: {
          tags: ['Students'],
          summary: 'Get my students (paid subscriptions only)',
          security: bearerAuth,
          responses: {
            200: {
              description: 'List of students',
              content: {
                'application/json': {
                  example: [
                    {
                      studentId: 'uuid',
                      studentName: 'Ahmed Mohamed',
                      subscription: {
                        packageName: '10 Sessions Package',
                        totalSessions: 10,
                        completedSessions: 4,
                        remainingSessions: 6,
                        startDate: '2026-03-01',
                        endDate: '2026-04-01',
                      },
                      progressPercentage: 40,
                    },
                  ],
                },
              },
            },
          },
        },
      },

      '/my-students/{studentId}': {
        get: {
          tags: ['Students'],
          summary: 'Student details (sessions + memorization + reports)',
          security: bearerAuth,
          parameters: [
            { name: 'studentId', in: 'path', required: true, schema: { type: 'string' }, example: 'student-uuid' },
          ],
          responses: {
            200: {
              description: 'Student details with sessions',
              content: {
                'application/json': {
                  example: {
                    student: { id: 'uuid', name: 'Ahmed' },
                    subscription: { packageName: 'Basic', startDate: '2026-03-01', endDate: '2026-04-01' },
                    sessions: [
                      {
                        sessionId: 'uuid',
                        date: '2026-03-02',
                        time: '10:00',
                        status: 'COMPLETED',
                        memorizations: [{ surahName: 'Al-Baqarah', fromAyah: 1, toAyah: 10 }],
                        revisions: [{ revisionType: 'CLOSE', rangeType: 'SURAH', fromSurah: 'Al-Fatiha', toSurah: 'Al-Baqarah' }],
                        report: { rating: 5, notes: 'Excellent performance' },
                      },
                    ],
                  },
                },
              },
            },
            404: { description: 'Student not found / no active subscription' },
          },
        },
      },

      // ─── Sessions ─────────────────────────────────────
      '/today-sessions': {
        get: {
          tags: ['Sessions'],
          summary: "Today's sessions only",
          security: bearerAuth,
          responses: {
            200: {
              description: "List of today's sessions",
              content: {
                'application/json': {
                  example: [
                    { sessionId: 'uuid', studentName: 'Ali', time: '08:00 PM', meetingLink: 'https://meet.example.com/room-xxx', status: 'scheduled' },
                  ],
                },
              },
            },
          },
        },
      },

      '/my-sessions': {
        get: {
          tags: ['Sessions'],
          summary: 'All my sessions',
          security: bearerAuth,
          responses: {
            200: {
              description: 'List of all sessions',
              content: {
                'application/json': {
                  example: [
                    { sessionId: 'uuid', studentName: 'Aisha Ibrahim', date: '2026-03-24', time: '12:00', status: 'completed' },
                    { sessionId: 'uuid', studentName: 'Ahmed Mohamed', date: '2026-03-23', time: '10:00', status: 'pending' },
                  ],
                },
              },
            },
          },
        },
      },

      // ─── Session Evaluation ────────────────────────────
      '/session/{sessionId}/details': {
        get: {
          tags: ['Session Evaluation'],
          summary: 'Full session details (memorization + revision + report)',
          description: 'Returns session with student info, all memorization entries, all revisions, and the report — identical to dashboard BookingDetail page.',
          security: bearerAuth,
          parameters: [
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' }, description: 'Session ID or BookingSession ID (from /my-sessions)' },
          ],
          responses: {
            200: {
              description: 'Session details',
              content: {
                'application/json': {
                  example: {
                    sessionId: 'uuid',
                    roomId: 'room-xxx',
                    scheduledDate: '2026-03-24T00:00:00.000Z',
                    startTime: '12:00',
                    endTime: '14:00',
                    status: 'COMPLETED',
                    duration: 7200,
                    student: { id: 'uuid', name: 'Aisha Ibrahim', email: 'student4@shaykhi.com' },
                    memorizations: [
                      { id: 'uuid', surahName: 'Al-Fatiha', surahNameAr: 'الفاتحة', fromAyah: 1, toAyah: 7, isFullSurah: true, notes: 'Good', createdAt: '2026-03-24' },
                    ],
                    revisions: [
                      { id: 'uuid', revisionType: 'CLOSE', rangeType: 'SURAH', fromSurah: 'Al-Fatiha', toSurah: 'Al-Baqarah', notes: 'Close revision', createdAt: '2026-03-24' },
                    ],
                    report: { id: 'uuid', rating: 5, content: 'أداء ممتاز في الحفظ والتجويد', createdAt: '2026-03-24' },
                  },
                },
              },
            },
          },
        },
      },

      '/session/{sessionId}/memorization': {
        post: {
          tags: ['Session Evaluation'],
          summary: 'Add memorization entry (حفظ جديد)',
          security: bearerAuth,
          parameters: [
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['surahName'],
                  properties: {
                    surahName: { type: 'string', example: 'Al-Baqarah' },
                    surahNameAr: { type: 'string', example: 'البقرة' },
                    surahNumber: { type: 'integer', example: 2 },
                    fromAyah: { type: 'integer', example: 1 },
                    toAyah: { type: 'integer', example: 20 },
                    isFullSurah: { type: 'boolean', example: false },
                    notes: { type: 'string', example: 'Good progress on first 20 ayat' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Memorization record created' },
            404: { description: 'Session not found or access denied' },
          },
        },
      },

      '/session/{sessionId}/revision': {
        post: {
          tags: ['Session Evaluation'],
          summary: 'Add revision entry (مراجعة)',
          security: bearerAuth,
          parameters: [
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    revisionType: { type: 'string', enum: ['CLOSE', 'FAR'], example: 'CLOSE', description: 'CLOSE = مراجعة قريبة, FAR = مراجعة بعيدة' },
                    rangeType: { type: 'string', enum: ['SURAH', 'JUZ', 'QUARTER'], example: 'SURAH' },
                    fromSurah: { type: 'string', example: 'Al-Fatiha' },
                    toSurah: { type: 'string', example: 'Al-Baqarah' },
                    fromJuz: { type: 'integer', example: 1 },
                    toJuz: { type: 'integer', example: 3 },
                    fromQuarter: { type: 'string' },
                    toQuarter: { type: 'string' },
                    notes: { type: 'string', example: 'Close revision — good' },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Revision record created' },
            404: { description: 'Session not found or access denied' },
          },
        },
      },

      '/session/{sessionId}/report': {
        post: {
          tags: ['Session Evaluation'],
          summary: 'Add/Update session report (تقرير + تقييم)',
          description: 'Creates or updates the session report. If report already exists, it will be updated (upsert).',
          security: bearerAuth,
          parameters: [
            { name: 'sessionId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    rating: { type: 'integer', minimum: 1, maximum: 5, example: 4 },
                    content: { type: 'string', example: 'أداء جيد في الحفظ والتجويد. يحتاج مراجعة أكثر.' },
                    notes: { type: 'string', description: 'Alternative to content field' },
                  },
                },
              },
            },
          },
          responses: {
            201: {
              description: 'Report saved',
              content: { 'application/json': { example: { success: true, message: 'Report saved' } } },
            },
            404: { description: 'Session not found or access denied' },
          },
        },
      },

      // ─── Wallet ───────────────────────────────────────
      '/wallet': {
        get: {
          tags: ['Wallet'],
          summary: 'Get wallet details',
          security: bearerAuth,
          responses: {
            200: {
              description: 'Wallet info',
              content: {
                'application/json': {
                  example: {
                    hourPrice: 180,
                    totalCompletedHours: 4,
                    totalEarned: 4083.98,
                    availableBalance: 1401.25,
                    pendingWithdraw: 0,
                    withdrawHistory: [
                      { amount: 500, status: 'approved', date: '2026-02-10' },
                    ],
                  },
                },
              },
            },
          },
        },
      },

      '/wallet/withdraw': {
        post: {
          tags: ['Wallet'],
          summary: 'Request withdraw',
          description: 'Conditions: amount ≤ availableBalance, no pending request.',
          security: bearerAuth,
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['amount'],
                  properties: {
                    amount: { type: 'number', example: 500 },
                  },
                },
              },
            },
          },
          responses: {
            201: { description: 'Withdraw request created' },
            400: { description: 'Insufficient balance or pending request exists' },
          },
        },
      },
    },
  };
}

module.exports = { buildSheikhMobileSwaggerSpec };
