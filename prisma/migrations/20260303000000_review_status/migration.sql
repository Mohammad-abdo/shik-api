-- Add status to reviews for suspend/activate management (ACTIVE by default).
ALTER TABLE `reviews` ADD COLUMN `status` ENUM('ACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE';
CREATE INDEX `reviews_status_fkey` ON `reviews`(`status`);
