/*
  Warnings:

  - A unique constraint covering the columns `[personalCode]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE `userprofile` ADD COLUMN `discord` VARCHAR(191) NULL,
    ADD COLUMN `personalCode` VARCHAR(191) NULL,
    ADD COLUMN `twitter` VARCHAR(191) NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserProfile_personalCode_key` ON `UserProfile`(`personalCode`);
