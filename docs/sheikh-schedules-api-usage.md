# كيفية التعامل مع واجهة مواعيد الشيخ (Schedules API)

## 1) تسجيل الدخول (Login)

**الطلب:**
```http
POST /api/v1/shike/mobile/login
Content-Type: application/json

{
  "phone": "+201234567895",
  "password": "teacher123"
}
```

**الاستجابة (مختصرة):**
```json
{
  "success": true,
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIs...",
    "isApproved": true
  }
}
```

احفظ قيمة `data.token` واستخدمها في رأس كل طلب محمي:
```http
Authorization: Bearer <token>
```

---

## 2) جلب معرّف الشيخ (teacherId)

إذا لم يُرجع الـ login حقل `teacherId`، استدعِ الـ profile:

```http
GET /api/v1/shike/mobile/profile
Authorization: Bearer <token>
```

من الاستجابة خذ `data.teacherId` (أو `data.data.teacherId` حسب شكل الـ wrapper).

---

## 3) جلب المواعيد (GET Schedules)

**الطلب:**
```http
GET /api/v1/shike/mobile/teachers/{teacherId}/schedules
Authorization: Bearer <token>
```

أو نفس المسار:
```http
GET /api/v1/shike/mobile/my-schedules
Authorization: Bearer <token>
```

**مثال استجابة:**
```json
{
  "teacherId": "bd2f1784-e722-46dd-a855-2562c1148b95",
  "total": 2,
  "schedules": [
    {
      "id": "uuid-1",
      "dayOfWeek": 1,
      "dayName": "Monday",
      "startTime": "09:00",
      "endTime": "10:00",
      "isActive": true
    }
  ]
}
```

- `dayOfWeek`: 0 = الأحد، 1 = الاثنين، ... 6 = السبت.

---

## 4) إضافة مواعيد (POST Schedules)

**الطلب — موعد واحد:**
```http
POST /api/v1/shike/mobile/teachers/{teacherId}/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "dayOfWeek": 1,
  "startTime": "09:00",
  "endTime": "10:00"
}
```

**صيغ الوقت المقبولة (كلها تعمل):**
- 24 ساعة: `"09:00"`, `"9:00"`, `"14:00"`
- 12 ساعة: `"9:00 AM"`, `"2:00 PM"`, `"9:00AM"`, `"2:00 PM"`

**الطلب — عدة مواعيد دفعة واحدة:**
```http
POST /api/v1/shike/mobile/teachers/{teacherId}/schedules
Authorization: Bearer <token>
Content-Type: application/json

{
  "slots": [
    { "dayOfWeek": 1, "startTime": "9:00 AM", "endTime": "10:00 AM" },
    { "dayOfWeek": 3, "startTime": "14:00", "endTime": "15:00" }
  ]
}
```

**استجابة ناجحة (201):**
```json
{
  "success": true,
  "message": "Schedules added — pending admin approval",
  "createdCount": 2,
  "schedules": [
    { "id": "uuid-new-1", "dayOfWeek": 1, "startTime": "09:00", "endTime": "10:00", "isActive": true },
    { "id": "uuid-new-2", "dayOfWeek": 3, "startTime": "14:00", "endTime": "15:00", "isActive": true }
  ]
}
```

---

## 5) تعديل موعد (PUT Schedule)

**الطلب:**
```http
PUT /api/v1/shike/mobile/teachers/{teacherId}/schedules/{scheduleId}
Authorization: Bearer <token>
Content-Type: application/json

{
  "dayOfWeek": 2,
  "startTime": "10:00",
  "endTime": "11:00"
}
```

يمكن إرسال جزء من الحقول فقط (مثلاً `startTime` و `endTime` فقط). صيغ الوقت نفسها المعتمدة في POST.

---

## 6) حذف موعد (DELETE Schedule)

**الطلب:**
```http
DELETE /api/v1/shike/mobile/teachers/{teacherId}/schedules/{scheduleId}
Authorization: Bearer <token>
```

**استجابة ناجحة (200):**
```json
{
  "success": true,
  "message": "Schedule deleted — pending admin approval"
}
```

---

## تشغيل الاختبار

### 1) اختبار من داخل السيرفر (السيرفر يقرأ ويشغّل الاختبار)

عند تشغيل السيرفر محلياً (`npm run dev`) يكون مسار الاختبار متاحاً **فقط عندما NODE_ENV ≠ production**:

```http
GET http://localhost:8002/api/v1/shike/mobile/dev/run-schedule-test
```

افتح هذا الرابط في المتصفح أو استخدم curl:

```bash
curl http://localhost:8002/api/v1/shike/mobile/dev/run-schedule-test
```

**استجابة ناجحة (200):**
```json
{
  "success": true,
  "message": "جميع الخطوات نجحت",
  "steps": [
    { "step": 1, "name": "Login", "ok": true, "detail": "Token received" },
    { "step": 2, "name": "Profile", "ok": true, "teacherId": "..." },
    { "step": 3, "name": "GET Schedules", "ok": true, "total": 86 },
    { "step": 4, "name": "POST Schedule", "ok": true, "scheduleId": "..." },
    { "step": 5, "name": "PUT Schedule", "ok": true },
    { "step": 6, "name": "DELETE Schedule", "ok": true }
  ]
}
```

الاختبار يستخدم بيانات فعلية من قاعدة البيانات (شيخ الـ seed: +201234567895 / teacher123). يمكن تغييرها بمتغيرات البيئة:
- `SHEIKH_TEST_PHONE`
- `SHEIKH_TEST_PASSWORD`

### 2) اختبار من سكربت خارجي (HTTP إلى السيرفر)

من مجلد المشروع:

```bash
# السيرفر المحلي (شغّل أولاً: npm run dev)
npm run test:schedules

# أو مباشرة
node scripts/test-sheikh-schedules-api.js

# السيرفر البعيد
BASE_URL=https://shike.developteam.site npm run test:schedules

# بيانات دخول مخصصة
SHEIKH_PHONE=+201234567896 SHEIKH_PASSWORD=teacher123 npm run test:schedules
```

السكربت ينفّذ: Login → GET schedules → POST موعد جديد → PUT تعديل → DELETE، وكل الخطوات يجب أن تمر بنجاح.
