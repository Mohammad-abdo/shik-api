# إعداد قاعدة البيانات - Database Setup Guide

## المشكلة الحالية
```
Can't reach database server at `localhost:3306`
```

## الحل خطوة بخطوة:

### 1. تشغيل MySQL Server

#### إذا كنت تستخدم XAMPP:
1. افتح **XAMPP Control Panel**
2. اضغط على **Start** بجانب **MySQL**
3. تأكد أن البورت **3306** شغال (يظهر باللون الأخضر)

#### إذا كنت تستخدم MySQL مباشرة:
```bash
# Windows (إذا كان MySQL مثبت كخدمة)
net start MySQL

# أو شغّل MySQL من Command Prompt
mysqld
```

### 2. التحقق من الاتصال
```bash
# من PowerShell
mysql -u root -h localhost -P 3306
```

### 3. إنشاء قاعدة البيانات (إذا لم تكن موجودة)
```sql
CREATE DATABASE IF NOT EXISTS Shaykhi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE Shaykhi;
```

### 4. تشغيل Migrations
```bash
cd backend
npx prisma migrate dev
# أو إذا كانت المايجريشن موجودة بالفعل:
npx prisma migrate deploy
```

### 5. تشغيل Seed لإضافة البيانات
```bash
cd backend
npx prisma db seed
```

### 6. إعادة تشغيل السيرفر
```bash
npm run start:dev
```

## التحقق من نجاح الاتصال

بعد تشغيل السيرفر، يجب أن ترى:
```
✅ Database connected successfully
```

بدلاً من:
```
❌ Failed to connect to database
```

## حلول للمشاكل الشائعة:

### المشكلة: MySQL لا يبدأ
- تأكد أن البورت 3306 غير مستخدم من برنامج آخر
- تحقق من ملف `my.ini` أو `my.cnf`
- أعد تشغيل XAMPP كـ Administrator

### المشكلة: كلمة مرور MySQL
إذا كان MySQL يحتاج كلمة مرور، عدّل `.env`:
```env
DATABASE_URL="mysql://root:YOUR_PASSWORD@localhost:3306/Shaykhi"
```

### المشكلة: قاعدة البيانات غير موجودة
شغّل:
```bash
npx prisma migrate dev --name init
```

## بعد إصلاح الاتصال:

1. ✅ قاعدة البيانات متصلة
2. ✅ البيانات موجودة (من seed)
3. ✅ الـ API يعمل بشكل صحيح
4. ✅ لا توجد أخطاء `User not found` أو `Teacher not found`
