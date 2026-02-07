-- AlterTable
ALTER TABLE `videos` ADD COLUMN `teacherId` VARCHAR(191) NULL;

-- CreateIndex
CREATE INDEX `videos_teacherId_idx` ON `videos`(`teacherId`);

-- AddForeignKey
ALTER TABLE `videos` ADD CONSTRAINT `videos_teacherId_fkey` FOREIGN KEY (`teacherId`) REFERENCES `teachers`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
