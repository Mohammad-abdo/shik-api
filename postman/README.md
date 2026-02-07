# Postman – API مشايخ القرآن (Quran Sheikhs)

## الاستيراد

1. افتح Postman → **Import** → اختر الملف `Quran-Sheikhs-API.postman_collection.json`.
2. حدّث المتغيرات في الـ Collection:
   - **base_url**: عنوان الـ API (مثال: `http://localhost:3001/api/v1`).
   - **token**: JWT للمستخدم بعد تسجيل الدخول (للطلبات التي تتطلب مصادقة).
   - **sheikh_id**: معرف شيخ (يُعبَّأ من استجابة "Get All Quran Sheikhs" أو يدوياً).
   - **session_id**: معرف الجلسة (من استجابة "Get My Sessions").

## الهيدرات العامة

- **Authorization**: `Bearer <YOUR_JWT_TOKEN>` (للطلبات المحمية).
- **Accept-Language**: `ar` أو `en` (لغة النصوص في الاستجابة).

## Endpoints المضمّنة

| # | Method | Path | الوصف |
|---|--------|------|--------|
| 1 | GET | `/quran-sheikhs` | جلب قائمة مشايخ القرآن (page, limit, search) |
| 2 | GET | `/quran-sheikhs/:id` | تفاصيل الشيخ (مع is_subscribed إن وُجد توكن) |
| 3 | GET | `/quran-sheikhs/:id/reviews` | جلب تعليقات الشيخ |
| 4 | POST | `/quran-sheikhs/:id/reviews` | إضافة تعليق (للطالب المشترك فقط) |
| 5 | POST | `/bookings` | حجز باقة مع الشيخ (sheikh_id, package_id, payment_type) |
| 6 | GET | `/student/sessions` | جدول جلسات الطالب (month, year) |
| 7 | GET | `/student/sessions/:id/report` | تقرير الجلسة |

جميع الطلبات الأساس: `{{base_url}}` = `http://localhost:3001/api/v1` (أو عنوان السيرفر الفعلي).
