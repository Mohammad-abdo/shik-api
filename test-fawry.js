/**
 * سكربت تجربة Fawry Pay من الطرفية
 *
 * الاستخدام:
 *   node test-fawry.js
 *   node test-fawry.js --booking-id=UUID
 *   node test-fawry.js --status=MERCHANT_REF_NUM
 *
 * متغيرات البيئة:
 *   API_BASE          = http://localhost:3001
 *   LOGIN_EMAIL       = بريد الطالب
 *   LOGIN_PASSWORD    = كلمة المرور
 *   BOOKING_ID        = (اختياري) UUID حجز بحالة CONFIRMED
 *
 * للتجربة الفعلية مع فوري:
 *   1) أضف في .env من حساب Fawry Staging: FAWRY_MERCHANT_CODE و FAWRY_SECURE_KEY
 *   2) FAWRY_RETURN_URL_BASE = مثلاً https://example.com/return أو deep link التطبيق
 *   3) شغّل السيرفر (node app.js) ثم: node test-fawry.js
 */
require('dotenv').config();
const API_BASE = process.env.API_BASE || 'http://localhost:3001';

async function login(email, password, userType = 'student') {
  const url = `${API_BASE}/api/auth/login`;
  const body = userType === 'sheikh' ? { email, password, user_type: 'sheikh' } : { email, password };
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.data?.message || data.message || `Login failed: ${res.status}`;
    throw new Error(msg);
  }
  const token = data.data?.auth_token ?? data.data?.accessToken ?? data.accessToken ?? data.token;
  if (!token) throw new Error('No token in login response. Keys: ' + JSON.stringify(Object.keys(data.data || data)));
  return token;
}

async function getMyBookings(token) {
  const res = await fetch(`${API_BASE}/api/bookings`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Bookings failed: ${res.status}`);
  const data = await res.json();
  const list = data.data ?? data;
  return Array.isArray(list) ? list : (list?.bookings ?? []);
}

async function createFawryCheckoutLink(token, bookingId, returnUrl, language) {
  const url = `${API_BASE}/api/payments/fawry/checkout-link`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      bookingId,
      returnUrl: returnUrl || 'https://example.com/payment-return',
      language: language || 'ar-eg',
    }),
  });
  const data = await res.json();
  if (!res.ok) {
    const msg = data.data?.message || data.message || data.error || `Request failed: ${res.status}`;
    throw new Error(msg);
  }
  return data.data ?? data;
}

async function getPaymentStatus(token, merchantRefNum) {
  const url = `${API_BASE}/api/payments/fawry/status/${encodeURIComponent(merchantRefNum)}`;
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) throw new Error(`Status failed: ${res.status}`);
  return res.json();
}

async function main() {
  const args = process.argv.slice(2);
  let bookingId = process.env.BOOKING_ID;
  let statusRef = null;
  args.forEach((a) => {
    if (a.startsWith('--booking-id=')) bookingId = a.slice('--booking-id='.length);
    if (a.startsWith('--status=')) statusRef = a.slice('--status='.length);
  });

  const email = process.env.LOGIN_EMAIL || 'student@example.com';
  const password = process.env.LOGIN_PASSWORD || 'password';

  console.log('API Base:', API_BASE);
  console.log('Login as:', email);
  console.log('---');

  let token;
  try {
    token = await login(email, password, 'student');
    console.log('تم تسجيل الدخول بنجاح.');
  } catch (e) {
    console.error('فشل تسجيل الدخول:', e.message);
    console.log('\nتأكد من: LOGIN_EMAIL و LOGIN_PASSWORD (حساب طالب).');
    process.exit(1);
  }

  if (statusRef) {
    try {
      const out = await getPaymentStatus(token, statusRef);
      console.log('حالة الدفع:', JSON.stringify(out, null, 2));
    } catch (e) {
      console.error('فشل جلب الحالة:', e.message);
      process.exit(1);
    }
    return;
  }

  if (!bookingId) {
    const bookings = await getMyBookings(token);
    const confirmed = bookings.filter((b) => b.status === 'CONFIRMED');
    if (confirmed.length === 0) {
      console.error('لا يوجد حجز بحالة CONFIRMED لهذا الطالب.');
      console.log('حدد BOOKING_ID يدوياً: node test-fawry.js --booking-id=UUID');
      process.exit(1);
    }
    bookingId = confirmed[0].id;
    console.log('استخدام أول حجز مؤكد:', bookingId);
  }

  try {
    const result = await createFawryCheckoutLink(token, bookingId);
    console.log('\nنتيجة إنشاء رابط الدفع:');
    console.log(JSON.stringify(result, null, 2));
    if (result.paymentUrl) {
      console.log('\nافتح الرابط في المتصفح للتجربة:');
      console.log(result.paymentUrl);
      if (result.merchantRefNum) {
        console.log('\nللتحقق من الحالة لاحقاً:');
        console.log(`  node test-fawry.js --status=${result.merchantRefNum}`);
      }
    }
  } catch (e) {
    console.error('فشل إنشاء رابط الدفع:', e.message);
    if (e.message.includes('not configured') || e.message.includes('503')) {
      console.log('\nأضف في .env: FAWRY_MERCHANT_CODE و FAWRY_SECURE_KEY (من حساب فوري Staging).');
    }
    process.exit(1);
  }
}

main();
