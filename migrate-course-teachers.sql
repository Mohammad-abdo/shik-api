-- Simple migration to create course_teachers table
-- Run this in MySQL Workbench or phpMyAdmin

USE Shaykhi;

-- Create course_teachers table if it doesn't exist
CREATE TABLE IF NOT EXISTS `course_teachers` (
  `id` VARCHAR(191) NOT NULL,
  `courseId` VARCHAR(191) NOT NULL,
  `teacherId` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE KEY `course_teachers_courseId_teacherId_key` (`courseId`, `teacherId`),
  KEY `course_teachers_courseId_idx` (`courseId`),
  KEY `course_teachers_teacherId_idx` (`teacherId`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Add foreign key constraints
-- First check if they exist, drop and recreate if needed
ALTER TABLE `course_teachers` 
  DROP FOREIGN KEY IF EXISTS `course_teachers_courseId_fkey`,
  DROP FOREIGN KEY IF EXISTS `course_teachers_teacherId_fkey`;

ALTER TABLE `course_teachers`
  ADD CONSTRAINT `course_teachers_courseId_fkey` 
    FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT `course_teachers_teacherId_fkey` 
    FOREIGN KEY (`teacherId`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE;

SELECT 'Migration completed successfully! course_teachers table is ready.' AS status;
