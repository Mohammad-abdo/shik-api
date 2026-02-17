# 📚 Course Enrollment & Progress API Documentation

## Overview
This API provides endpoints for:
- 🎓 Course enrollment (purchasing courses)
- 📖 Starting and completing lessons
- 📊 Tracking video progress
- 🏆 Course completion tracking

## Authentication
All endpoints require a valid JWT token in the `Authorization` header:
```
Authorization: Bearer <your-jwt-token>
```

---

## 🎓 Course Enrollment Endpoints

### 1. Enroll in Course (شراء الدورة)
**POST** `/api/v1/enrollments/:courseId/enroll`

#### Description
Enroll a student in a specific course with an optional sheikh selection.

#### Request Parameters
- `courseId` (string, required): The ID of the course to enroll in

#### Request Body
```json
{
  "sheikId": "optional-sheikh-id"
}
```

#### Success Response (201)
```json
{
  "success": true,
  "message": "Successfully enrolled in course",
  "data": {
    "id": "enrollment-id",
    "courseId": "course-id",
    "studentId": "student-id",
    "status": "ACTIVE",
    "enrolledAt": "2023-01-01T00:00:00.000Z",
    "progress": 0,
    "course": {
      "id": "course-id",
      "title": "Course Title",
      "titleAr": "عنوان الدورة",
      "description": "Course description...",
      "descriptionAr": "وصف الدورة...",
      "price": 100.00,
      "image": "https://example.com/image.jpg",
      "teacher": {
        "id": "teacher-id",
        "user": {
          "firstName": "Ahmed",
          "lastName": "Ali",
          "firstNameAr": "أحمد",
          "lastNameAr": "علي"
        }
      }
    }
  }
}
```

#### Error Responses
- `404`: Course not found
- `400`: Course not available for enrollment / Sheikh not associated with course / Already enrolled
- `500`: Internal server error

---

### 2. Get My Enrolled Courses
**GET** `/api/v1/enrollments/my-courses`

#### Query Parameters
- `page` (number, optional): Page number (default: 1)
- `limit` (number, optional): Items per page (default: 20)

#### Success Response (200)
```json
{
  "success": true,
  "message": "Student enrollments retrieved successfully",
  "data": {
    "enrollments": [
      {
        "id": "enrollment-id",
        "courseId": "course-id",
        "status": "ACTIVE",
        "enrolledAt": "2023-01-01T00:00:00.000Z",
        "progress": 45.5,
        "course": {
          "id": "course-id",
          "title": "Course Title",
          "titleAr": "عنوان الدورة",
          "totalLessons": 10,
          "teacher": {...}
        }
      }
    ],
    "pagination": {
      "current_page": 1,
      "per_page": 20,
      "total_enrollments": 5,
      "total_pages": 1
    }
  }
}
```

---

### 3. Check Enrollment Status
**GET** `/api/v1/enrollments/:courseId/status`

#### Success Response (200)
```json
{
  "success": true,
  "message": "Student is enrolled",
  "data": {
    "isEnrolled": true,
    "enrollment": {
      "id": "enrollment-id",
      "status": "ACTIVE",
      "progress": 75.0,
      "enrolledAt": "2023-01-01T00:00:00.000Z",
      "completedAt": null
    }
  }
}
```

---

## 📖 Lesson Progress Endpoints

### 4. Start Lesson (بدء الدرس)
**POST** `/api/v1/enrollments/lessons/:lessonId/start`

#### Description
Mark a lesson as started and begin tracking video progress.

#### Request Parameters
- `lessonId` (string, required): The ID of the lesson to start

#### Request Body
```json
{
  "videoId": "optional-specific-video-id"
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Lesson started successfully",
  "data": {
    "id": "progress-id",
    "userId": "user-id",
    "videoId": "video-id",
    "lessonId": "lesson-id",
    "courseId": "course-id",
    "status": "WATCHING",
    "watchProgress": 0,
    "watchDurationSeconds": 0,
    "startedAt": "2023-01-01T00:00:00.000Z",
    "lesson": {
      "id": "lesson-id",
      "title": "Lesson Title",
      "titleAr": "عنوان الدرس",
      "courseId": "course-id"
    },
    "video": {
      "id": "video-id",
      "title": "Video Title",
      "titleAr": "عنوان الفيديو",
      "videoUrl": "https://example.com/video.mp4",
      "thumbnailUrl": "https://example.com/thumb.jpg",
      "durationSeconds": 1800
    }
  }
}
```

#### Error Responses
- `404`: Lesson not found / Video not found
- `403`: Student not enrolled in course
- `500`: Internal server error

---

### 5. Complete Lesson (إنهاء الدرس)
**POST** `/api/v1/enrollments/lessons/:lessonId/complete`

#### Description
Mark a lesson as completed and update course progress.

#### Request Parameters
- `lessonId` (string, required): The ID of the lesson to complete

#### Request Body
```json
{
  "videoId": "optional-specific-video-id",
  "watchDurationSeconds": 1650
}
```

#### Success Response (200)
```json
{
  "success": true,
  "message": "Lesson completed successfully",
  "data": {
    "videoProgress": {
      "id": "progress-id",
      "status": "COMPLETED",
      "watchProgress": 100,
      "watchDurationSeconds": 1650,
      "completedAt": "2023-01-01T00:30:00.000Z"
    },
    "courseProgress": {
      "courseId": "course-id",
      "progress": 50.0,
      "status": "ACTIVE",
      "completedLessons": 5,
      "totalLessons": 10
    },
    "lesson": {
      "id": "lesson-id",
      "title": "Lesson Title",
      "titleAr": "عنوان الدرس",
      "courseId": "course-id"
    },
    "video": {
      "id": "video-id",
      "title": "Video Title",
      "titleAr": "عنوان الفيديو"
    }
  }
}
```

#### Error Responses
- `404`: Lesson not found / Video not found
- `403`: Student not enrolled in course
- `500`: Internal server error

---

### 6. Get Course Progress
**GET** `/api/v1/enrollments/:courseId/progress`

#### Description
Get detailed progress information for a student's enrollment in a course.

#### Success Response (200)
```json
{
  "success": true,
  "message": "Course progress retrieved successfully",
  "data": {
    "enrollment": {
      "id": "enrollment-id",
      "courseId": "course-id",
      "status": "ACTIVE",
      "progress": 75.0,
      "enrolledAt": "2023-01-01T00:00:00.000Z",
      "completedAt": null
    },
    "course": {
      "id": "course-id",
      "title": "Course Title",
      "titleAr": "عنوان الدورة"
    },
    "progressStats": {
      "completedLessons": 7,
      "totalLessons": 10,
      "completedVideos": 12,
      "totalVideos": 15,
      "totalWatchTimeSeconds": 18000,
      "progressPercentage": 75.0
    },
    "videoProgress": [
      {
        "id": "progress-id",
        "videoId": "video-id",
        "lessonId": "lesson-id",
        "status": "COMPLETED",
        "watchProgress": 100,
        "watchDurationSeconds": 1800,
        "startedAt": "2023-01-01T00:00:00.000Z",
        "completedAt": "2023-01-01T00:30:00.000Z",
        "video": {
          "id": "video-id",
          "title": "Video Title",
          "titleAr": "عنوان الفيديو"
        },
        "lesson": {
          "id": "lesson-id",
          "title": "Lesson Title",
          "titleAr": "عنوان الدرس"
        }
      }
    ]
  }
}
```

---

## 📝 Usage Examples

### Example 1: Purchase Course with Sheikh
```javascript
// Enroll in course with specific sheikh
const response = await fetch('/api/v1/enrollments/course-123/enroll', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    sheikId: 'sheikh-456'
  })
});

const enrollment = await response.json();
console.log('Enrolled:', enrollment.data);
```

### Example 2: Start Lesson
```javascript
// Start watching a lesson
const response = await fetch('/api/v1/enrollments/lessons/lesson-789/start', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    videoId: 'video-101' // optional
  })
});

const progress = await response.json();
console.log('Lesson started:', progress.data);
```

### Example 3: Complete Lesson
```javascript
// Complete lesson after watching
const response = await fetch('/api/v1/enrollments/lessons/lesson-789/complete', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${userToken}`
  },
  body: JSON.stringify({
    videoId: 'video-101',
    watchDurationSeconds: 1650
  })
});

const result = await response.json();
console.log('Lesson completed:', result.data);
console.log('Course progress:', result.data.courseProgress.progress + '%');
```

---

## 🚀 Testing with cURL

### Enroll in Course
```bash
curl -X POST http://localhost:8002/api/v1/enrollments/your-course-id/enroll \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"sheikId": "your-sheikh-id"}'
```

### Start Lesson
```bash
curl -X POST http://localhost:8002/api/v1/enrollments/lessons/your-lesson-id/start \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"videoId": "your-video-id"}'
```

### Complete Lesson
```bash
curl -X POST http://localhost:8002/api/v1/enrollments/lessons/your-lesson-id/complete \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer your-jwt-token" \
  -d '{"videoId": "your-video-id", "watchDurationSeconds": 1800}'
```

---

## 📊 Status Codes

| Code | Description |
|------|-------------|
| 200  | OK - Request successful |
| 201  | Created - Enrollment created |
| 400  | Bad Request - Invalid data or business logic error |
| 401  | Unauthorized - Invalid or missing token |
| 403  | Forbidden - Not enrolled or access denied |
| 404  | Not Found - Resource not found |
| 500  | Internal Server Error |

---

## 🔄 Progress Tracking Flow

1. **Student enrolls in course** → `POST /enrollments/:courseId/enroll`
2. **Student starts lesson** → `POST /enrollments/lessons/:lessonId/start`
3. **Student watches video** (tracked by frontend)
4. **Student completes lesson** → `POST /enrollments/lessons/:lessonId/complete`
5. **System updates course progress automatically**
6. **View progress anytime** → `GET /enrollments/:courseId/progress`

---

## 🎯 Key Features

- ✅ **Course Purchase**: Complete enrollment with sheikh selection
- ✅ **Progress Tracking**: Automatic course completion calculation  
- ✅ **Video Analytics**: Track watch time and completion
- ✅ **Multi-Video Lessons**: Support lessons with multiple videos
- ✅ **Sheikh Association**: Link specific teachers to lessons
- ✅ **Real-time Updates**: Instant progress updates
- ✅ **Comprehensive Stats**: Detailed learning analytics