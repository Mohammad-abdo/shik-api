# تقرير استخدام API لتطبيق "شيخي" – قسم مشايخ القرآن (Mo5 Usage Report)

هذا الملف يوثق الـ Endpoints الخاصة بقسم حفظ وتعليم القرآن الكريم مع **حالة التطبيق** (هل الباكند يوفّرها وهل الفرونتند يستدعيها). تم الاعتماد على نفس هيكلة المواصفات (Mo5 Backend Specs) لضمان توافق التطبيق مع الـ Backend.

**تاريخ التحديث:** 2025-02-07  
**الإصدار:** 1.0

---

## **جدول المحتويات**

| # | Endpoint | الوصف | Auth مطلوب |
|---|----------|--------|------------|
| 1 | GET /api/v1/quran-sheikhs | جلب قائمة مشايخ القرآن | لا |
| 2 | GET /api/v1/quran-sheikhs/:id | تفاصيل الشيخ | اختياري (لـ is_subscribed) |
| 3 | POST /api/v1/bookings | حجز باقة مع الشيخ | نعم |
| 4 | GET /api/v1/quran-sheikhs/:id/reviews | جلب التعليقات | لا |
| 5 | POST /api/v1/quran-sheikhs/:id/reviews | إضافة تعليق | نعم |
| 6 | GET /api/v1/student/sessions | جدول جلساتي | نعم |
| 7 | GET /api/v1/student/sessions/:id/report | تقرير الجلسة | نعم |
| 8 | GET /api/v1/student/courses | دوراتي | نعم |
| 9 | GET /api/v1/student/courses/:id | تفاصيل الدورة والتقدم | نعم |
| 10 | GET /api/v1/student/reports | التقارير بتاعتي | نعم |

---

## **Global Headers**

جميع الطلبات يجب أن تحتوي على:

- `Authorization`: `Bearer <ACTION_TOKEN>` (للتحقق من المستخدم)
- `Accept-Language`: `ar` أو `en`
  - **ملاحظة:** البيانات النصية (الاسم، النبذة، المسمى الوظيفي) ستعود باللغة المحددة في هذا الهيدر.

**Base URL:** `http://localhost:8002/api/v1`

**ملاحظة – متى يُرسل Authorization:**
- **بدون توكن:** يمكن استدعاء `GET /quran-sheikhs`, `GET /quran-sheikhs/:id`, `GET /quran-sheikhs/:id/reviews` (قراءة فقط). في تفاصيل الشيخ لن يُرجَع حقل `is_subscribed` أو سيكون `false`.
- **مع توكن:** كل endpoints الطالب (`/student/*`), `POST /bookings`, `POST /quran-sheikhs/:id/reviews` تتطلب `Authorization: Bearer <token>`.

---

## **استجابات الأخطاء الشائعة (Error Responses)**

جميع الـ endpoints قد ترجع الاستجابات التالية عند الفشل:

**401 Unauthorized** – غياب أو انتهاء صلاحية التوكن:

```json
{
  "status": false,
  "message": "Unauthorized",
  "code": "UNAUTHORIZED"
}
```

**404 Not Found** – المورد غير موجود:

```json
{
  "status": false,
  "message": "Sheikh not found",
  "code": "NOT_FOUND"
}
```

**400 Bad Request** – بيانات غير صالحة:

```json
{
  "status": false,
  "message": "sheikh_id is required",
  "code": "BAD_REQUEST"
}
```

---

## **1. Get All Quran Sheikhs (جلب قائمة مشايخ القرآن)**

يجلب قائمة المشايخ مع دعم الـ Pagination.

- **Endpoint:** `GET /api/v1/quran-sheikhs`
- **Query Params:**
  - `page`: رقم الصفحة (Default: 1)
  - `limit`: عدد العناصر في الصفحة (Default: 10)
  - `search`: (اختياري) للبحث بالاسم

**Success Response (200 OK):**

```json
{
  "status": true,
  "message": "Sheikhs retrieved successfully",
  "data": {
    "sheikhs": [
      {
        "id": "q1",
        "name": "الشيخ محمد رفعت",
        "title": "مقرئ ومحفظ قرآن كريم",
        "image": "https://example.com/images/sheikh1.jpg",
        "rating": 4.9,
        "recitation_style": "حفص، ورش",
        "teaching_type": "بنين وبنات",
        "starting_price": "500 EGP / شهر"
      }
    ],
    "pagination": {
      "current_page": 1,
      "total_pages": 5,
      "total_items": 50
    }
  }
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                          |
|------------|--------|-----------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/quranSheikhs.js`       |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء لـ `/v1/quran-sheikhs` في `api.js` |

---

## **2. Get Sheikh Profile Details (تفاصيل الشيخ)**

يجلب التفاصيل الكاملة للشيخ لعرضها في صفحة البروفايل، بما في ذلك حالة اشتراك الطالب معه (`is_subscribed`).

- **Endpoint:** `GET /api/v1/quran-sheikhs/:id`
- **Path Params:** `id` (رقم أو كود الشيخ)

**Success Response (200 OK) – [مثال لطالب غير مشترك]:**

```json
{
  "status": true,
  "data": {
    "id": "q1",
    "name": "الشيخ محمد رفعت",
    "bio": "شيخ محفظ للقرآن الكريم بخبرة 15 عاماً...",
    "video_url": "https://example.com/videos/preview.mp4",
    "image": "https://example.com/images/sheikh1.jpg",
    "rating": 4.9,
    "experience_years": 15,
    "students_count": 500,
    "recitation_style": "حفص، ورش، الدوري",
    "teaching_type": "بنين وبنات",
    "is_subscribed": false,
    "packages": [
      {
        "id": "pkg_1",
        "days": ["السبت", "الثلاثاء"],
        "time": "08:00 م - 09:00 م",
        "monthly_price": "500 EGP",
        "session_price": "70 EGP",
        "currency": "EGP",
        "allowed_payment_types": ["monthly", "per_session", "quarterly"]
      }
    ],
    "reviews_summary": {
      "count": 120,
      "average": 4.9
    }
  }
}
```

**Success Response (200 OK) – [مثال لطالب مشترك]:**

```json
{
  "status": true,
  "data": {
    "is_subscribed": true,
    "current_subscription": {
      "package_name": "باقة يومين في الأسبوع",
      "renewal_date": "2024-03-01",
      "status": "active"
    },
    "next_session": {
      "date": "2024-02-06",
      "time": "08:00 PM",
      "is_active_now": false,
      "meeting_link": "https://agora.../..."
    }
  }
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                    |
|------------|--------|-----------------------------|
| **Backend**  | ✅ موجود | `routes/v1/quranSheikhs.js` – دعم `optionalJwtAuth` لـ `is_subscribed` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js` |

---

## **3. Book Sheikh (حجز باقة مع الشيخ)**

لحجز موعد محدد بنظام دفع معين (شهري، حصة، إلخ).

- **Endpoint:** `POST /api/v1/bookings`
- **Body:**

```json
{
  "sheikh_id": "q1",
  "package_id": "pkg_1",
  "payment_type": "monthly"
}
```

**Success Response (200 OK):**

```json
{
  "status": true,
  "message": "Booking initiated successfully",
  "data": {
    "booking_id": "bk_9988",
    "amount": 500,
    "currency": "EGP",
    "payment_url": "https://paymob.com/..."
  }
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                                                                 |
|------------|--------|--------------------------------------------------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/bookings.js`                                                  |
| **Frontend** | ❌ غير مستخدم | لوحة الإدارة تستخدم `bookingAPI` على `/api/bookings` وليس `/api/v1/bookings` |

---

## **4. Get Sheikh Reviews (جلب التعليقات)**

- **Endpoint:** `GET /api/v1/quran-sheikhs/:id/reviews`
- **Query Params:** `page`, `limit`

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": [
    {
      "id": 101,
      "user_name": "أحمد علي",
      "rating": 5,
      "comment": "شيخ ممتاز جداً ما شاء الله.",
      "date": "2024-02-01"
    }
  ]
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات              |
|------------|--------|------------------------|
| **Backend**  | ✅ موجود | `routes/v1/quranSheikhs.js` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js` |

---

## **5. Add Review (إضافة تعليق)**

متاح فقط للمشتركين (`is_subscribed` must be true via middleware check).

- **Endpoint:** `POST /api/v1/quran-sheikhs/:id/reviews`
- **Body:**

```json
{
  "rating": 5,
  "comment": "تجربة ممتازة وانصح به بشدة"
}
```

**Success Response (200 OK):**

```json
{
  "status": true,
  "message": "Review added successfully"
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                    |
|------------|--------|-----------------------------|
| **Backend**  | ✅ موجود | `routes/v1/quranSheikhs.js` – يتطلب `jwtAuth` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js` |

---

## **6. Get My Sessions (جدول جلساتي)**

يجلب جدول الجلسات للطالب (للشهر الحالي أو شهر محدد).

- **Endpoint:** `GET /api/v1/student/sessions`
- **Query Params:** `month` (e.g. 2), `year` (e.g. 2024)

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": [
    {
      "id": "sess_55",
      "sheikh_name": "الشيخ محمد رفعت",
      "date": "2024-02-12",
      "day": "الاثنين",
      "time": "08:00 PM",
      "status": "completed",
      "report_available": true
    },
    {
      "id": "sess_56",
      "sheikh_name": "الشيخ محمد رفعت",
      "date": "2024-02-15",
      "day": "الخميس",
      "time": "08:00 PM",
      "status": "upcoming",
      "report_available": false
    }
  ]
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                          |
|------------|--------|-----------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/student.js` – `studentSessionsService.getMySessions` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء لـ `/v1/student/sessions` في `api.js` |

---

## **7. Get Session Report (تقرير الجلسة)**

لجلب التقرير الخاص بجلسة منتهية.

- **Endpoint:** `GET /api/v1/student/sessions/:id/report`
- **Path Params:** `id` (معرّف الجلسة)

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": {
    "session_id": "sess_55",
    "date": "2024-02-12",
    "attendance_status": "present",
    "quran_progress": {
      "surah": "البقرة",
      "from_ayah": 1,
      "to_ayah": 50,
      "rating": "ممتاز",
      "memorization_quality": 5,
      "tajweed_quality": 5
    },
    "notes": "تمت مراجعة الربع الأول بنجاح.",
    "next_homework": "حفظ من الآية 51 إلى 60 من سورة البقرة"
  }
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                                |
|------------|--------|-----------------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/student.js` – `studentSessionsService.getSessionReport` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js`             |

---

## **8. Get My Courses (دوراتي)**

يجلب قائمة الدورات التي اشترك فيها الطالب.

- **Endpoint:** `GET /api/v1/student/courses`

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": [
    {
      "id": 1,
      "name": "دورة أحكام التجويد",
      "image": "https://example.com/images/course1.jpg",
      "video_url": "https://example.com/videos/preview.mp4",
      "progress_percentage": 60,
      "progress_value": 0.6,
      "enrollment_date": "2024-01-05"
    }
  ]
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                          |
|------------|--------|-----------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/student.js` – `studentCoursesService.getMyCourses` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء لـ `/v1/student/courses` في `api.js` |

---

## **9. Get Course Details (تفاصيل الدورة والتقدم)**

يجلب تفاصيل الدورة، بما في ذلك نسبة التقدم وقائمة المشايخ الذين يتابع الطالب معهم في هذه الدورة.

- **Endpoint:** `GET /api/v1/student/courses/:id`
- **Path Params:** `id` (رقم الدورة)

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": {
    "id": 1,
    "name": "دورة أحكام التجويد",
    "image": "https://example.com/images/course1.jpg",
    "description": "دورة تعليم قواعد التجويد الصحيحة.",
    "duration": "3 أشهر",
    "rating": 4.8,
    "progress_percentage": 60,
    "progress_value": 0.6,
    "enrollment_date": "2024-01-05",
    "subscribed_sheikhs": [
      {
        "id": "q1",
        "name": "الشيخ محمد رفعت",
        "image": "https://example.com/images/sheikh1.jpg",
        "specialization": "إقراء العشر الصغرى",
        "rating": 5.0,
        "country": "مصر"
      }
    ]
  }
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                                    |
|------------|--------|---------------------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/student.js` – `studentCoursesService.getCourseDetails` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js`                 |

---

## **10. Get My Reports (التقارير بتاعتي)**

يجلب قائمة بجميع التقارير الخاصة بجلسات الطالب السابقة.

- **Endpoint:** `GET /api/v1/student/reports`
- **Query Params:** `page`, `limit`

**Success Response (200 OK):**

```json
{
  "status": true,
  "data": [
    {
      "sheikh": {
        "id": "q3",
        "name": "الشيخ ياسين الحموي",
        "image": "https://example.com/images/sheikh3.jpg",
        "specialization": "مقامات صوتية"
      },
      "session": {
        "id": "sess_101",
        "date": "2024-02-15",
        "day_name": "الخميس",
        "time": "04:00 م"
      },
      "report": {
        "overall_rating": 8.6,
        "rating_label": "ممتاز",
        "new_memorization_rating": 9,
        "recent_review_rating": 8,
        "distant_review_rating": 9,
        "notes": "أداء ممتاز، استمر على هذا المنوال."
      }
    }
  ]
}
```

**حالة التطبيق (Implementation Status):**

| المكوّن    | الحالة | ملاحظات                                |
|------------|--------|-----------------------------------------|
| **Backend**  | ✅ موجود | `routes/v1/student.js` – `studentSessionsService.getMyReports` |
| **Frontend** | ❌ غير مستخدم | لا يوجد استدعاء في `api.js`             |

---

## **ملخص حالة التطبيق**

| # | Endpoint | Backend | Frontend (api.js) |
|---|----------|---------|-------------------|
| 1 | GET /api/v1/quran-sheikhs | ✅ | ❌ |
| 2 | GET /api/v1/quran-sheikhs/:id | ✅ | ❌ |
| 3 | POST /api/v1/bookings | ✅ | ❌ |
| 4 | GET /api/v1/quran-sheikhs/:id/reviews | ✅ | ❌ |
| 5 | POST /api/v1/quran-sheikhs/:id/reviews | ✅ | ❌ |
| 6 | GET /api/v1/student/sessions | ✅ | ❌ |
| 7 | GET /api/v1/student/sessions/:id/report | ✅ | ❌ |
| 8 | GET /api/v1/student/courses | ✅ | ❌ |
| 9 | GET /api/v1/student/courses/:id | ✅ | ❌ |
| 10 | GET /api/v1/student/reports | ✅ | ❌ |

**ملاحظة:** الفرونتند الحالي (لوحة الإدارة) يعتمد على مسارات مثل `/api/auth/*`, `/api/admin/*`, `/api/bookings`, `/api/courses` ولا يستدعي مسارات `/api/v1/*`. تطبيق التلميذ/الموبايل هو المستهلك المتوقع لجميع الـ endpoints أعلاه.

---

## **ملاحظات الباكند (Backend Notes)**

- **قائمة المشايخ (1):** الباكند يرجع `data.sheikhs` و `data.pagination` بنفس الهيكل في المواصفات. المصدر: `Teacher` مع ترجمة الحقول حسب `Accept-Language`.
- **تفاصيل الشيخ (2):** الباكند يدعم `optionalJwtAuth`؛ عند إرسال التوكن يُحسب `is_subscribed` من وجود حجوزات مؤكدة/مكتملة. الباقات تُبنى من `Schedule` (أوقات وأيام).
- **حجز الشيخ (3):** الباكند ينشئ `Booking` ويُرجع `booking_id`, `amount`, `currency`, `payment_url`. حقل `payment_url` يأتي من `process.env.PAYMENT_URL` أو قيمة افتراضية.
- **التعليقات (4, 5):** المراجعات مخزنة في جدول `Review` مرتبط بالمعلم. إضافة تعليق تتطلب `jwtAuth` (لا يوجد تحقق إضافي من اشتراك الطالب في الباكند الحالي).
- **جلساتي (6):** البيانات تُستمد من `Booking` للشهر/السنة المحددة. `report_available` = true عندما تكون الحالة `COMPLETED` والجلسة منتهية (`session.endedAt`).
- **تقرير الجلسة (7):** الباكند يرجع هيكل المواصفات؛ محتوى التقرير (مثل `quran_progress`, `notes`, `next_homework`) حالياً قيم افتراضية/placeholder. يمكن لاحقاً ربطه بجدول `SessionReport` أو ما يماثله.
- **دوراتي وتفاصيل الدورة (8, 9):** المصدر `CourseEnrollment` و `Course` مع `courseTeachers`. الحقول `progress_percentage`, `progress_value` من `enrollment.progress`.
- **التقارير بتاعتي (10):** القائمة من جلسات منتهية للطالب مع ملخص الشيخ والجلسة والتقرير؛ الهيكل يطابق المواصفات.

---

## **توصيات الفرونتند (Frontend Recommendations)**

لربط تطبيق التلميذ/الموبايل بهذه الـ API، يُقترح إضافة كائن في `frontend/src/services/api.js` يستدعي مسارات `/v1/`:

```javascript
// في api.js – إضافة بعد تعريف api

const API_V1_BASE = ''; // نفس baseURL (مثلاً http://localhost:8002/api) ثم المسار يبدأ بـ /v1/...

// Quran Sheikhs API (v1) – لتطبيق التلميذ/الموبايل
export const quranSheikhsV1API = {
  getSheikhs: (params) => api.get('/v1/quran-sheikhs', { params }),
  getSheikhById: (id) => api.get(`/v1/quran-sheikhs/${id}`),
  getReviews: (id, params) => api.get(`/v1/quran-sheikhs/${id}/reviews`, { params }),
  addReview: (id, data) => api.post(`/v1/quran-sheikhs/${id}/reviews`, data),
};

// Student API (v1)
export const studentV1API = {
  getSessions: (params) => api.get('/v1/student/sessions', { params }),
  getSessionReport: (sessionId) => api.get(`/v1/student/sessions/${sessionId}/report`),
  getMyCourses: () => api.get('/v1/student/courses'),
  getCourseDetails: (courseId) => api.get(`/v1/student/courses/${courseId}`),
  getMyReports: (params) => api.get('/v1/student/reports', { params }),
};

// Bookings (v1)
export const bookingsV1API = {
  bookSheikh: (data) => api.post('/v1/bookings', data),
};
```

**ملاحظة:** نفس instance `api` يضيف تلقائياً `Authorization: Bearer <token>` من الـ interceptor؛ تأكد أن التطبيق يحفظ التوكن بعد تسجيل الدخول (مثلاً من `/auth/login` أو `/auth/register`).

---

## **مراجع الملفات (File References)**

| المكوّن | المسار |
|---------|--------|
| Routes v1 | `backend-js/routes/v1/index.js`, `quranSheikhs.js`, `bookings.js`, `student.js` |
| Services | `backend-js/services/quranSheikhsService.js`, `studentSessionsService.js`, `studentCoursesService.js` |
| Frontend API | `frontend/src/services/api.js` |
| Postman | `backend-js/postman/Student-API.postman_collection.json`, `Quran-Sheikhs-API.postman_collection.json` |

---

**ملف التقرير:** `backend-js/postman/ENDPOINTS-USAGE-REPORT.md`
