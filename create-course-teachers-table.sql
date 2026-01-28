-- Check if table exists, if not create it
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

-- Add foreign keys if they don't exist
-- Note: MySQL will skip if constraints already exist with same name
SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='ANSI';
SET @stmt = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
     WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'course_teachers'
     AND CONSTRAINT_NAME = 'course_teachers_courseId_fkey'
     AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0,
    'ALTER TABLE `course_teachers` ADD CONSTRAINT `course_teachers_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @stmt = (
  SELECT IF(
    (SELECT COUNT(*) FROM INFORMATION_SCHEMA.TABLE_CONSTRAINTS 
     WHERE CONSTRAINT_SCHEMA = DATABASE()
     AND TABLE_NAME = 'course_teachers'
     AND CONSTRAINT_NAME = 'course_teachers_teacherId_fkey'
     AND CONSTRAINT_TYPE = 'FOREIGN KEY') = 0,
    'ALTER TABLE `course_teachers` ADD CONSTRAINT `course_teachers_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers` (`id`) ON DELETE CASCADE ON UPDATE CASCADE',
    'SELECT 1'
  )
);
PREPARE stmt FROM @stmt;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
SET SQL_MODE=@OLD_SQL_MODE;

SELECT 'Migration completed successfully!' AS status;
