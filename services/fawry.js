const crypto = require('crypto');
const logger = require('../utils/logger');

/**
 * Fawry Checkout Link API
 * Endpoint: /fawrypay-api/api/payments/init
 */

const FawryPay_Express_Checkout_Link_API = process.env.FawryPay_Express_Checkout_Link_API;

/**
 * Build signature according to Fawry documentation:
 * merchantCode + merchantRefNum + customerProfileId (or "") + returnUrl
 * + [sorted by itemId: itemId + quantity + price as "10.00"]
 * + Secure hash key
 * Then SHA-256
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
  logger.debug('Fawry Signature Source', { signatureSource: toHash });
  return crypto.createHash('sha256').update(toHash, 'utf8').digest('hex');
}

/**
 * Build charge request matching Fawry Checkout Link API format
 */
function buildChargeRequest(options) {
  const merchantCode = String(options.merchantCode ?? '').trim();
  const merchantRefNum = String(options.merchantRefNum ?? '').trim();
  const returnUrl = String(options.returnUrl ?? '').trim();
  const secureKey = String(options.secureKey ?? '').trim();
  const customerProfileIdRaw = options.customerProfileId != null && String(options.customerProfileId).trim() !== '' ? String(options.customerProfileId).trim() : '';

  // Process charge items - keep prices as numbers
  const chargeItems = (options.chargeItems || []).map((item) => {
    const rawPrice = typeof item.price === 'number' ? item.price : parseFloat(item.price);
    const priceVal = Number.isFinite(rawPrice) ? rawPrice : 0;
    const price = parseFloat(priceVal.toFixed(2)); // Number format
    const quantity = Math.max(1, Math.floor(Number(item.quantity) || 1));
    const itemId = String(item.itemId || '').trim() || 'item1';
    return {
      itemId,
      description: String(item.description || '').trim() || 'Product Description',
      price,
      quantity,
    };
  });

  // Calculate total amount as string with 2 decimals
  const totalAmount = chargeItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);

  // For signature, we need items with price as string
  const itemsForSignature = chargeItems.map(item => ({
    ...item,
    price: item.price.toFixed(2)
  }));

  const signature = buildSignature(merchantCode, merchantRefNum, customerProfileIdRaw, returnUrl, itemsForSignature, secureKey);

  // Build request matching Fawry's API format
  const request = {
    merchantCode,
    merchantRefNum,
    customerName: options.customerName ? String(options.customerName).trim() : '',
    customerMobile: options.customerMobile ? String(options.customerMobile).replace(/\s/g, '') : '',
    customerEmail: options.customerEmail ? String(options.customerEmail).trim() : '',
    customerProfileId: customerProfileIdRaw,
    amount: totalAmount.toFixed(2), // String format "100.00"
    currencyCode: options.currencyCode || 'EGP',
    language: options.language === 'en-gb' ? 'en-gb' : 'ar-eg',
    chargeItems,
    paymentMethod: options.paymentMethod || 'CARD',
    enable3DS: options.enable3DS !== false, // Default to true
    returnUrl,
    description: options.description || 'Payment',
    signature,
  };

  return request;
}

/**
 * Call Fawry API to create checkout link
 */
async function createCharge(chargeRequest) {
  const baseUrl = process.env.FAWRY_BASE_URL || 'https://atfawry.fawrystaging.com';
  const url = baseUrl.replace(/\/$/, '') + (process.env.FawryPay_Express_Checkout_Link_API || FawryPay_Express_Checkout_Link_API);

  let res;
  try {
    logger.info('Sending to Fawry', { url, payload: chargeRequest });
    res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(chargeRequest),
    });
  } catch (err) {
    logger.error('Fawry Fetch Error', err);
    const cause = err.cause || err;
    const msg = cause.code ? `Fawry unreachable (${cause.code})` : err.message || 'fetch failed';
    const e = new Error(msg);
    e.statusCode = 502;
    e.fawryResponse = { networkError: true, error: err.message };
    throw e;
  }

  const text = await res.text();
  logger.info('Fawry Response', { status: res.status, body: text });

  // Check if response is a direct URL (successful payment link)
  if (res.ok && text.startsWith('http')) {
    logger.info('Fawry returned payment URL', { paymentUrl: text });
    return {
      paymentUrl: text,
      expiresAt: null,
      referenceNumber: null
    };
  }

  // Try to parse as JSON (for errors or structured responses)
  let data = {};
  try {
    data = JSON.parse(text);
  } catch (e) {
    // If not JSON and not a URL, it's an unexpected response
    if (!res.ok) {
      logger.error('Failed to parse Fawry response', { text, error: e.message });
      const err = new Error('Fawry returned invalid response');
      err.statusCode = 502;
      err.fawryResponse = { rawResponse: text };
      throw err;
    }
  }

  if (res.ok) {
    const paymentUrl = data.paymentUrl || data.redirectUrl || data.url;
    if (paymentUrl) {
      return { paymentUrl, expiresAt: data.expiresAt, referenceNumber: data.referenceNumber };
    }
    const e = new Error(data.statusDescription || data.description || data.message || 'No payment URL in response');
    e.statusCode = 400;
    logger.error('Fawry Detail Error', { statusCode: data.statusCode, statusDescription: data.statusDescription, errorId: data.errorId, fullResponse: data });
    e.fawryResponse = data;
    throw e;
  }

  const e = new Error(data.statusDescription || data.description || data.message || `Fawry ${res.status}`);
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
  FawryPay_Express_Checkout_Link_API,
};
