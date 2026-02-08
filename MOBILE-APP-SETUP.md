# 📱 إعداد الخادم للتطبيق الموبايل

## ✅ التحديثات المطبقة

### 1. **CORS للتطبيقات الموبايل**
```javascript
// Allowed origins including mobile apps
const allowedOrigins = [
  // Mobile App Origins
  'capacitor://localhost',
  'ionic://localhost', 
  'http://localhost',
  'https://localhost',
  
  // React Native / Expo
  'exp://127.0.0.1',
  'exp://localhost',
  
  // Cordova/PhoneGap
  'file://',
  'cdvfile://',
  
  // For mobile apps without origin
  null,
  undefined
];
```

### 2. **Keep-Alive لمنع توقف الخادم**
- ✅ إضافة `keepAliveMiddleware` لإبقاء الاتصالات نشطة
- ✅ تكوين timeouts مناسبة للتطبيقات الموبايل
- ✅ معالجة أخطاء الاتصال بدون إيقاف الخادم

### 3. **تحديث البورت إلى 8002**
```javascript
const PORT = process.env.PORT || 8002;
```

### 4. **Health Check للتطبيق الموبايل**
```
GET http://localhost:8002/api/mobile/health
```

---

## 🔧 إعدادات الخادم الآمنة

### 1. **منع Crashes**
```javascript
// Don't crash for mobile connection errors
process.on('uncaughtException', (err) => {
  console.error('⚠️  Uncaught Exception (keeping server alive):', err.message);
  
  // Continue for mobile app stability
  if (err.code === 'ECONNRESET' || err.code === 'EPIPE') {
    return; // Don't crash
  }
});
```

### 2. **Server Configuration**
```javascript
server.keepAliveTimeout = 30000; // 30 seconds
server.headersTimeout = 35000;   // 35 seconds
server.maxConnections = 1000;
```

### 3. **Graceful Shutdown**
```javascript
// Handle SIGTERM, SIGINT for graceful shutdown
setupGracefulShutdown(server);
```

---

## 📱 لاختبار التطبيق الموبايل

### 1. **Health Check**
```bash
curl http://localhost:8002/api/mobile/health
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Mobile server is running",
  "timestamp": "2023-...",
  "uptime": 123.456,
  "server": {
    "port": 8002,
    "keepAlive": true
  },
  "mobile": {
    "platform": "unknown",
    "appVersion": "unknown"
  }
}
```

### 2. **CORS Test (No Origin)**
```bash
curl -X OPTIONS http://localhost:8002/api/auth/me \
  -H "Content-Type: application/json" \
  -H "X-Platform: mobile" \
  -v
```

**Expected Headers:**
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Credentials: true
Access-Control-Allow-Methods: GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD
```

### 3. **Authentication Test**
```bash
curl http://localhost:8002/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "X-Platform: mobile" \
  -H "X-App-Version: 1.0.0"
```

---

## 🚀 تشغيل الخادم

### 1. **Development Mode**
```bash
cd backend-js
npm install
npm run dev
# أو
node app.js
```

### 2. **Production Mode**
```bash
cd backend-js
NODE_ENV=production PORT=8002 node app.js
```

### 3. **مع PM2 (موصى للإنتاج)**
```bash
npm install -g pm2
pm2 start app.js --name "tartel-mobile-api" -- --port 8002
pm2 save
pm2 startup
```

---

## 📊 مراقبة الخادم

### 1. **Server Status**
```bash
# Check if server is running
curl -s http://localhost:8002/api/mobile/health | jq '.uptime'

# Check memory usage
curl -s http://localhost:8002/api/mobile/health | jq '.memory'
```

### 2. **Process Monitoring**
```bash
# Check port usage
lsof -ti:8002

# Check process
ps aux | grep node
```

### 3. **Logs**
```bash
# PM2 logs
pm2 logs tartel-mobile-api

# Direct logs
tail -f /path/to/your/app.log
```

---

## 🔍 استكشاف الأخطاء

### مشكلة: الخادم يتوقف
**الحل:**
- ✅ تأكد من تطبيق keep-alive middleware
- ✅ تحقق من error handlers
- ✅ استخدم PM2 لإعادة التشغيل التلقائي

### مشكلة: CORS للتطبيق الموبايل
**الحل:**
```javascript
// تأكد من السماح بـ null origins
if (!origin || origin === 'null') {
  res.header('Access-Control-Allow-Origin', '*');
}
```

### مشكلة: البورت مستخدم
```bash
# Kill process on port 8002
lsof -ti:8002 | xargs kill -9

# أو استخدم بورت آخر
PORT=8003 node app.js
```

---

## 🎯 الملفات المحدثة

### ✅ الملفات الأساسية
- `app.js` - البورت 8002 + Keep-alive + Mobile endpoints
- `middleware/corsHandler.js` - CORS للموبايل  
- `middleware/keepAlive.js` - Keep-alive و server config
- `middleware/auth.js` - Authentication middleware

### ✅ أدوات الاختبار
- `test-cors.js` - اختبار CORS للموبايل
- `test-cors.html` - اختبار من المتصفح
- `MOBILE-APP-SETUP.md` - هذا الدليل

---

## 📞 الدعم

### إذا واجهت مشاكل:

1. **تحقق من الصحة:**
   ```bash
   curl http://localhost:8002/api/mobile/health
   ```

2. **اختبر CORS:**
   ```bash
   node test-cors.js
   ```

3. **تحقق من Logs:**
   ```bash
   tail -f app.log
   ```

4. **إعادة تشغيل:**
   ```bash
   pm2 restart tartel-mobile-api
   ```

---

## 🎉 النتيجة

✅ **الخادم الآن جاهز للتطبيق الموبايل:**
- يعمل على البورت 8002
- لا يتوقف عند أخطاء الاتصال
- يدعم CORS للتطبيقات الموبايل
- لديه health checks مخصصة
- Keep-alive مفعل لإبقاء الاتصالات نشطة

**استمتع بتطبيقك الموبايل!** 📱✨