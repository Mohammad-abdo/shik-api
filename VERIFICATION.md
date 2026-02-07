# تقرير التحقق من تطابق backend-js مع الـ backend الأصلي (NestJS)

## نظرة عامة
- **الأصلي:** `backend/` — NestJS، TypeScript، Prisma، MySQL
- **النسخة:** `backend-js/` — Node.js (JS)، Express، Prisma، MySQL (نفس الـ schema)

---

## الوحدات والمسارات المطابقة

### Auth (`/api/auth`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST signup | ✅ POST /auth/signup | |
| POST login | ✅ POST /auth/login | يدعم web + mobile (user_type) |
| POST verify-email | ✅ POST /auth/verify-email | |
| POST verify-phone | ✅ POST /auth/verify-phone | |
| POST refresh | ✅ POST /auth/refresh | |
| POST login-multi | ✅ POST /auth/login-multi | |
| POST send-login-otp | ✅ POST /auth/send-login-otp | |
| POST forgot-password | ✅ POST /auth/forgot-password | |
| POST reset-password | ✅ POST /auth/reset-password | |
| POST resend-otp | ✅ POST /auth/resend-otp | |
| GET me | ✅ GET /auth/me | |
| POST register (mobile) | ✅ POST /auth/register | مع profile_image |

### Users (`/api/users`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET me | ✅ GET /users/me | |
| PUT me | ✅ PUT /users/me | |
| PUT me/password | ✅ PUT /users/me/password | |
| DELETE me | ✅ DELETE /users/me | |

### User Mobile (`/api/user` = mobile profile)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET / (profile) | ✅ GET /user | |

### Bookings (`/api/bookings`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST / | ✅ POST /bookings | |
| GET my-bookings | ✅ GET /bookings/my-bookings | |
| GET :id | ✅ GET /bookings/:id | |
| POST :id/confirm | ✅ POST /bookings/:id/confirm | |
| POST :id/cancel | ✅ POST /bookings/:id/cancel | |
| (mobile POST) | نفس POST /bookings | |

### Teachers (`/api/teachers`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET / | ✅ GET /teachers | |
| GET :id | ✅ GET /teachers/:id | |
| GET :id/courses (sheikhs) | ✅ GET /teachers/:id/courses | |
| POST / | ✅ POST /teachers | |
| PUT :id | ✅ PUT /teachers/:id | |
| POST :id/schedules | ✅ POST /teachers/:id/schedules | |
| PUT :teacherId/schedules/:scheduleId | ✅ PUT /teachers/:teacherId/schedules/:scheduleId | |
| DELETE :teacherId/schedules/:scheduleId | ✅ DELETE /teachers/:teacherId/schedules/:scheduleId | |
| POST :id/approve | ✅ POST /teachers/:id/approve | |
| DELETE :id/reject | ✅ DELETE /teachers/:id/reject | |

### Admin (`/api/admin`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET dashboard | ✅ GET /admin/dashboard | |
| GET users | ✅ GET /admin/users | |
| GET users/:id | ✅ GET /admin/users/:id | |
| POST users | ✅ POST /admin/users | |
| PUT users/:id | ✅ PUT /admin/users/:id | |
| PUT users/:id/status | ✅ PUT /admin/users/:id/status | |
| POST users/:id/ban | ✅ POST /admin/users/:id/ban | |
| POST users/:id/activate | ✅ POST /admin/users/:id/activate | |
| DELETE users/:id | ✅ DELETE /admin/users/:id | |
| GET teachers | ✅ GET /admin/teachers | |
| GET teachers/:id | ✅ GET /admin/teachers/:id | |
| POST teachers | ✅ POST /admin/teachers | |
| PUT teachers/:id | ✅ PUT /admin/teachers/:id | |
| GET bookings | ✅ GET /admin/bookings | |
| GET bookings/export | ✅ GET /admin/bookings/export | CSV |
| POST bookings/:id/force-cancel | ✅ POST /admin/bookings/:id/force-cancel | |
| POST bookings/:id/force-confirm | ✅ POST /admin/bookings/:id/force-confirm | |
| GET payments | ✅ GET /admin/payments | |
| GET payments/stats | ✅ GET /admin/payments/stats | |
| POST notifications/global | ✅ POST /admin/notifications/global | |
| POST notifications/users | ✅ POST /admin/notifications/users | إرسال لمستخدمين محددين |
| GET reports/principal | ✅ GET /admin/reports/principal | startDate, endDate |
| GET reports/teachers | ✅ GET /admin/reports/teachers | startDate, endDate, teacherId |
| GET reports/students | ✅ GET /admin/reports/students | startDate, endDate, studentId |
| GET reports/profits | ✅ GET /admin/reports/profits | startDate, endDate |
| GET reports/daily | ✅ GET /admin/reports/daily | date |
| GET reports/monthly | ✅ GET /admin/reports/monthly | year, month |
| GET reports/trends | ✅ GET /admin/reports/trends | startDate, endDate |
| GET wallets | ✅ GET /admin/wallets | page, limit, search |
| POST wallets/sync-payments | ✅ POST /admin/wallets/sync-payments | |
| GET wallets/:id | ✅ GET /admin/wallets/:id | wallet id or teacher id |
| POST wallets/:id/send-money | ✅ POST /admin/wallets/:id/send-money | amount, paymentMethod, description |
| POST wallets/create/:teacherId | ✅ POST /admin/wallets/create/:teacherId | |
| PUT wallets/:id/disable | ✅ PUT /admin/wallets/:id/disable | |
| PUT wallets/:id/enable | ✅ PUT /admin/wallets/:id/enable | |
| GET subscriptions | ✅ GET /admin/subscriptions | page, limit, status |
| GET student-wallets | ✅ GET /admin/student-wallets | page, limit, search |
| GET student-wallets/:studentId | ✅ GET /admin/student-wallets/:studentId | |
| POST student-wallets/deposit | ✅ POST /admin/student-wallets/deposit | studentId, amount, description, paymentMethod |
| POST student-wallets/withdraw | ✅ POST /admin/student-wallets/withdraw | studentId, amount, description |
| POST student-wallets/process-payment | ✅ POST /admin/student-wallets/process-payment | studentId, amount, paymentType, relatedId, description |
| GET student-wallets/:walletId/transactions | ✅ GET /admin/student-wallets/:walletId/transactions | page, limit |

### Payments (`/api/payments`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST bookings/:bookingId/intent | ✅ POST /payments/bookings/:bookingId/intent | |
| GET bookings/:bookingId | ✅ GET /payments/bookings/:bookingId | |
| POST bookings/:bookingId/refund | ✅ POST /payments/bookings/:bookingId/refund | |
| POST webhook | ✅ POST /payments/webhook | Stripe، rawBody |

### Files (`/api/files`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST upload | ✅ POST /files/upload | |
| POST upload/avatar | ✅ POST /files/upload/avatar | |
| POST upload/video | ✅ POST /files/upload/video | |
| POST upload/image | ✅ POST /files/upload/image | |

### Notifications (`/api/notifications`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET / | ✅ GET /notifications | |
| PUT :id/read | ✅ PUT /notifications/:id/read | |
| PUT read-all | ✅ PUT /notifications/read-all | |
| POST send | ✅ POST /notifications/send | |
| POST broadcast | ✅ POST /notifications/broadcast | |

### Reviews (`/api/reviews`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST bookings/:bookingId | ✅ POST /reviews/bookings/:bookingId | |
| GET teachers/:teacherId | ✅ GET /reviews/teachers/:teacherId | |
| PUT bookings/:bookingId | ✅ PUT /reviews/bookings/:bookingId | |
| DELETE bookings/:bookingId | ✅ DELETE /reviews/bookings/:bookingId | |

### Sessions (`/api/sessions`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST bookings/:bookingId | ✅ POST /sessions/bookings/:bookingId | |
| GET bookings/:bookingId | ✅ GET /sessions/bookings/:bookingId | |
| POST bookings/:bookingId/start | ✅ POST /sessions/bookings/:bookingId/start | |
| POST bookings/:bookingId/end | ✅ POST /sessions/bookings/:bookingId/end | |

### Courses (`/api/courses`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST / | ✅ POST /courses | |
| GET / | ✅ GET /courses | |
| GET featured | ✅ GET /courses/featured | |
| GET :id/sheikhs | ✅ GET /courses/:id/sheikhs | |
| GET :id/lessons | ✅ GET /courses/:id/lessons | OptionalJwt |
| GET :id | ✅ GET /courses/:id | |
| PUT :id | ✅ PUT /courses/:id | |
| DELETE :id | ✅ DELETE /courses/:id | |
| POST :id/enroll | ✅ POST /courses/:id/enroll | |
| POST teacher/create | ✅ POST /courses/teacher/create | |

### Lessons (`/api/lessons`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET :lessonId/play | ✅ GET /lessons/:lessonId/play | |

### Exams (`/api/exams`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST / | ✅ POST /exams | |
| POST :id/questions | ✅ POST /exams/:id/questions | |
| POST :id/publish | ✅ POST /exams/:id/publish | |
| DELETE :id | ✅ DELETE /exams/:id | |
| GET :id | ✅ GET /exams/:id | |
| POST :id/submit | ✅ POST /exams/:id/submit | |
| GET :id/results | ✅ GET /exams/:id/results | |
| PUT :examId/submissions/:submissionId/grade | ✅ PUT /exams/:examId/submissions/:submissionId/grade | |
| GET student/my-exams | ✅ GET /exams/student/my-exams | |
| GET teacher/my-exams | ✅ GET /exams/teacher/my-exams | |

### Subscriptions (`/api/subscriptions`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST packages | ✅ POST /subscriptions/packages | |
| GET packages | ✅ GET /subscriptions/packages | |
| GET packages/:id | ✅ GET /subscriptions/packages/:id | |
| PUT packages/:id | ✅ PUT /subscriptions/packages/:id | |
| DELETE packages/:id | ✅ DELETE /subscriptions/packages/:id | |
| POST subscribe | ✅ POST /subscriptions/subscribe | |
| GET my-subscriptions | ✅ GET /subscriptions/my-subscriptions | |
| GET my-active | ✅ GET /subscriptions/my-active | |
| POST cancel/:id | ✅ POST /subscriptions/cancel/:id | |
| GET admin/all | ✅ GET /subscriptions/admin/all | |

### Student-Subscriptions (`/api/student-subscriptions`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST packages | ✅ POST /student-subscriptions/packages | |
| GET packages | ✅ GET /student-subscriptions/packages | |
| GET packages/:id | ✅ GET /student-subscriptions/packages/:id | |
| PUT packages/:id | ✅ PUT /student-subscriptions/packages/:id | |
| DELETE packages/:id | ✅ DELETE /student-subscriptions/packages/:id | |
| POST subscribe | ✅ POST /student-subscriptions/subscribe | |
| GET my-subscriptions | ✅ GET /student-subscriptions/my-subscriptions | |
| GET my-active | ✅ GET /student-subscriptions/my-active | |
| POST cancel/:id | ✅ POST /student-subscriptions/cancel/:id | |
| GET admin/all | ✅ GET /student-subscriptions/admin/all | |

### Content (`/api/content`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET / | ✅ GET /content | |
| POST / | ✅ POST /content | مع file |
| GET pending | ✅ GET /content/pending | |
| GET my-content | ✅ GET /content/my-content | |
| GET :id | ✅ GET /content/:id | |
| POST :id/approve | ✅ POST /content/:id/approve | |
| POST :id/reject | ✅ POST /content/:id/reject | |
| DELETE :id | ✅ DELETE /content/:id | |

### Certificates (`/api/certificates`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST / | ✅ POST /certificates | |
| GET student/:studentId | ✅ GET /certificates/student/:studentId | |
| GET teacher/my-certificates | ✅ GET /certificates/teacher/my-certificates | |
| DELETE :id/revoke | ✅ DELETE /certificates/:id/revoke | |

### Finance (`/api/finance`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET statistics | ✅ GET /finance/statistics | |
| GET payouts | ✅ GET /finance/payouts | |
| POST payouts/:id/approve | ✅ POST /finance/payouts/:id/approve | |
| POST payouts/:id/reject | ✅ POST /finance/payouts/:id/reject | |
| POST payouts/:id/complete | ✅ POST /finance/payouts/:id/complete | |
| GET wallet | ✅ GET /finance/wallet | |
| GET wallet/transactions | ✅ GET /finance/wallet/transactions | |
| POST wallet/payout-request | ✅ POST /finance/wallet/payout-request | |

### RBAC (`/api/rbac`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST roles | ✅ POST /rbac/roles | |
| GET roles | ✅ GET /rbac/roles | |
| GET roles/:id | ✅ GET /rbac/roles/:id | |
| PUT roles/:id | ✅ PUT /rbac/roles/:id | |
| DELETE roles/:id | ✅ DELETE /rbac/roles/:id | |
| POST roles/assign | ✅ POST /rbac/roles/assign | |
| DELETE users/:userId/roles/:roleId | ✅ DELETE /rbac/users/:userId/roles/:roleId | |
| GET users/:userId/roles | ✅ GET /rbac/users/:userId/roles | |
| GET users/:userId/permissions | ✅ GET /rbac/users/:userId/permissions | |
| POST permissions | ✅ POST /rbac/permissions | |
| GET permissions | ✅ GET /rbac/permissions | |
| PUT permissions/:id | ✅ PUT /rbac/permissions/:id | |
| DELETE permissions/:id | ✅ DELETE /rbac/permissions/:id | |
| POST permissions/assign | ✅ POST /rbac/permissions/assign | |
| DELETE roles/:roleId/permissions/:permissionId | ✅ DELETE /rbac/roles/:roleId/permissions/:permissionId | |

### Audit (`/api/audit`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET logs | ✅ GET /audit/logs | |

### Video (`/api/video`)
| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| POST session/create | ✅ POST /video/session/create | |
| GET session/token/:bookingId | ✅ GET /video/session/token/:bookingId | |
| POST session/end | ✅ POST /video/session/end | |
| GET session/history | ✅ GET /video/session/history | |
| GET videos/:video_id/access | ✅ GET /video/videos/:video_id/access | |
| POST videos/:video_id/start | ✅ POST /video/videos/:video_id/start | |
| POST videos/:video_id/complete | ✅ POST /video/videos/:video_id/complete | |
| GET courses/:course_id/progress | ✅ GET /video/courses/:course_id/progress | |

---

## مسارات الموبايل للدورات (متوافقة مع الأصل)

| الأصلي | backend-js | ملاحظات |
|--------|------------|---------|
| GET courses/mobile/:id | ✅ GET /api/courses/mobile/:id | jwtAuth |
| GET courses/mobile/:id/sheikhs | ✅ GET /api/courses/mobile/:id/sheikhs | |
| GET courses/mobile/:id/lessons | ✅ GET /api/courses/mobile/:id/lessons | jwtAuth |

---

## الخلاصة

- **مطابق ومنسوخ:** كل مسارات التطبيق الأساسي وجميع مسارات الأدمن (dashboard، users، teachers، bookings، payments، payments/stats، bookings/export، reports/*، notifications/global و notifications/users، CRUD users/teachers، force-cancel/confirm، wallets/*، student-wallets/*، subscriptions)، بالإضافة إلى مسارات الموبايل للدورات (courses/mobile/:id، sheikhs، lessons).
- **backend-js** يضم الآن نفس واجهات الـ API الموجودة في الـ backend الأصلي (NestJS) مع سلوك مكافئ.
