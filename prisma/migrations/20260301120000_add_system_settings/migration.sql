-- CreateTable
CREATE TABLE `system_settings` (
    `id` VARCHAR(191) NOT NULL,
    `key` VARCHAR(191) NOT NULL,
    `value` LONGTEXT NOT NULL,
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `system_settings_key_key`(`key`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- Insert default currency (EGP)
INSERT INTO `system_settings` (`id`, `key`, `value`, `updatedAt`) VALUES
(UUID(), 'currency_code', 'EGP', CURRENT_TIMESTAMP(3)),
(UUID(), 'currency_symbol', 'ج.م', CURRENT_TIMESTAMP(3)),
(UUID(), 'currency_name_ar', 'جنيه مصري', CURRENT_TIMESTAMP(3)),
(UUID(), 'currency_name_en', 'Egyptian Pound', CURRENT_TIMESTAMP(3));
