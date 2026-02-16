/*
  Warnings:

  - Added the required column `teacherId` to the `student_subscriptions` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `bookings` ADD COLUMN `subscriptionId` VARCHAR(191) NULL,
    ADD COLUMN `type` ENUM('SINGLE', 'SUBSCRIPTION') NOT NULL DEFAULT 'SINGLE';

-- AlterTable
ALTER TABLE `student_subscription_packages` ADD COLUMN `totalSessions` INTEGER NULL DEFAULT 0,
    ADD COLUMN `weeklyFrequency` INTEGER NULL DEFAULT 0;

-- AlterTable
ALTER TABLE `student_subscriptions` ADD COLUMN `selectedSlots` JSON NULL,
    ADD COLUMN `teacherId` VARCHAR(191) NOT NULL;

-- AddForeignKey
ALTER TABLE `student_subscriptions` ADD CONSTRAINT `student_subscriptions_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
