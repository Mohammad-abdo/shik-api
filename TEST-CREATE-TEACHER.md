# اختبار إنشاء شيخ جديد مع مواعيد العمل

## طريقة الاختبار

### 1️⃣ شيخ كامل مع مواعيد:

```bash
POST /api/admin/teachers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "teacherType": "FULL_TEACHER",
  "email": "sheikh.test@example.com",
  "firstName": "أحمد",
  "firstNameAr": "أحمد",
  "lastName": "محمد",
  "lastNameAr": "محمد",
  "password": "123456789",
  "phone": "+201234567890",
  "bio": "Sheikh with booking schedules",
  "bioAr": "شيخ مع مواعيد حجز",
  "image": "https://example.com/image.jpg",
  "experience": 10,
  "hourlyRate": 100,
  "specialties": ["التجويد", "التحفيظ"],
  "introVideoUrl": "https://example.com/video.mp4",
  "schedules": [
    {
      "dayOfWeek": 0,
      "startTime": "09:00",
      "endTime": "12:00"
    },
    {
      "dayOfWeek": 1,
      "startTime": "14:00",
      "endTime": "17:00"
    },
    {
      "dayOfWeek": 3,
      "startTime": "10:00",
      "endTime": "13:00"
    }
  ]
}
```

### 2️⃣ شيخ دورات بدون مواعيد:

```bash
POST /api/admin/teachers
Authorization: Bearer YOUR_TOKEN
Content-Type: application/json

{
  "teacherType": "COURSE_SHEIKH",
  "email": "course.sheikh@example.com",
  "firstName": "محمد",
  "firstNameAr": "محمد",
  "lastName": "علي",
  "lastNameAr": "علي",
  "password": "123456789",
  "phone": "+201234567891",
  "bio": "Course sheikh only",
  "bioAr": "شيخ دورات فقط",
  "image": "https://example.com/image2.jpg",
  "experience": 15,
  "specialties": ["الفقه", "العقيدة"],
  "introVideoUrl": "https://example.com/video2.mp4"
}
```

## التحقق من النتيجة

### جلب بيانات الشيخ:
```bash
GET /api/admin/teachers/{teacherId}
Authorization: Bearer YOUR_TOKEN
```

### Response المتوقع للشيخ الكامل:
```json
{
  "id": "teacher-uuid",
  "teacherType": "FULL_TEACHER",
  "user": {...},
  "schedules": [
    {
      "id": "schedule-uuid-1",
      "dayOfWeek": 0,
      "startTime": "09:00",
      "endTime": "12:00",
      "isActive": true
    },
    {
      "id": "schedule-uuid-2", 
      "dayOfWeek": 1,
      "startTime": "14:00",
      "endTime": "17:00",
      "isActive": true
    }
  ]
}
```

### Response المتوقع لشيخ الدورات:
```json
{
  "id": "teacher-uuid",
  "teacherType": "COURSE_SHEIKH",
  "user": {...},
  "schedules": []
}
```

## التحقق من قاعدة البيانات

```sql
-- التحقق من الشيخ
SELECT id, teacherType, hourlyRate FROM teachers WHERE id = 'teacher-uuid';

-- التحقق من المواعيد
SELECT * FROM schedules WHERE teacherId = 'teacher-uuid';

-- التحقق من المحفظة
SELECT * FROM teacher_wallets WHERE teacherId = 'teacher-uuid';
```