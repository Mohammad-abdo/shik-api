# نشر مسارات فوري (Fawry) على السيرفر

إذا ظهر **404** عند استدعاء:
`POST https://shike.developteam.site/api/payments/fawry/checkout-link`

فهذا يعني أن السيرفر المنشور **لا يشغّل آخر نسخة** من الـ API التي تحتوي مسارات فوري.

## ما المطلوب؟

1. **إعادة نشر الـ Backend (مشروع shik-api)** على السيرفر الذي يخدم `shike.developteam.site` (أو الدومين الذي يشغّل الـ API).
2. التأكد أن النشر يشمل كل الملفات الحالية، خاصة:
   - `routes/payments.js` (فيه مسارات `/fawry/checkout-link`, `/fawry/webhook`, `/fawry/status/:merchantRefNum`)
   - `services/fawry.js`
   - أي migration لـ Prisma إن استخدمتها.

## التحقق بعد النشر

- افتح في المتصفح أو استدعِ:
  `GET https://shike.developteam.site/api/payments/fawry`
- إذا رجع JSON فيه `"available": true` فمسارات فوري منشورة وتعمل.
- إذا رجع 404 فما زال السيرفر يشغّل نسخة قديمة من الـ API؛ تأكد من إعادة النشر وعدم وجود كاش أو CDN يخفي المسار.

## متغيرات البيئة على السيرفر

على السيرفر أضف في `.env` (أو في لوحة الـ hosting):

- `FAWRY_MERCHANT_CODE` — من حساب فوري
- `FAWRY_SECURE_KEY` — من حساب فوري
- `FAWRY_BASE_URL` — للـ staging: `https://atfawry.fawrystaging.com`
- `FAWRY_RETURN_URL_BASE` — رابط الإرجاع بعد الدفع (مثلاً الداشبورد أو التطبيق)
- `BASE_URL` — عنوان الـ API العام (مثلاً `https://shike.developteam.site`) لاستخدامه في webhook فوري

بعد ذلك صفحة **تجربة فوري** في الداشبورد ستستطيع إنشاء رابط الدفع وستفتح صفحة فوري مثل [الوضع في الوثائق](https://developer.fawrystaging.com/docs/express-checkout/fawrypay-hosted-checkout).
