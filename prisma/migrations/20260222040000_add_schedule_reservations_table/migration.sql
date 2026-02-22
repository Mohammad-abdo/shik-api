CREATE TABLE `schedule_reservations` (
  `id` VARCHAR(191) NOT NULL,
  `scheduleId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `subscriptionId` VARCHAR(191) NOT NULL,
  `reservationDate` DATETIME(3) NOT NULL,
  `startTime` VARCHAR(191) NOT NULL,
  `endTime` VARCHAR(191) NOT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL,

  UNIQUE INDEX `schedule_reservations_slot_unique`(`scheduleId`, `reservationDate`, `startTime`),
  INDEX `schedule_reservations_studentId_fkey`(`studentId`),
  INDEX `schedule_reservations_subscriptionId_fkey`(`subscriptionId`),
  INDEX `schedule_reservations_date_idx`(`reservationDate`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

ALTER TABLE `schedule_reservations`
  ADD CONSTRAINT `schedule_reservations_scheduleId_fkey`
  FOREIGN KEY (`scheduleId`) REFERENCES `schedules`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `schedule_reservations`
  ADD CONSTRAINT `schedule_reservations_studentId_fkey`
  FOREIGN KEY (`studentId`) REFERENCES `users`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE `schedule_reservations`
  ADD CONSTRAINT `schedule_reservations_subscriptionId_fkey`
  FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`)
  ON DELETE CASCADE ON UPDATE CASCADE;

INSERT IGNORE INTO `schedule_reservations` (
  `id`,
  `scheduleId`,
  `studentId`,
  `subscriptionId`,
  `reservationDate`,
  `startTime`,
  `endTime`,
  `createdAt`,
  `updatedAt`
)
SELECT
  UUID(),
  b.`scheduleId`,
  b.`studentId`,
  b.`subscriptionId`,
  b.`date`,
  b.`startTime`,
  TIME_FORMAT(ADDTIME(STR_TO_DATE(b.`startTime`, '%H:%i'), SEC_TO_TIME(IFNULL(b.`duration`, 120) * 60)), '%H:%i'),
  NOW(3),
  NOW(3)
FROM `bookings` b
WHERE b.`subscriptionId` IS NOT NULL
  AND b.`scheduleId` IS NOT NULL
  AND b.`status` IN ('PENDING', 'CONFIRMED');
