-- AlterTable
ALTER TABLE `subscription_packages` ADD COLUMN `maxBookings` INTEGER NULL,
    ADD COLUMN `packageType` VARCHAR(191) NOT NULL DEFAULT 'fixed',
    ADD COLUMN `period` INTEGER NULL,
    ADD COLUMN `periodUnit` VARCHAR(191) NULL,
    ADD COLUMN `sessionsPerMonth` INTEGER NULL;
