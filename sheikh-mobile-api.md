# 📘 Sheikh Mobile API Documentation

## 🎯 Overview

هذا المستند يشرح جميع الـ APIs الخاصة بتطبيق الشيخ (Mobile App) وتشمل:

- **Authentication**
- **Profile**
- **My Students**
- **My Sessions**
- **Session Reports**
- **Wallet**
- **Withdraw Requests**
- **Delete Account**

---

## 🔐 1) Authentication

### ✅ Register Sheikh

**POST** `/api/mobile/sheikh/register`

**Body:**

```json
{
  "name": "string",
  "email": "string",
  "phone": "string",
  "password": "string",
  "confirmPassword": "string"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Sheikh registered successfully",
  "data": {
    "id": "uuid",
    "name": "string",
    "email": "string",
    "phone": "string",
    "token": "jwt-token"
  }
}
```

---

### ✅ Login

**POST** `/api/mobile/sheikh/login`

**Body:**

```json
{
  "phone": "string",
  "password": "string"
}
```

**Response:**

```json
{
  "success": true,
  "data": {
    "token": "jwt-token",
    "sheikh": {
      "id": "uuid",
      "name": "string",
      "email": "string"
    }
  }
}
```

---

### ✅ Logout

**POST** `/api/mobile/sheikh/logout`

**Header:**

```
Authorization: Bearer token
```

---

### ❌ Delete Account

**DELETE** `/api/mobile/sheikh/delete-account`

Deletes Sheikh and all related data (soft delete preferred).

---

## 👤 2) Profile

### ✅ Get Profile

**GET** `/api/mobile/sheikh/profile`

**Response:**

```json
{
  "id": "uuid",
  "name": "string",
  "email": "string",
  "phone": "string",
  "hourPrice": 100,
  "totalHoursCompleted": 120,
  "walletBalance": 3500
}
```

---

### ✅ Update Profile

**PUT** `/api/mobile/sheikh/profile`

**Body:**

```json
{
  "name": "string",
  "email": "string",
  "hourPrice": 120
}
```

---

### 📄 About App

**GET** `/api/mobile/sheikh/about`

---

### 🔒 Privacy Policy

**GET** `/api/mobile/sheikh/privacy-policy`

---

## 👨‍🎓 3) My Students

### ✅ Get My Students

**GET** `/api/mobile/sheikh/my-students`

Returns only students who **PAID** subscription with Sheikh.

**Response:**

```json
[
  {
    "studentId": "uuid",
    "studentName": "Ahmed",
    "subscription": {
      "packageName": "10 Sessions Package",
      "totalSessions": 10,
      "completedSessions": 4,
      "remainingSessions": 6,
      "startDate": "date",
      "endDate": "date"
    },
    "progressPercentage": 40
  }
]
```

---

### ✅ Student Details

**GET** `/api/mobile/sheikh/my-students/:studentId`

Returns: Student Info, Subscription Details, All Sessions, All Reports.

**Response:**

```json
{
  "student": {
    "id": "uuid",
    "name": "string"
  },
  "subscription": {},
  "sessions": [
    {
      "sessionId": "uuid",
      "date": "2026-03-02",
      "time": "10:00 PM",
      "status": "completed",
      "meetingLink": "zoom-link",
      "report": {
        "rating": 5,
        "notes": "Excellent performance"
      }
    }
  ]
}
```

---

## 📅 4) My Sessions

### ✅ Today's Sessions

**GET** `/api/mobile/sheikh/today-sessions`

Returns only **today's** sessions.

**Response:**

```json
[
  {
    "sessionId": "uuid",
    "studentName": "Ali",
    "time": "08:00 PM",
    "meetingLink": "zoom-link",
    "status": "scheduled"
  }
]
```

---

### ✅ All My Sessions

**GET** `/api/mobile/sheikh/my-sessions`

Returns all sessions.

---

## 📝 5) Create Session Report

### ✅ Add Report

**POST** `/api/mobile/sheikh/session/:sessionId/report`

**Body:**

```json
{
  "rating": 4,
  "notes": "Student improved tajweed"
}
```

Same behavior as Dashboard booking details page.

---

## 💰 6) Wallet

### ✅ Get Wallet Details

**GET** `/api/mobile/sheikh/wallet`

**Response:**

```json
{
  "hourPrice": 100,
  "totalCompletedHours": 35,
  "totalEarned": 3500,
  "availableBalance": 2000,
  "pendingWithdraw": 1000,
  "withdrawHistory": [
    {
      "amount": 500,
      "status": "approved",
      "date": "2026-02-10"
    }
  ]
}
```

---

### ✅ Request Withdraw

**POST** `/api/mobile/sheikh/wallet/withdraw`

**Body:**

```json
{
  "amount": 1000
}
```

**Conditions:**

- Amount ≤ availableBalance
- No pending request

---

## 🏗 Implementation Steps

### Step 1: Database Structure

**Required Tables:**

- `sheikhs`
- `students`
- `subscriptions`
- `sessions`
- `session_reports`
- `wallet_transactions`
- `withdraw_requests`

### Step 2: Auth Middleware

- JWT Authentication
- Role check → `role = SHEIKH`

### Step 3: Subscription Logic

- Only students with **PAID** subscription appear in My Students
- Calculate: `completedSessions`, `remainingSessions`, `progressPercentage`

### Step 4: Sessions Logic

- Filter by: `sheikhId`, today's date
- Join with student table

### Step 5: Wallet Logic

- When session becomes **completed**: Add hours to sheikh, Add amount = hourPrice, Update wallet balance

### Step 6: Withdraw Flow

1. Create withdraw request (pending)
2. Admin approves
3. Deduct from wallet
4. Add wallet transaction record

### Step 7: Delete Account Flow

- Soft delete Sheikh
- Cancel future sessions
- Disable login

---

## 🔥 Final Structure Summary

**Sheikh Mobile App Includes:**

| Category        | Endpoints                                                                 |
|----------------|---------------------------------------------------------------------------|
| **Auth**       | Register, Login, Logout, Delete Account                                  |
| **Profile**    | Profile, About, Privacy                                                  |
| **Students**   | My Students, Student Details                                             |
| **Sessions**   | Today's Sessions, All My Sessions, Session Reports                      |
| **Wallet**     | Wallet Details, Withdraw, Withdraw History                               |
