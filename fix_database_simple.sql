-- Simple SQL to add missing columns to users table
-- Run this in phpMyAdmin or MySQL CLI

USE Shaykhi;

-- Add missing columns (will fail if they already exist, which is fine)
ALTER TABLE `users` 
ADD COLUMN `firstNameAr` VARCHAR(191) NULL AFTER `firstName`;

ALTER TABLE `users` 
ADD COLUMN `lastNameAr` VARCHAR(191) NULL AFTER `lastName`;

ALTER TABLE `users` 
ADD COLUMN `currentSurah` VARCHAR(191) NULL;

ALTER TABLE `users` 
ADD COLUMN `currentSurahAr` VARCHAR(191) NULL;

ALTER TABLE `users` 
ADD COLUMN `memorizationLevel` VARCHAR(191) NULL;

ALTER TABLE `users` 
ADD COLUMN `memorizationLevelAr` VARCHAR(191) NULL;

ALTER TABLE `users` 
ADD COLUMN `totalMemorized` INT NULL DEFAULT 0;

