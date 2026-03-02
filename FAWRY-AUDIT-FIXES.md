# Fawry Payment Integration – Audit & Fixes

## 1) PAYMENT CREATION – What was wrong & what was fixed

### Issues
- **Payment record** was created with `bookingId`, `amount`, `merchantRefNum` but **no `userId`** and **no explicit type** (BOOKING | SUBSCRIPTION | COURSE).
- **merchantRefNumber** for bookings used a 9-digit random number, which could **theoretically collide**.
- **Subscription** payments (in `studentSubscriptionService`) did not set `paymentType` or `userId`.
- **Course** payments were not supported (no `courseId` or type COURSE).

### Fixes
- **Schema**
  - Added `PaymentType` enum: `BOOKING`, `SUBSCRIPTION`, `COURSE`.
  - Added to `Payment`: `paymentType` (default `BOOKING`), `userId`, `courseId`, and relations to `User` and `Course`.
- **Booking Fawry** (`/fawry/checkout-link` and `/fawry/reference-number`):
  - Create/update Payment with `paymentType: 'BOOKING'`, `userId: booking.studentId`, and a **unique** `merchantRefNum` (`B` + timestamp + 6-digit random).
- **Subscription** (`studentSubscriptionService`):
  - Create Payment with `paymentType: 'SUBSCRIPTION'`, `userId: subscription.studentId` (subscription already used UUID as `merchantRefNum`).
- **Course**: Schema and webhook support type COURSE and `courseId`; creation of course payments can be added when you have a “pay for course” flow.

---

## 2) FAWRY CALLBACK / WEBHOOK – What was wrong & what was fixed

### Issues
- **No transaction**: Payment update and booking/subscription updates were separate; a failure in between could leave **inconsistent state**.
- **No COURSE handling**: Successful payment for a course did not create **CourseEnrollment**.
- **Booking status**: Document said “update booking.status = PAID”; the system uses **CONFIRMED** after payment, which was already correct.

### Fixes
- **POST /api/payments/fawry/webhook** and **POST /api/payments/fawry/callback** (same handler):
  - **Signature** is validated with `fawryService.verifyWebhookSignature(payload, secureKey)`; invalid callbacks get **400**.
  - **merchantRefNumber** is matched to a single Payment; if not found, respond **200** (no body change).
  - All updates run inside **`prisma.$transaction`**:
    - Update payment `status` and `fawryRefNumber`.
    - If status becomes **COMPLETED**:
      - **BOOKING**: `booking.status` → `CONFIRMED` (where status was PENDING).
      - **SUBSCRIPTION**: set subscription to **ACTIVE** and link `paymentId`; confirm related PENDING bookings.
      - **COURSE**: **upsert** `CourseEnrollment` for `(courseId, userId)` with status ACTIVE.
  - **Callback URL**: You can use either `/api/payments/fawry/webhook` or `/api/payments/fawry/callback`.

---

## 3) PREVENT DUPLICATION – What was wrong & what was fixed

### Issues
- If Fawry sent the callback **twice**, the handler would **update the payment and related entities again** (e.g. booking already CONFIRMED).

### Fixes
- **Idempotency**: At the start of the handler, if `payment.status === 'COMPLETED'`, respond **200** with `{ received: true, alreadyProcessed: true, paymentId }` and **do not run** the transaction or any updates.
- All “on success” logic (booking, subscription, course) runs only when transitioning to COMPLETED inside the same transaction.

---

## 4) FRONTEND (/payments PAGE) – What was wrong & what was fixed

### Issues
- No **Fawry reference** (merchantRefNum / fawryRefNumber) shown.
- No **related item** (booking vs subscription vs course).
- No filter by **type** (BOOKING / SUBSCRIPTION / COURSE).
- Amount used `$` and `/100`; status showed backend value (e.g. COMPLETED) instead of a user-friendly label (e.g. SUCCEEDED).

### Fixes
- **Columns**: Transaction ID, **Fawry ref** (merchantRefNum + fawryRefNumber), User, **Related** (Booking #… / Subscription: … / Course: …), Amount, Status, Date, Actions.
- **Filters**: **Status** (All / SUCCEEDED / PENDING / FAILED / REFUNDED) and **Type** (All / Booking / Subscription / Course). Backend maps `SUCCEEDED` → `COMPLETED` for the API.
- **Status display**: Backend status `COMPLETED` is shown as **SUCCEEDED** in the UI.
- **Amount**: Uses **`formatCurrency`** from currency context (e.g. EGP).
- **Stats**: Revenue and counts use the same currency formatting and include **failedCount** from backend.

---

## 5) SECURITY – What was wrong & what was fixed

### Issues
- **Signature** was already verified; no **logging** of callback payloads for auditing.

### Fixes
- **Signature**: Unchanged – still using `fawryService.verifyWebhookSignature(payload, FAWRY_SECURE_KEY)`. Invalid signature → **400**, no DB changes.
- **Logging**: Every callback is logged (e.g. `logger.info('Fawry webhook received', { merchantRefNum, orderStatus, payload })` with signature redacted). If the app logger is unavailable, a console fallback is used.

---

## Backfill (optional)

Existing payments created before this audit have `paymentType = 'BOOKING'` (default). To make **subscription** payments filter correctly by type, run once:

```sql
UPDATE payments SET paymentType = 'SUBSCRIPTION' WHERE subscriptionId IS NOT NULL;
```

---

## Summary

| Area              | Was wrong / missing                               | Fixed / added                                                                 |
|-------------------|----------------------------------------------------|-------------------------------------------------------------------------------|
| Payment creation  | No type, no userId; weak merchantRef uniqueness   | paymentType, userId, courseId; unique merchantRefNum; BOOKING/SUBSCRIPTION set |
| Webhook           | No transaction; no COURSE handling                 | Single transaction; BOOKING → CONFIRMED; SUBSCRIPTION → ACTIVE; COURSE → CourseEnrollment |
| Duplication       | Callback could apply twice                         | Idempotency: if already COMPLETED, return 200 and skip updates               |
| Frontend          | No Fawry ref, no related item, no type filter       | Fawry ref, Related column, type + status filters, formatCurrency, SUCCEEDED   |
| Security          | No callback logging                                | Log all callbacks (signature redacted); reject invalid signature              |
