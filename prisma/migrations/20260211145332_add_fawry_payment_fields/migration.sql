/*
  Warnings:

  - A unique constraint covering the columns `[fawryRefNumber]` on the table `payments` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[merchantRefNum]` on the table `payments` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `payments` ADD COLUMN `fawryRefNumber` VARCHAR(191) NULL,
    ADD COLUMN `merchantRefNum` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `payments_fawryRefNumber_key` ON `payments`(`fawryRefNumber`);

-- CreateIndex
CREATE UNIQUE INDEX `payments_merchantRefNum_key` ON `payments`(`merchantRefNum`);
