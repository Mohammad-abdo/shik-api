-- Unified Review model: add type (SHEIKH | COURSE | BOOKING), userId, sheikhId, courseId; migrate from studentId/teacherId.

-- Step 1: Add new columns (nullable first for data backfill)
ALTER TABLE `reviews` ADD COLUMN `type` ENUM('SHEIKH', 'COURSE', 'BOOKING') NULL;
ALTER TABLE `reviews` ADD COLUMN `userId` VARCHAR(191) NULL;
ALTER TABLE `reviews` ADD COLUMN `sheikhId` VARCHAR(191) NULL;
ALTER TABLE `reviews` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- Step 2: Backfill existing rows
UPDATE `reviews` SET `type` = 'BOOKING', `userId` = `studentId`, `sheikhId` = `teacherId` WHERE `studentId` IS NOT NULL;

-- Step 3: Make new columns non-null, make bookingId nullable
ALTER TABLE `reviews` MODIFY COLUMN `type` ENUM('SHEIKH', 'COURSE', 'BOOKING') NOT NULL;
ALTER TABLE `reviews` MODIFY COLUMN `userId` VARCHAR(191) NOT NULL;
ALTER TABLE `reviews` MODIFY COLUMN `bookingId` VARCHAR(191) NULL;
ALTER TABLE `reviews` MODIFY COLUMN `comment` TEXT NULL;

-- Step 4: Drop foreign keys that reference studentId and teacherId (MySQL: get constraint names from information_schema)
-- Prisma typically names them: reviews_studentId_fkey, reviews_teacherId_fkey
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_studentId_fkey`;
ALTER TABLE `reviews` DROP FOREIGN KEY `reviews_teacherId_fkey`;

-- Step 5: Drop old columns
ALTER TABLE `reviews` DROP COLUMN `studentId`;
ALTER TABLE `reviews` DROP COLUMN `teacherId`;

-- Step 6: Add new indexes and foreign keys
CREATE INDEX `reviews_userId_fkey` ON `reviews`(`userId`);
CREATE INDEX `reviews_sheikhId_fkey` ON `reviews`(`sheikhId`);
CREATE INDEX `reviews_courseId_fkey` ON `reviews`(`courseId`);
CREATE INDEX `reviews_type_fkey` ON `reviews`(`type`);

ALTER TABLE `reviews` ADD CONSTRAINT `reviews_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_sheikhId_fkey` FOREIGN KEY (`sheikhId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE `reviews` ADD CONSTRAINT `reviews_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
