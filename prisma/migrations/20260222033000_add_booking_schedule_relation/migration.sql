-- Add direct reference from booking to sheikh schedule slot
ALTER TABLE `bookings`
  ADD COLUMN `scheduleId` VARCHAR(191) NULL;

CREATE INDEX `bookings_scheduleId_fkey` ON `bookings`(`scheduleId`);

ALTER TABLE `bookings`
  ADD CONSTRAINT `bookings_scheduleId_fkey`
  FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`)
  ON DELETE SET NULL ON UPDATE CASCADE;
