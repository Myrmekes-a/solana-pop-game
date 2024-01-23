/*
  Warnings:

  - You are about to drop the column `handle` on the `user` table. All the data in the column will be lost.
  - You are about to drop the column `personalCode` on the `userprofile` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[name]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `name` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX `User_handle_key` ON `user`;

-- DropIndex
DROP INDEX `UserProfile_personalCode_key` ON `userprofile`;

-- AlterTable
ALTER TABLE `user` DROP COLUMN `handle`,
    ADD COLUMN `name` VARCHAR(191) NOT NULL;

-- AlterTable
ALTER TABLE `userprofile` DROP COLUMN `personalCode`;

-- CreateIndex
CREATE UNIQUE INDEX `User_name_key` ON `User`(`name`);
