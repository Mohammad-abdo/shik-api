const crypto = require('crypto');

/**
 * فوري - مطابق لـ https://developer.fawrystaging.com/docs/express-checkout/self-hosted-checkout
 * نفس صيغة طلب الشحن والتوقيع تُستخدم لـ Checkout Link (السيرفر يرسل الطلب ويستقبل paymentUrl).
 */

const CHARGE_PATH = '/ECommerceWeb/Fawry/payments/charge';

/**
 * التوقيع حسب الوثيقة:
 * merchantCode + merchantRefNum + customerProfileId (إذا وُجد وإلا "") + returnUrl
 * + [كل عنصر مرتّب حسب itemId: itemId + quantity + Price بصيغة منزلتين مثل '10.00']
 * + Secure hash key
 * ثم SHA-256 للناتج.
 */
function buildSignature(merchantCode, merchantRefNum, customerProfileId, returnUrl, chargeItems, secureKey) {
  const profilePart = customerProfileId != null && String(customerProfileId).trim() !== '' ? String(customerProfileId).trim() : '';
  const sorted = [...chargeItems].sort((a, b) => {
    const idA = (a.itemId || '');
    const idB = (b.itemId || '');
    return idA === idB ? 0 : idA > idB ? 1 : -1;
  });
  let itemsPart = '';
  for (const item of sorted) {
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    const priceStr = Number.isFinite(price) ? price.toFixed(2) : '0.00';
    const qty = Math.floor(Number(item.quantity) || 1);
    itemsPart += String(item.itemId || '') + String(qty) + priceStr;
  }
  const toHash = String(merchantCode).trim() + String(merchantRefNum).trim() + profilePart + String(returnUrl).trim() + itemsPart + String(secureKey).trim();
  console.log('Fawry Signature Source:', toHash);
  return crypto.createHash('sha256').update(toHash, 'utf8').digest('hex');
}

/**
 * بناء كائن طلب الشحن مطابقاً لـ FawryPay Hosted Checkout (نفس البنية والترتيب في الوثيقة).
 * وثيقة الرابط: https://developer.fawrystaging.com/docs/express-checkout/fawrypay-hosted-checkout
 * التوقيع: merchantCode + merchantRefNum + customerProfileId أو "" + returnUrl + [مرتب حسب itemId: itemId+quantity+Price بصيغة 10.00] + Secure hash key ثم SHA-256.
 */
function buildChargeRequest(options) {
  const merchantCode = String(options.merchantCode ?? '').trim();
  const merchantRefNum = String(options.merchantRefNum ?? '').trim();
  const returnUrl = String(options.returnUrl ?? '').trim();
  const secureKey = String(options.secureKey ?? '').trim();
  const customerProfileIdRaw = options.customerProfileId != null && String(options.customerProfileId).trim() !== '' ? String(options.customerProfileId).trim() : '';
  const customerProfileIdForSignature = customerProfileIdRaw;

  const chargeItems = (options.chargeItems || []).map((item) => {
    const rawPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    const priceVal = Number.isFinite(rawPrice) ? rawPrice : 0;
    const price = priceVal.toFixed(2); // Fawry expects string "10.00"
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const itemId = String(item.itemId || '').trim().replace(/[^a-zA-Z0-9]/g, '') || 'item1';
    return {
      itemId,
      description: String(item.description || '').trim() || 'Product Description',
      price,
      quantity,
    };
  });

  // Sort items by itemId to ensure signature matches payload order
  // Sort items by itemId to ensure signature matches payload order
  chargeItems.sort((a, b) => {
    const idA = (a.itemId || '');
    const idB = (b.itemId || '');
    return idA === idB ? 0 : idA > idB ? 1 : -1;
  });

  // Determine Payment Method FIRST so it can be signed
  const paymentMethod = options.paymentMethod && ['CashOnDelivery', 'PayAtFawry', 'MWALLET', 'CARD', 'VALU'].includes(options.paymentMethod)
    ? options.paymentMethod
    : 'CARD';

  const signature = buildSignature(merchantCode, merchantRefNum, customerProfileIdForSignature, returnUrl, chargeItems, secureKey);

  // ترتيب الحقول كما في وثيقة Fawry (Hosted Checkout مثال buildChargeRequest)
  const request = {
    merchantCode,
    merchantRefNum,
  };
  if (options.customerMobile) request.customerMobile = String(options.customerMobile).replace(/\s/g, '');
  if (options.customerEmail) request.customerEmail = String(options.customerEmail || '').trim();
  if (options.customerName) request.customerName = String(options.customerName || '').trim();
  if (customerProfileIdRaw !== '') {
    request.customerProfileId = customerProfileIdRaw;
  }
  if (options.paymentExpiry != null && options.paymentExpiry !== '') request.paymentExpiry = String(options.paymentExpiry);
  request.language = options.language === 'en-gb' ? 'en-gb' : 'ar-eg';
  request.chargeItems = chargeItems;
  request.paymentMethod = paymentMethod;
  request.returnUrl = returnUrl;
  if (options.orderWebHookUrl) request.orderWebHookUrl = String(options.orderWebHookUrl).trim();
  request.authCaptureModePayment = false;
  request.signature = signature;

  return request;
}

/**
 * استدعاء واجهة فوري لإنشاء رابط الدفع (Checkout Link).
 * POST بنفس الطلب إلى نفس الـ endpoint المذكور في وثيقة Hosted.
 */
async function createCharge(chargeRequest) {
  const baseUrl = (process.env.FAWRY_BASE_URL || 'https://atfawry.fawrystaging.com').replace(/\/$/, '');
  const url = baseUrl + (process.env.FAWRY_CHARGE_PATH || CHARGE_PATH);

  let res;
  try {
    console.log('Sending to Fawry:', url);
    console.log('Payload:', JSON.stringify(chargeRequest, null, 2));
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chargeRequest),
    });
  } catch (err) {
    console.error('Fawry Fetch Error:', err);
    const cause = err.cause || err;
    const msg = cause.code ? `Fawry unreachable (${cause.code})` : err.message || 'fetch failed';
    const e = new Error(msg);
    e.statusCode = 502;
    e.fawryResponse = { networkError: true, error: err.message };
    throw e;
  }

  const text = await res.text();
  console.log('Fawry Response Status:', res.status);
  console.log('Fawry Response Body:', text);

  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse Fawry JSON:', e);
  }

  if (res.ok) {
    const paymentUrl = data.paymentUrl || data.redirectUrl || data.url;
    if (paymentUrl) {
      return { paymentUrl, expiresAt: data.expiresAt, referenceNumber: data.referenceNumber };
    }
    const e = new Error(data.statusDescription || data.message || 'No payment URL in response');
    // If we have a response from Fawry but it's an error (e.g. 9929, 9901), it's a Bad Request (400), not Bad Gateway (502)
    e.statusCode = 400;
    console.error('Fawry Detail Error:', JSON.stringify(data, null, 2)); // Log full error details
    e.fawryResponse = data;
    throw e;
  }

  const e = new Error(data.statusDescription || data.message || `Fawry ${res.status}`);
  // If 404/500+ -> 502. If 400-499 -> 400.
  e.statusCode = res.status === 404 ? 502 : res.status >= 500 ? 502 : 400;
  e.fawryResponse = data;
  throw e;
}

function verifyWebhookSignature(payload, secureKey) {
  const a = (payload.fawryRefNumber || '').toString();
  const b = (payload.merchantRefNumber || payload.merchantRefNum || '').toString();
  const c = formatTwoDecimals(payload.paymentAmount);
  const d = formatTwoDecimals(payload.orderAmount);
  const e = (payload.orderStatus || '').toString();
  const f = (payload.paymentMethod || '').toString();
  const g = (payload.paymentRefrenceNumber || payload.paymentReferenceNumber || '').toString();
  const str = a + b + c + d + e + f + g + String(secureKey || '').trim();
  const expected = crypto.createHash('sha256').update(str, 'utf8').digest('hex').toLowerCase();
  const received = (payload.messageSignature || '').toLowerCase();
  return expected === received;
}

function formatTwoDecimals(v) {
  if (v == null || v === '') return '0.00';
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? n.toFixed(2) : '0.00';
}

module.exports = {
  buildSignature,
  buildChargeRequest,
  createCharge,
  verifyWebhookSignature,
  CHARGE_PATH,
};
