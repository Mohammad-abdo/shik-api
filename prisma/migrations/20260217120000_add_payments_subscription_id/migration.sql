-- AlterTable
ALTER TABLE `payments` ADD COLUMN `subscriptionId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_subscriptionId_key` ON `payments`(`subscriptionId`);
