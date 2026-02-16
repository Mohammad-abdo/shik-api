# Fawry PayAtFawry Integration - API Documentation

## Overview
The PayAtFawry integration allows students to receive a reference number that they can use to pay at any Fawry retail store across Egypt.

## Endpoints

### 1. Generate Reference Number
**POST** `/api/payments/fawry/reference-number`

Generate a Fawry reference number for payment at retail stores.

#### Headers
```
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json
```

#### Request Body
```json
{
  "bookingId": "uuid-of-booking",
  "expiryHours": 48,  // Optional, defaults to FAWRY_PAYATFAWRY_EXPIRY_HOURS (24h)
  "language": "ar-eg" // Optional: "ar-eg" or "en-gb", defaults to "ar-eg"
}
```

#### Response (201 Created)
```json
{
  "referenceNumber": "1234567890",
  "merchantRefNum": "987654321",
  "paymentId": "payment-uuid",
  "amount": 100.00,
  "currency": "EGP",
  "expiresAt": "2026-02-18T12:33:00.000Z",
  "expiryHours": 48,
  "instructions": {
    "en": "Visit any Fawry store and provide this reference number to complete your payment.",
    "ar": "قم بزيارة أي فرع من فروع فوري وقدم رقم المرجع هذا لإتمام الدفع."
  }
}
```

#### Error Responses

**503 Service Unavailable** - Fawry not configured or PayAtFawry disabled
```json
{
  "success": false,
  "message": "PayAtFawry is not enabled",
  "statusCode": 503
}
```

**400 Bad Request** - Invalid request
```json
{
  "success": false,
  "message": "bookingId is required",
  "statusCode": 400
}
```

**404 Not Found** - Booking not found
```json
{
  "success": false,
  "message": "Booking not found",
  "statusCode": 404
}
```

---

### 2. Check Payment Status
**GET** `/api/payments/fawry/status/:merchantRefNum`

Check the status of a payment by merchant reference number.

#### Headers
```
Authorization: Bearer <JWT_TOKEN>
```

#### Response (200 OK)
```json
{
  "status": "PENDING",
  "amount": 100.00,
  "currency": "EGP",
  "fawryRefNumber": "1234567890",
  "paymentId": "payment-uuid"
}
```

---

### 3. Webhook (Internal)
**POST** `/api/payments/fawry/webhook`

Receives payment notifications from Fawry when a customer completes payment at a retail store.

This endpoint is called by Fawry's servers and validates the webhook signature before processing.

---

### 4. Get Fawry Info
**GET** `/api/payments/fawry`

Check if Fawry is configured and available.

#### Response (200 OK)
```json
{
  "available": true,
  "configured": true,
  "payAtFawryEnabled": true,
  "endpoints": {
    "checkoutLink": "POST /api/payments/fawry/checkout-link",
    "referenceNumber": "POST /api/payments/fawry/reference-number",
    "webhook": "POST /api/payments/fawry/webhook",
    "status": "GET /api/payments/fawry/status/:merchantRefNum"
  }
}
```

## Configuration

### Environment Variables

```env
# Enable/disable PayAtFawry
FAWRY_PAYATFAWRY_ENABLED=true

# Default expiry time in hours (can be overridden per request)
FAWRY_PAYATFAWRY_EXPIRY_HOURS=24

# Fawry credentials (required)
FAWRY_MERCHANT_CODE=your_merchant_code
FAWRY_SECURE_KEY=your_secure_key
FAWRY_BASE_URL=https://atfawry.fawrystaging.com

# Webhook URL (required for payment notifications)
FAWRY_ORDER_WEBHOOK_URL=https://your-domain.com/api/payments/fawry/webhook
```

## Payment Flow

1. **Student requests payment**
   - Mobile app calls `POST /api/payments/fawry/reference-number`
   - Provides `bookingId` and optional `expiryHours`

2. **Backend generates reference**
   - Creates payment record with status `PENDING`
   - Calls Fawry API with `paymentMethod: 'PayAtFawry'`
   - Receives reference number from Fawry
   - Stores reference number in payment record

3. **Student receives reference**
   - API returns reference number and expiry time
   - Mobile app displays reference number and instructions
   - Student visits any Fawry store to pay

4. **Payment completion**
   - Customer pays at Fawry store using reference number
   - Fawry sends webhook notification to server
   - Webhook handler validates signature and updates payment status to `COMPLETED`
   - Booking status updated accordingly

## Testing

### Test Reference Number Generation

```bash
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "your-booking-id",
    "expiryHours": 48,
    "language": "ar-eg"
  }'
```

### Test Payment Status Check

```bash
curl -X GET http://localhost:3001/api/payments/fawry/status/987654321 \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Test Fawry Info

```bash
curl -X GET http://localhost:3001/api/payments/fawry
```

## Signature Calculation

PayAtFawry uses a different signature format than Express Checkout:

```
SHA256(merchantCode + merchantRefNum + customerProfileId + paymentMethod + amount + secureKey)
```

Example:
```javascript
const signature = crypto
  .createHash('sha256')
  .update('770000022076' + '987654321' + '1234567890' + 'PayAtFawry' + '100.00' + 'your_secure_key')
  .digest('hex');
```

## Important Notes

1. **Reference Number Expiry**: Reference numbers expire after the configured time. Default is 24 hours but can be customized per request.

2. **Webhook Validation**: All webhook requests are validated using Fawry's signature mechanism to ensure authenticity.

3. **Payment Method**: The `paymentMethod` must be set to `'PayAtFawry'` for reference number generation.

4. **Customer Profile ID**: Used for tracking and must be numeric. We use the student ID (digits only).

5. **Currency**: Currently supports EGP (Egyptian Pounds).

## Error Handling

All errors follow this format:

```json
{
  "success": false,
  "message": "Error description",
  "data": {
    "fawryResponse": { /* Fawry's error response if available */ }
  },
  "statusCode": 400
}
```

Common error codes:
- `400` - Bad request (validation error)
- `403` - Forbidden (not authorized)
- `404` - Resource not found
- `502` - Bad gateway (Fawry API error)
- `503` - Service unavailable (Fawry not configured)
