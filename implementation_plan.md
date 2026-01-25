# Implementation Plan - Sheikhy App API for Mobile

This plan outlines the steps to implement the API endpoints requested in the Sheikhy App documentation, including authentication, courses, sheikhs, and video progress tracking.

## Phase 1: Database Schema Updates

We need to update `prisma/schema.prisma` to include missing fields and models required by the mobile app.

### 1.1 Update `User` Model
- Add `age` (Int)
- Add `gender` (Enum: `MALE`, `FEMALE`)
- Add `memorized_parts` (Int)
- Add `student_phone` (String)
- Add `parent_phone` (String)
- Map `avatar` to be used as `profile_image_url`

### 1.2 Update `Course` Model
- Add `category` (String)
- Add `level` (Enum: `BEGINNER`, `INTERMEDIATE`, `ADVANCED`)
- Add `full_description` (String)
- Add `intro_video_url` (String)
- Add `intro_video_thumbnail` (String)
- Add `is_featured` (Boolean)
- Add `total_lessons` (Int)
- Add `total_videos` (Int)

### 1.3 Add `Lesson` Model
- `id`, `course_id`, `title`, `description`, `order_number`, `duration_minutes`, `is_free`

### 1.4 Add `Video` Model
- `id`, `lesson_id`, `title`, `description`, `video_url`, `thumbnail_url`, `duration_seconds`, `order_number`

### 1.5 Add `VideoProgress` Model
- `id`, `user_id`, `video_id`, `lesson_id`, `course_id`, `status` (`WATCHING`, `COMPLETED`), `watch_progress`, `watch_duration_seconds`, `started_at`, `completed_at`

## Phase 2: Authentication Endpoints

Implement/Update the following in `src/auth`:
- **POST /api/auth/register**: Support new fields and multipart/form-data for profile image.
- **POST /api/auth/login**: Add `user_type` validation.
- **GET /api/user**: Return complete profile data in the specified format.
- **POST /api/auth/forgot-password**: Implement OTP request using internal phone verification.
- **POST /api/auth/reset-password**: Verify OTP and update password.

## Phase 3: Courses & Sheikhs Endpoints

Implement the following in `src/course` and `src/teacher`:
- **GET /api/courses/featured**: List featured courses.
- **GET /api/courses/{course_id}**: Detailed course info.
- **GET /api/courses/{course_id}/sheikhs**: List of sheikhs for a course.
- **GET /api/sheikhs/{sheikh_id}**: Sheikh details.
- **GET /api/sheikhs/{sheikh_id}/courses**: Courses taught by a sheikh.
- **GET /api/courses/{course_id}/lessons**: Full curriculum with videos.
- **POST /api/bookings**: Book a session with a sheikh.

## Phase 4: Video Progress Tracking

Implement a new `src/video` module:
- **POST /api/videos/{video_id}/start**: Initialize tracking.
- **POST /api/videos/{video_id}/complete**: Mark as finished.
- **GET /api/courses/{course_id}/progress**: Overview of user's progress.

## Phase 5: Standardization & Testing
- Standardize all API responses to `{ success: true, message: "...", data: { ... } }`.
- Ensure Arabic messages are used as requested.
- Verify with Postman or unit tests.
