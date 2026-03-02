-- Add relatedId to notifications; add COURSE_CREATED and SYSTEM to NotificationType enum.
ALTER TABLE `notifications` ADD COLUMN `relatedId` VARCHAR(191) NULL;
CREATE INDEX `notifications_relatedId_fkey` ON `notifications`(`relatedId`);

-- Extend enum: MySQL requires MODIFY COLUMN with full new enum list
ALTER TABLE `notifications` MODIFY COLUMN `type` ENUM(
  'BOOKING_CONFIRMED', 'BOOKING_CANCELLED', 'BOOKING_REJECTED', 'BOOKING_REQUEST',
  'SESSION_REMINDER', 'PAYMENT_RECEIVED', 'TEACHER_APPROVED', 'REVIEW_RECEIVED',
  'COURSE_CREATED', 'SYSTEM'
) NOT NULL;
