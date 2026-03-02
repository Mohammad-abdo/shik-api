-- AlterTable: add paymentType (enum), userId, courseId to payments
ALTER TABLE `payments` ADD COLUMN `paymentType` ENUM('BOOKING', 'SUBSCRIPTION', 'COURSE') NOT NULL DEFAULT 'BOOKING';
ALTER TABLE `payments` ADD COLUMN `userId` VARCHAR(191) NULL;
ALTER TABLE `payments` ADD COLUMN `courseId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `payments_userId_idx` ON `payments`(`userId`);
CREATE INDEX `payments_courseId_idx` ON `payments`(`courseId`);

-- AddForeignKey (userId -> users.id)
ALTER TABLE `payments` ADD CONSTRAINT `payments_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey (courseId -> courses.id)
ALTER TABLE `payments` ADD CONSTRAINT `payments_courseId_fkey` FOREIGN KEY (`courseId`) REFERENCES `courses`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
