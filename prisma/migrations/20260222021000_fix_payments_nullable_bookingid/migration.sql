ALTER TABLE `payments`
  MODIFY `bookingId` VARCHAR(191) NULL;

ALTER TABLE `payments`
  ADD CONSTRAINT `payments_subscriptionId_fkey`
    FOREIGN KEY (`subscriptionId`) REFERENCES `student_subscriptions`(`id`)
    ON DELETE SET NULL
    ON UPDATE CASCADE;
