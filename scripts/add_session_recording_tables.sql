CREATE TABLE IF NOT EXISTS `session_memorizations` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `surahName` VARCHAR(191) NOT NULL,
  `surahNameAr` VARCHAR(191) NULL,
  `surahNumber` INT NULL,
  `fromAyah` INT NULL,
  `toAyah` INT NULL,
  `isFullSurah` BOOLEAN NOT NULL DEFAULT false,
  `notes` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `session_memorizations_sessionId_idx`(`sessionId`),
  CONSTRAINT `session_memorizations_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `session_revisions` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `revisionType` ENUM('CLOSE','FAR') NOT NULL,
  `rangeType` ENUM('SURAH','JUZ','QUARTER') NOT NULL,
  `fromSurah` VARCHAR(191) NULL,
  `toSurah` VARCHAR(191) NULL,
  `fromJuz` INT NULL,
  `toJuz` INT NULL,
  `fromQuarter` VARCHAR(191) NULL,
  `toQuarter` VARCHAR(191) NULL,
  `notes` LONGTEXT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  INDEX `session_revisions_sessionId_idx`(`sessionId`),
  CONSTRAINT `session_revisions_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS `session_reports` (
  `id` VARCHAR(191) NOT NULL,
  `sessionId` VARCHAR(191) NOT NULL,
  `teacherId` VARCHAR(191) NOT NULL,
  `studentId` VARCHAR(191) NOT NULL,
  `content` LONGTEXT NOT NULL,
  `rating` INT NULL,
  `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  PRIMARY KEY (`id`),
  UNIQUE INDEX `session_reports_sessionId_key`(`sessionId`),
  CONSTRAINT `session_reports_sessionId_fkey` FOREIGN KEY (`sessionId`) REFERENCES `sessions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
