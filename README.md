# Shaykhi Backend (Node.js + Express + Prisma + MySQL)

نسخة من الباك اند باستخدام **Node.js** (بدون TypeScript) مع **Express** و **Prisma** و **MySQL**.

## المتطلبات

- Node.js 18+
- MySQL 8+
- npm أو yarn

## التثبيت

```bash
cd backend-js
npm install
cp .env.example .env
# عدّل .env وأضف DATABASE_URL و JWT_SECRET
```

## إعداد قاعدة البيانات

```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

أو دفعة واحدة:

```bash
npm run db:setup
```

## تشغيل السيرفر

```bash
npm start
# أو للتطوير مع إعادة التشغيل التلقائي:
npm run dev
```

السيرفر يعمل على: `http://localhost:8002`  
واجهة الـ API تحت البادئة: `/api`

## المسارات الرئيسية

| المسار | الوصف |
|--------|--------|
| `POST /api/auth/signup` | تسجيل مستخدم جديد |
| `POST /api/auth/login` | تسجيل الدخول (ويب أو موبايل حسب body) |
| `POST /api/auth/register` | تسجيل موبايل مع صورة |
| `GET /api/auth/me` | المستخدم الحالي (يتطلب JWT) |
| `GET /api/users/me` | ملف المستخدم |
| `PUT /api/users/me` | تحديث الملف |
| `GET /api/teachers` | قائمة المعلمين |
| `GET /api/teachers/:id` | تفاصيل معلم |
| `POST /api/bookings` | إنشاء حجز |
| `GET /api/bookings/my-bookings` | حجوزاتي |
| `GET /api/admin/dashboard` | إحصائيات لوحة التحكم (يتطلب صلاحيات) |
| `GET /api/admin/users` | قائمة المستخدمين |
| `GET /api/admin/teachers` | قائمة المعلمين |
| `POST /api/files/upload` | رفع ملف |
| `POST /api/payments/bookings/:bookingId/intent` | إنشاء نية دفع Stripe |
| `GET /api/notifications` | إشعارات المستخدم |

## المتغيرات البيئية (.env)

- `DATABASE_URL` – رابط اتصال MySQL
- `JWT_SECRET` – مفتاح JWT (مطلوب)
- `JWT_REFRESH_SECRET` – مفتاح JWT للتجديد (اختياري)
- `PORT` – منفذ السيرفر (افتراضي 3001)
- `BASE_URL` – عنوان الـ API (لروابط الملفات)
- `STRIPE_SECRET_KEY`، `STRIPE_WEBHOOK_SECRET` – للدفع (اختياري)
- `SMTP_*` – لإرسال البريد و OTP (اختياري)
- `AGORA_APP_ID` – معرف مشروع Agora بصيغة `32` حرف hex
- `AGORA_APP_CERTIFICATE` – شهادة مشروع Agora بصيغة `32` حرف hex ومن **نفس** مشروع `AGORA_APP_ID`
- `AGORA_TOKEN_EXPIRES_IN_SECONDS` – مدة صلاحية توكن Agora بالثواني (اختياري، الافتراضي `3600`)

## هيكل المشروع

```
backend-js/
├── app.js              # نقطة الدخول
├── lib/
│   └── prisma.js       # عميل Prisma
├── middleware/         # JWT، الصلاحيات، تحويل الاستجابة، معالجة الأخطاء
├── routes/             # مسارات Express (auth, users, admin, teachers, bookings, payments, files, notifications)
├── services/           # منطق الأعمال (auth, user, admin, booking, teacher, notification, otp, fileUpload, audit)
├── prisma/
│   ├── schema.prisma   # نفس schema الباك اند الأصلي
│   └── seed.js         # بذرة أساسية (مستخدم admin)
└── uploads/            # الملفات المرفوعة (يُنشأ تلقائياً)
```

تم نقل المنطق من الباك اند (NestJS/TypeScript) إلى Express/Node.js مع الحفاظ على نفس الـ schema وواجهة الـ API قدر الإمكان.
