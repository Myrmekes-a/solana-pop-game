/*
  Warnings:

  - Added the required column `createdAt` to the `Game` table without a default value. This is not possible if the table is not empty.
  - Added the required column `updatedAt` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Game` ADD COLUMN `createdAt` DATETIME(3) NOT NULL,
    ADD COLUMN `housePayout` VARCHAR(191) NULL,
    ADD COLUMN `processed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `updatedAt` DATETIME(3) NOT NULL,
    ADD COLUMN `winnerPayout` VARCHAR(191) NULL;

-- CreateTable
CREATE TABLE `GamePlay` (
    `id` VARCHAR(191) NOT NULL,
    `userId` VARCHAR(191) NOT NULL,
    `gameId` INTEGER NOT NULL,
    `balloonsBought` INTEGER NOT NULL,
    `balloonsRemaining` INTEGER NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `GamePlay` ADD CONSTRAINT `GamePlay_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `GamePlay` ADD CONSTRAINT `GamePlay_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
