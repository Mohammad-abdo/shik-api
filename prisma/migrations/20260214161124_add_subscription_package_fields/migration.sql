-- AlterTable
ALTER TABLE `student_subscription_packages` ADD COLUMN `durationMonths` INTEGER NULL,
    ADD COLUMN `maxTeachers` INTEGER NULL,
    ADD COLUMN `monthlyPrice` DOUBLE NULL,
    ADD COLUMN `yearlyPrice` DOUBLE NULL;
