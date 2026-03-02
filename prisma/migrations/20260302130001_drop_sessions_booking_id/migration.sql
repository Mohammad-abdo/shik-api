-- DropForeignKey (run after migrate-sessions-to-booking-sessions.js)
ALTER TABLE `sessions` DROP FOREIGN KEY `sessions_bookingId_fkey`;

-- DropIndex
DROP INDEX `sessions_bookingId_key` ON `sessions`;

-- AlterTable
ALTER TABLE `sessions` DROP COLUMN `bookingId`;
