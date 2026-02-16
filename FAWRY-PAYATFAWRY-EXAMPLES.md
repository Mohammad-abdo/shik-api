# Fawry PayAtFawry - Usage Examples

## Example 1: Generate Reference Number with Default Expiry

```bash
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "language": "ar-eg"
  }'
```

**Response:**
```json
{
  "referenceNumber": "8765432109",
  "merchantRefNum": "123456789",
  "paymentId": "payment-uuid-here",
  "amount": 150.00,
  "currency": "EGP",
  "expiresAt": "2026-02-17T12:33:00.000Z",
  "expiryHours": 24,
  "instructions": {
    "en": "Visit any Fawry store and provide this reference number to complete your payment.",
    "ar": "قم بزيارة أي فرع من فروع فوري وقدم رقم المرجع هذا لإتمام الدفع."
  }
}
```

---

## Example 2: Generate Reference Number with Custom Expiry

```bash
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..." \
  -H "Content-Type: application/json" \
  -d '{
    "bookingId": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "expiryHours": 72,
    "language": "en-gb"
  }'
```

**Response:**
```json
{
  "referenceNumber": "9876543210",
  "merchantRefNum": "987654321",
  "paymentId": "payment-uuid-here",
  "amount": 150.00,
  "currency": "EGP",
  "expiresAt": "2026-02-19T12:33:00.000Z",
  "expiryHours": 72,
  "instructions": {
    "en": "Visit any Fawry store and provide this reference number to complete your payment.",
    "ar": "قم بزيارة أي فرع من فروع فوري وقدم رقم المرجع هذا لإتمام الدفع."
  }
}
```

---

## Example 3: Check Payment Status

```bash
curl -X GET http://localhost:3001/api/payments/fawry/status/123456789 \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
```

**Response (Pending):**
```json
{
  "status": "PENDING",
  "amount": 150.00,
  "currency": "EGP",
  "fawryRefNumber": null,
  "paymentId": "payment-uuid-here"
}
```

**Response (Completed):**
```json
{
  "status": "COMPLETED",
  "amount": 150.00,
  "currency": "EGP",
  "fawryRefNumber": "8765432109",
  "paymentId": "payment-uuid-here"
}
```

---

## Example 4: Mobile App Integration (React Native)

```javascript
import React, { useState } from 'react';
import { View, Text, Button, Alert } from 'react-native';

const PaymentScreen = ({ booking, authToken }) => {
  const [referenceNumber, setReferenceNumber] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReferenceNumber = async () => {
    setLoading(true);
    try {
      const response = await fetch('http://your-api.com/api/payments/fawry/reference-number', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          bookingId: booking.id,
          expiryHours: 48,
          language: 'ar-eg',
        }),
      });

      const data = await response.json();
      
      if (response.ok) {
        setReferenceNumber(data);
        Alert.alert(
          'Reference Number Generated',
          `Your reference number is: ${data.referenceNumber}\n\nExpires: ${new Date(data.expiresAt).toLocaleString()}`
        );
      } else {
        Alert.alert('Error', data.message || 'Failed to generate reference number');
      }
    } catch (error) {
      Alert.alert('Error', 'Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async () => {
    if (!referenceNumber) return;

    try {
      const response = await fetch(
        `http://your-api.com/api/payments/fawry/status/${referenceNumber.merchantRefNum}`,
        {
          headers: {
            'Authorization': `Bearer ${authToken}`,
          },
        }
      );

      const data = await response.json();
      
      if (data.status === 'COMPLETED') {
        Alert.alert('Payment Successful', 'Your payment has been confirmed!');
      } else if (data.status === 'FAILED') {
        Alert.alert('Payment Failed', 'Your payment was not successful.');
      } else {
        Alert.alert('Payment Pending', 'Payment is still pending.');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to check payment status.');
    }
  };

  return (
    <View style={{ padding: 20 }}>
      {!referenceNumber ? (
        <Button
          title="Pay at Fawry Store"
          onPress={generateReferenceNumber}
          disabled={loading}
        />
      ) : (
        <View>
          <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
            Reference Number
          </Text>
          <Text style={{ fontSize: 36, color: '#007bff', marginBottom: 20 }}>
            {referenceNumber.referenceNumber}
          </Text>
          <Text style={{ marginBottom: 10 }}>
            Amount: {referenceNumber.amount} {referenceNumber.currency}
          </Text>
          <Text style={{ marginBottom: 10 }}>
            Expires: {new Date(referenceNumber.expiresAt).toLocaleString()}
          </Text>
          <Text style={{ marginBottom: 20, fontStyle: 'italic' }}>
            {referenceNumber.instructions.ar}
          </Text>
          <Button
            title="Check Payment Status"
            onPress={checkPaymentStatus}
          />
        </View>
      )}
    </View>
  );
};

export default PaymentScreen;
```

---

## Example 5: Error Handling

### Booking Not Found
```bash
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "invalid-id"}'
```

**Response (404):**
```json
{
  "success": false,
  "message": "Booking not found",
  "data": null,
  "statusCode": 404
}
```

### PayAtFawry Disabled
```bash
# When FAWRY_PAYATFAWRY_ENABLED=false
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "valid-id"}'
```

**Response (503):**
```json
{
  "success": false,
  "message": "PayAtFawry is not enabled",
  "data": null,
  "statusCode": 503
}
```

### Payment Already Completed
```bash
curl -X POST http://localhost:3001/api/payments/fawry/reference-number \
  -H "Authorization: Bearer token" \
  -H "Content-Type: application/json" \
  -d '{"bookingId": "already-paid-booking"}'
```

**Response (400):**
```json
{
  "success": false,
  "message": "Payment already completed",
  "data": null,
  "statusCode": 400
}
```

---

## Example 6: Webhook Simulation (For Testing)

```bash
# Simulate Fawry webhook notification
curl -X POST http://localhost:3001/api/payments/fawry/webhook \
  -H "Content-Type: application/json" \
  -d '{
    "fawryRefNumber": "8765432109",
    "merchantRefNumber": "123456789",
    "paymentAmount": "150.00",
    "orderAmount": "150.00",
    "orderStatus": "PAID",
    "paymentMethod": "PayAtFawry",
    "paymentRefrenceNumber": "FWY123456",
    "messageSignature": "calculated_signature_here"
  }'
```

**Note:** The signature must be valid for the webhook to be processed.

---

## Testing Checklist

- [ ] Generate reference number with default expiry
- [ ] Generate reference number with custom expiry (48 hours)
- [ ] Verify reference number is stored in database
- [ ] Check payment status returns PENDING
- [ ] Simulate webhook notification
- [ ] Verify payment status updates to COMPLETED
- [ ] Test with invalid booking ID (should return 404)
- [ ] Test with already paid booking (should return 400)
- [ ] Test with PayAtFawry disabled (should return 503)
- [ ] Verify expiry time calculation is correct
- [ ] Test bilingual instructions (ar-eg and en-gb)
