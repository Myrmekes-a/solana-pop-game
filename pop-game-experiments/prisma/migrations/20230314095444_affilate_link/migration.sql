-- CreateTable
CREATE TABLE `AffiliateLink` (
    `userId` VARCHAR(191) NOT NULL,
    `invitedUserId` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`userId`, `invitedUserId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `AffiliateLink` ADD CONSTRAINT `AffiliateLink_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `AffiliateLink` ADD CONSTRAINT `AffiliateLink_invitedUserId_fkey` FOREIGN KEY (`invitedUserId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
