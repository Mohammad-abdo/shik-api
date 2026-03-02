-- CreateTable
CREATE TABLE `booking_sessions` (
    `id` VARCHAR(191) NOT NULL,
    `bookingId` VARCHAR(191) NOT NULL,
    `scheduleId` VARCHAR(191) NOT NULL,
    `scheduledDate` DATETIME(3) NOT NULL,
    `startTime` VARCHAR(191) NOT NULL,
    `endTime` VARCHAR(191) NOT NULL,
    `orderIndex` INTEGER NOT NULL DEFAULT 0,
    `status` ENUM('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'PENDING',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `booking_sessions_slot_unique`(`scheduleId`, `scheduledDate`, `startTime`),
    INDEX `booking_sessions_bookingId_fkey`(`bookingId`),
    INDEX `booking_sessions_scheduleId_fkey`(`scheduleId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AlterTable: add bookingSessionId to sessions (keep bookingId for now)
ALTER TABLE `sessions` ADD COLUMN `bookingSessionId` VARCHAR(191) NULL;
ALTER TABLE `sessions` MODIFY COLUMN `bookingId` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `sessions_bookingSessionId_key` ON `sessions`(`bookingSessionId`);
CREATE INDEX `sessions_bookingSessionId_fkey` ON `sessions`(`bookingSessionId`);

-- AddForeignKey
ALTER TABLE `booking_sessions` ADD CONSTRAINT `booking_sessions_bookingId_fkey` FOREIGN KEY (`bookingId`) REFERENCES `bookings`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE `booking_sessions` ADD CONSTRAINT `booking_sessions_scheduleId_fkey` FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE `sessions` ADD CONSTRAINT `sessions_bookingSessionId_fkey` FOREIGN KEY (`bookingSessionId`) REFERENCES `booking_sessions`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
