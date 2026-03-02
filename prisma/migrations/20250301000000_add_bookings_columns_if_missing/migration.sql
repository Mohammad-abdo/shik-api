-- Add columns to bookings if they are missing (idempotent).
-- Each block adds one column only when it does not exist.

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'type') > 0,
  'SELECT 1',
  'ALTER TABLE `bookings` ADD COLUMN `type` ENUM(''SINGLE'', ''SUBSCRIPTION'') NOT NULL DEFAULT ''SINGLE'' AFTER `cancelledBy`'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'subscriptionId') > 0,
  'SELECT 1',
  'ALTER TABLE `bookings` ADD COLUMN `subscriptionId` VARCHAR(191) NULL AFTER `type`'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

SET @sql = (SELECT IF(
  (SELECT COUNT(*) FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'bookings' AND COLUMN_NAME = 'isFeatured') > 0,
  'SELECT 1',
  'ALTER TABLE `bookings` ADD COLUMN `isFeatured` BOOLEAN NOT NULL DEFAULT false AFTER `subscriptionId`'
));
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;
