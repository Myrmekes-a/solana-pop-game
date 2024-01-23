/*
  Warnings:

  - You are about to drop the column `name` on the `user` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `UserProfile` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `UserProfile` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_name_key` ON `user`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `name`;

-- AlterTable
ALTER TABLE `userprofile` ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX `UserProfile_name_key` ON `UserProfile`(`name`);
