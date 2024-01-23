/*
  Warnings:

  - Added the required column `numberOfBalloonsInGame` to the `Game` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `Debit` ADD COLUMN `gameId` INTEGER NULL;

-- AlterTable
ALTER TABLE `Game` ADD COLUMN `numberOfBalloonsInGame` INTEGER NOT NULL,
    MODIFY `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    MODIFY `updatedAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3);

-- AddForeignKey
ALTER TABLE `Debit` ADD CONSTRAINT `Debit_gameId_fkey` FOREIGN KEY (`gameId`) REFERENCES `Game`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;
