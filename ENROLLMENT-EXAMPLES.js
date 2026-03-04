/**
 * 🎯 Course Enrollment & Progress API - Usage Examples
 * 
 * هذا الملف يحتوي على أمثلة للاستخدام للـ API endpoints الجديدة
 * 
 * تأكد من وجود JWT token صحيح قبل استخدام هذه الأمثلة
 */

const API_BASE_URL = 'http://localhost:8002/api/v1';

// Replace with actual JWT token
const JWT_TOKEN = 'your-jwt-token-here';

// Common headers
const headers = {
  'Content-Type': 'application/json',
  'Authorization': `Bearer ${JWT_TOKEN}`
};

// ============================================================================
// 1. شراء الدورة (Course Purchase)
// ============================================================================

async function purchaseCourse(courseId, sheikId = null) {
  try {
    const body = sheikId ? { sheikId } : {};
    
    const response = await fetch(`${API_BASE_URL}/enrollments/${courseId}/enroll`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ تم شراء الدورة بنجاح:', result.data);
      return result.data;
    } else {
      console.error('❌ فشل شراء الدورة:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في شراء الدورة:', error);
    return null;
  }
}

// مثال للاستخدام
// purchaseCourse('course-123', 'sheikh-456');

// ============================================================================
// 2. بدء الدرس (Start Lesson)
// ============================================================================

async function startLesson(lessonId, videoId = null) {
  try {
    const body = videoId ? { videoId } : {};
    
    const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${lessonId}/start`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('▶️ تم بدء الدرس:', result.data);
      return result.data;
    } else {
      console.error('❌ فشل بدء الدرس:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في بدء الدرس:', error);
    return null;
  }
}

// مثال للاستخدام
// startLesson('lesson-789', 'video-101');

// ============================================================================
// 3. إنهاء الدرس (Complete Lesson) 
// ============================================================================

async function completeLesson(lessonId, videoId = null, watchDurationSeconds = 0) {
  try {
    const body = {
      ...(videoId && { videoId }),
      ...(watchDurationSeconds && { watchDurationSeconds })
    };
    
    const response = await fetch(`${API_BASE_URL}/enrollments/lessons/${lessonId}/complete`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body)
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('✅ تم إنهاء الدرس:', result.data);
      console.log('📊 تقدم الدورة:', `${result.data.courseProgress.progress}%`);
      return result.data;
    } else {
      console.error('❌ فشل إنهاء الدرس:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في إنهاء الدرس:', error);
    return null;
  }
}

// مثال للاستخدام
// completeLesson('lesson-789', 'video-101', 1800);

// ============================================================================
// 4. فحص حالة التسجيل (Check Enrollment Status)
// ============================================================================

async function checkEnrollmentStatus(courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/${courseId}/status`, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    
    if (result.success) {
      if (result.data.isEnrolled) {
        console.log('✅ مُسجل في الدورة:', result.data.enrollment);
      } else {
        console.log('❌ غير مُسجل في الدورة');
      }
      return result.data;
    } else {
      console.error('❌ فشل فحص التسجيل:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في فحص التسجيل:', error);
    return null;
  }
}

// مثال للاستخدام
// checkEnrollmentStatus('course-123');

// ============================================================================
// 5. الحصول على الدورات المُسجل بها (Get My Courses)
// ============================================================================

async function getMyCourses(page = 1, limit = 20) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/my-courses?page=${page}&limit=${limit}`, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📚 دوراتي:', result.data.enrollments);
      console.log('📄 معلومات الصفحات:', result.data.pagination);
      return result.data;
    } else {
      console.error('❌ فشل الحصول على الدورات:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في الحصول على الدورات:', error);
    return null;
  }
}

// مثال للاستخدام
// getMyCourses(1, 10);

// ============================================================================
// 6. الحصول على تقدم الدورة (Get Course Progress)
// ============================================================================

async function getCourseProgress(courseId) {
  try {
    const response = await fetch(`${API_BASE_URL}/enrollments/${courseId}/progress`, {
      method: 'GET',
      headers
    });
    
    const result = await response.json();
    
    if (result.success) {
      console.log('📊 تقدم الدورة:', result.data);
      console.log(`📈 النسبة المئوية: ${result.data.progressStats.progressPercentage}%`);
      console.log(`✅ دروس مكتملة: ${result.data.progressStats.completedLessons}/${result.data.progressStats.totalLessons}`);
      return result.data;
    } else {
      console.error('❌ فشل الحصول على التقدم:', result.message);
      return null;
    }
  } catch (error) {
    console.error('❌ خطأ في الحصول على التقدم:', error);
    return null;
  }
}

// مثال للاستخدام
// getCourseProgress('course-123');

// ============================================================================
// 🎯 سيناريو كامل لاستخدام الـ API
// ============================================================================

async function fullLearningScenario() {
  console.log('🎓 بدء سيناريو التعلم الكامل...\n');
  
  const courseId = 'course-123';
  const sheikId = 'sheikh-456';
  const lessonId = 'lesson-789';
  const videoId = 'video-101';
  
  // 1. شراء الدورة
  console.log('1️⃣ شراء الدورة...');
  const enrollment = await purchaseCourse(courseId, sheikId);
  if (!enrollment) return;
  
  // 2. فحص حالة التسجيل
  console.log('\n2️⃣ فحص حالة التسجيل...');
  await checkEnrollmentStatus(courseId);
  
  // 3. بدء الدرس الأول
  console.log('\n3️⃣ بدء الدرس الأول...');
  const lessonStart = await startLesson(lessonId, videoId);
  if (!lessonStart) return;
  
  // 4. محاكاة مشاهدة الفيديو لمدة 30 دقيقة
  console.log('\n4️⃣ محاكاة المشاهدة...');
  console.log('⏱️ مشاهدة الفيديو لمدة 30 دقيقة...');
  
  // 5. إنهاء الدرس
  console.log('\n5️⃣ إنهاء الدرس...');
  const lessonComplete = await completeLesson(lessonId, videoId, 1800); // 30 دقيقة
  if (!lessonComplete) return;
  
  // 6. مشاهدة التقدم
  console.log('\n6️⃣ مشاهدة تقدم الدورة...');
  await getCourseProgress(courseId);
  
  // 7. مشاهدة جميع الدورات
  console.log('\n7️⃣ مشاهدة جميع دوراتي...');
  await getMyCourses();
  
  console.log('\n🎉 انتهى السيناريو بنجاح!');
}

// تشغيل السيناريو الكامل
// fullLearningScenario();

// ============================================================================
// 📝 معلومات إضافية
// ============================================================================

console.log(`
🎯 استخدام الـ API:

1. قم بتغيير JWT_TOKEN إلى token صحيح
2. تأكد من تشغيل الباك إند على localhost:8002
3. استخدم الدوال أعلاه في الكود الخاص بك
4. اتبع التوثيق في ENROLLMENT-API-DOCS.md

📚 الـ Endpoints المتاحة:
- POST /api/v1/enrollments/:courseId/enroll
- GET  /api/v1/enrollments/my-courses
- GET  /api/v1/enrollments/:courseId/status
- POST /api/v1/enrollments/lessons/:lessonId/start
- POST /api/v1/enrollments/lessons/:lessonId/complete
- GET  /api/v1/enrollments/:courseId/progress

🔐 جميع الـ endpoints تتطلب JWT token في Authorization header
`);

// Export functions for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    purchaseCourse,
    startLesson,
    completeLesson,
    checkEnrollmentStatus,
    getMyCourses,
    getCourseProgress,
    fullLearningScenario
  };
}