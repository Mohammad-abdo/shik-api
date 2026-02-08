# تقرير مسح الباك اند – متطلبات Course Sheikh & Lessons

**تاريخ المسح:** 2026-02-08  
**المرجع:** تقرير Backend Requirements - Course Sheikh System

---

## 1. الـ Flow المطلوب في التقرير

| الخطوة | المطلوب | الوصف |
|--------|---------|--------|
| 1 | المستخدم يفتح الدورة | `GET /v1/courses/{courseId}` → تفاصيل الدورة + **قائمة المشايخ** مع عدد الدروس لكل شيخ في الدورة |
| 2 | المستخدم يضغط على شيخ | `GET /v1/courses/{courseId}/sheikhs/{sheikhId}` → تفاصيل الشيخ + **سياق الدورة** + إحصائيات |
| 3 | المستخدم يشوف دروس الدورة | `GET /v1/courses/{courseId}/sheikhs/{sheikhId}/lessons` → **دروس الدورة فقط** لهذا الشيخ مع Pagination وفلتر |

---

## 2. مقارنة الـ Endpoints

### 2.1 Endpoint 1: تفاصيل الدورة + قائمة المشايخ

| البند | التقرير يطلب | الباك اند الحالي | الحالة |
|-------|---------------|-------------------|--------|
| **المسار** | `GET /v1/courses/{courseId}` | لا يوجد `/v1/courses`. يوجد `GET /api/courses/:id` فقط | ⚠️ المسار مختلف (بدون v1) |
| **Auth** | Bearer token | `GET /api/courses/:id` بدون auth إلزامي | ✅ متوافق (يمكن إضافة auth لاحقاً) |
| **Response: الدورة** | name, description, image, price, duration, lessonsCount, studentsCount, rating | الدورة ترجع بـ title/titleAr, description, image, price, duration (int), _count.lessons, _count.enrollments, rating | ⚠️ أسماء الحقول مختلفة (title vs name، duration قد تحتاج تنسيق) |
| **Response: sheikhs[]** | id, name, image, title, rating, **lessonsCountInThisCourse** | `GET /api/courses/:id/sheikhs` يرجع قائمة شيوخ لكن: profile_image، لا يوجد **lessonsCountInThisCourse** | ❌ ناقص: عدد دروس كل شيخ في الدورة غير محسوب ولا مُرجَع |
| **دمج الدورة + الشيوخ** | في نفس الـ response تحت `data.course` مع `course.sheikhs` | تفاصيل الدورة في `findOne` تتضمن courseTeachers لكن الـ response الخام لا يطابق شكل التقرير؛ الشيوخ منفصل في endpoint آخر | ⚠️ يحتاج تكييف response ليعيد الدورة + الشيوخ بالشكل المطلوب |

**الخلاصة Endpoint 1:**  
الباك اند **قادر** على إرجاع الدورة والشيوخ (البيانات موجودة)، لكن:
- لا يوجد route تحت **/v1/courses**.
- الـ response الحالي لا يطابق التقرير (أسماء حقول، وغياب **lessonsCountInThisCourse**).
- **lessonsCountInThisCourse** يحتاج حساب: عدد الدروس (أو الفيديوهات) التي يدرّسها كل شيخ في هذه الدورة. في الـ schema الحالي الدروس لا تحتوي `teacherId`؛ الفيديو يحتوي `teacherId`. إذن العدد = عدد الـ lessons التي لها على الأقل فيديو واحد بـ teacherId = هذا الشيخ.

---

### 2.2 Endpoint 2: تفاصيل الشيخ في سياق الدورة

| البند | التقرير يطلب | الباك اند الحالي | الحالة |
|-------|---------------|-------------------|--------|
| **المسار** | `GET /v1/courses/{courseId}/sheikhs/{sheikhId}` | لا يوجد | ❌ غير موجود |
| **التحقق** | التأكد أن الشيخ يدرّس الدورة | — | يمكن تنفيذه عبر `CourseTeacher` أو عبر وجود فيديوهات له في الدورة |
| **Response: الشيخ** | id, name, title, image, bio, rating, experienceYears, specialization, videoUrl | Teacher له: user (name من firstName/lastName), لا يوجد حقل title، يوجد bio, rating, experience, specialties, introVideoUrl | ⚠️ title يمكن استنتاجها من specialties أو إضافة حقل؛ videoUrl = introVideoUrl |
| **Response: courseContext** | courseId, courseName, lessonsCount, studentsEnrolled, completionRate | course من العلاقة، _count.enrollments، lessonsCount يمكن حسابه؛ completionRate يحتاج منطق (من VideoProgress/Enrollment) | ⚠️ ممكن مع حساب بسيط |
| **achievements** | مصفوفة إنجازات | لا يوجد model Achievement في الـ schema | ❌ غير متوفر؛ يمكن إرجاع مصفوفة فارغة أو إضافة لاحقاً |
| **reviews** | تعليقات على الشيخ | يوجد model Review مرتبط بـ Teacher (عبر Booking) | ✅ يمكن جلب reviews للشيخ وعرضها |

**الخلاصة Endpoint 2:**  
الباك اند **غير مخصص** لهذا الـ endpoint بالكامل:
- الـ route غير موجود.
- يحتاج controller + service جديدين.
- البيانات الأساسية (Teacher, User, Course, CourseTeacher, Review) موجودة؛ achievements غير موجودة في الـ DB.

---

### 2.3 Endpoint 3: دروس الشيخ في الدورة (مع Pagination وفلتر)

| البند | التقرير يطلب | الباك اند الحالي | الحالة |
|-------|---------------|-------------------|--------|
| **المسار** | `GET /v1/courses/{courseId}/sheikhs/{sheikhId}/lessons` | يوجد `GET /api/courses/:id/lessons?sheikh_id=...` (بدون v1 وبدون sheikhs في المسار) | ⚠️ مسار مختلف وهيكلة مختلفة |
| **Query** | page, limit, isFree | page, limit موجودان؛ isFree غير مستخدم في الفلتر حالياً | ⚠️ إضافة فلتر isFree مطلوبة |
| **الفلتر** | دروس **الدورة فقط** و**التي يدرّسها هذا الشيخ** | عند sheikh_id يتم التحقق أن الشيخ مسموح فقط؛ **لا يتم فلترة الدروس** بحيث تكون فقط الدروس التي فيها فيديو لهذا الشيخ | ❌ المنطق الحالي يرجع كل دروس الدورة عند تمرير sheikh_id ولا يفلتر حسب فيديوهات الشيخ |
| **Response: كل درس** | id, title, description, videoUrl, duration, thumbnail, price, order, isPurchased, isFree, viewsCount, rating, sheikhId, sheikhName, courseId, courseName | Lesson لا يحتوي videoUrl, price, viewsCount, rating (هذه على مستوى Video)؛ الـ response الحالي يعيد lesson_number, is_locked, video_id، بدون price/views/rating على الدرس | ❌ شكل الـ response مختلف؛ وعدم وجود شراء درس فردي (انظر أدناه) |
| **Pagination** | currentPage, totalPages, totalLessons, limit, hasNextPage, hasPrevPage | موجود تقريباً (current_page, total_pages, total_items) | ✅ يمكن توحيد الأسماء |
| **Summary** | totalLessons, freeLessons, paidLessons, purchasedLessons, totalDuration | غير موجود | ❌ مطلوب إضافة |
| **isPurchased** | لكل درس | لا يوجد جدول lesson_purchases؛ يوجد فقط CourseEnrollment (اشتراك في الدورة كاملة) | ⚠️ يمكن تعيين isPurchased = true إذا كان المستخدم مسجلاً في الدورة، أو إبقاؤه false إذا أردتم شراء درس فردي لاحقاً |

**الخلاصة Endpoint 3:**  
الباك اند **جزئياً مخصص**:
- جلب الدروس للدورة مع pagination موجود.
- **ناقص:** مسار على شكل `/v1/courses/:courseId/sheikhs/:sheikhId/lessons`، فلتر الدروس بحيث فقط دروس تحتوي على فيديو لهذا الشيخ، فلتر isFree، شكل الـ response المطلوب (بما فيه videoUrl من أول فيديو، وملخص totalDuration وsummary)، وحقل isPurchased (مرتبط بالـ enrollment أو بجدول شراء دروس إذا أُضيف لاحقاً).

---

## 3. مقارنة الـ Database Schema

| التقرير (مثالي) | الباك اند الحالي | الملاحظات |
|------------------|-------------------|-----------|
| courses: name, duration string | title/titleAr, duration int | تنسيق duration للنص (مثلاً "8 أسابيع") يمكن من الفرونت أو الباك اند |
| teachers: title | لا يوجد حقل title؛ يوجد specialties/specialtiesAr | استخدام specialties كـ title أو إضافة عمود title |
| lessons: videoUrl, thumbnail, price, viewsCount, rating على الدرس | Lesson بدون هذه الحقول؛ Video فيه videoUrl, thumbnailUrl, durationSeconds؛ لا price/views/rating على الدرس | يمكن أخذ أول فيديو من الدرس لـ videoUrl و thumbnail؛ price/views/rating إما من الدورة/فيديو أو إضافة حقول لاحقاً |
| lesson_purchases (شراء درس فردي) | غير موجود؛ CourseEnrollment فقط | isPurchased إما من الـ enrollment بالدورة أو إضافة جدول lesson_purchases لاحقاً |
| course_teachers | CourseTeacher موجود | ✅ |
| Lesson.teacher_id | لا يوجد؛ Video.teacherId موجود | "دروس الشيخ" = دروس تحتوي على فيديو واحد على الأقل بـ teacherId = الشيخ |

---

## 4. الخلاصة النهائية: هل الباك اند مخصص لما في التقرير؟

| السؤال | الجواب |
|--------|--------|
| **هل الباك اند يغطي الـ Flow بالكامل؟** | **لا.** Endpoint 2 غير موجود؛ Endpoints 1 و 3 بمسارات أو أشكال response مختلفة عن التقرير. |
| **هل البيانات اللازمة موجودة في الـ DB؟** | **غالبيتها نعم.** ناقص: achievements، lesson_purchases (إن رغبتم شراء درس فردي)، وحقول اختيارية على Lesson (price, viewsCount, rating) إن رغبتم تطابقاً تاماً. |
| **ما المطلوب لتحقيق التقرير؟** | إضافة/تكييف routes وservices وتنسيق responses كما في القسم 5. |

---

## 5. خطة العمل المقترحة (كيف يكون العمل)

### المرحلة 1: توحيد المسارات والـ Response لـ Endpoint 1

1. **إضافة routes تحت v1 للدورات:**
   - إنشاء ملف مثل `routes/v1/courses.js` وتضمينه في `routes/v1/index.js` تحت `router.use('/courses', ...)`.
   - مسار واحد على الأقل: `GET /v1/courses/:courseId` (مع auth إذا طُلِب في التقرير).

2. **تكييف تفاصيل الدورة مع قائمة المشايخ:**
   - استخدام أو توسيع `courseService`: دالة من نوع `getCourseWithSheikhs(courseId)` ترجع:
     - بيانات الدورة بأسماء حقول التقرير (name من title/titleAr، duration منسق، lessonsCount, studentsCount, rating).
     - مصفوفة `sheikhs`: لكل شيخ في الدورة (من teacher + courseTeachers) مع حساب **lessonsCountInThisCourse**:
       - عدد الـ lessons التي لها على الأقل فيديو واحد بـ `teacherId = هذا الشيخ` (استعلام منفصل أو aggregate).
   - الـ response النهائي: `{ status, message, data: { course } }` كما في التقرير.

### المرحلة 2: Endpoint 2 – الشيخ في سياق الدورة

1. **إضافة route:**  
   `GET /v1/courses/:courseId/sheikhs/:sheikhId` مع auth.

2. **إضافة service:**  
   - التحقق أن الشيخ يدرّس الدورة (CourseTeacher أو وجود فيديوهات له في الدورة).
   - جلب Teacher + User + Course (courseContext).
   - حساب: lessonsCount في هذه الدورة لهذا الشيخ، studentsEnrolled من _count.enrollments، واختياري completionRate من VideoProgress/Enrollment.
   - جلب reviews الخاصة بالشيخ (من Review حيث teacherId = sheikhId) مع تحديد عدد معقول (مثلاً 10).
   - achievements: إما مصفوفة فارغة أو إضافة model Achievement لاحقاً.

3. **الـ response:**  
   نفس الشكل في التقرير: sheikh + courseContext + achievements + reviews.

### المرحلة 3: Endpoint 3 – دروس الشيخ في الدورة

1. **إضافة route:**  
   `GET /v1/courses/:courseId/sheikhs/:sheikhId/lessons` مع query: page, limit, isFree.

2. **تعديل منطق الجلب:**
   - استعلام الدروس بحيث:
     - `courseId = courseId`.
     - الدرس يحتوي على **على الأقل فيديو واحد** بـ `teacherId = sheikhId` (عبر relation videos أو شرط where على Video).
   - تطبيق فلتر isFree على Lesson.isFree عند وجوده في الـ query.
   - تطبيق pagination (skip/take) وحساب total.

3. **تنسيق كل درس في الـ response:**
   - أخذ أول فيديو للدرس لـ videoUrl و thumbnail و duration إن لزم.
   - إرجاع الحقول المطلوبة: id, title, description, videoUrl, duration, thumbnail, price (من الدورة أو 0)، order, isFree، واختياري viewsCount/rating إذا أضيفتا لاحقاً.
   - **isPurchased:**  
     - إن بقيتم على نظام الـ enrollment فقط: `isPurchased = true` إذا كان المستخدم مسجلاً في الدورة، وإلا false.
     - إن أضفتم جدول شراء دروس لاحقاً: ربط الدرس بجدول الشراء للمستخدم الحالي.

4. **إضافة summary:**
   - totalLessons, freeLessons, paidLessons (من عدد الدروس isFree true/false في نفس الفلتر).
   - purchasedLessons: من عدد الدروس التي يعتبرها النظام "مشتراة" للمستخدم (حالياً = كل الدروس إذا كان enrolled، أو 0).
   - totalDuration: مجموع مدة الفيديوهات للدروس المُرجَعَة أو للدورة، وتنسيقها كنص (مثلاً "12 ساعة و 30 دقيقة").

5. **Pagination:**  
   نفس الشكل في التقرير: currentPage, totalPages, totalLessons, limit, hasNextPage, hasPrevPage.

### المرحلة 4: اختياري – توافق إضافي مع التقرير

- إضافة حقل **title** للـ Teacher (أو الاعتماد على specialties كـ title).
- إذا رغبتم **شراء درس فردي:** إضافة جدول lesson_purchases وربط isPurchased به.
- إذا رغبتم **achievements:** إضافة model Achievement وربطها بالـ Teacher واستخدامها في Endpoint 2.

---

## 6. ملخص سريع

| العنصر | الحالة | الإجراء |
|--------|--------|---------|
| GET /v1/courses/{courseId} | غير موجود بالشكل المطلوب | إضافة تحت v1 + تكييف response + حساب lessonsCountInThisCourse |
| GET /v1/courses/{courseId}/sheikhs/{sheikhId} | غير موجود | تنفيذ كامل (route + service + response) |
| GET /v1/courses/{courseId}/sheikhs/{sheikhId}/lessons | موجود جزئياً بمسار وشكل مختلفين | إضافة route جديد + فلتر دروس حسب فيديوهات الشيخ + isFree + response + summary |
| lesson_purchases | غير موجود في الـ DB | اختياري؛ حالياً الاعتماد على enrollment لـ isPurchased |
| achievements | غير موجودة | اختياري؛ إما مصفوفة فارغة أو model جديد |

**الخلاصة:** الباك اند الحالي **ليس مخصصاً بالكامل** لما في التقرير، لكنه قريب جداً: الـ schema والخدمات الحالية تسمح بتحقيق المتطلبات عبر إضافة routes تحت `/v1/courses` وتكييف الـ responses وإضافة endpoint الشيخ في سياق الدورة وتعديل منطق "دروس الشيخ في الدورة" وملخص الدروس. خطة العمل أعلاه توضح **كيف يكون العمل** خطوة بخطوة.
