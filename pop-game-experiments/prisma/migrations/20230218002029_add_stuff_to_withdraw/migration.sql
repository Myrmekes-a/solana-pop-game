-- AlterTable
ALTER TABLE `Withdraw` ADD COLUMN `confirmed` BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN `txSignature` VARCHAR(191) NULL;
