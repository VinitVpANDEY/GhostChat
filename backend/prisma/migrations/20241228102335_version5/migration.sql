/*
  Warnings:

  - Made the column `lastRead` on table `UsersInGroup` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "UsersInGroup" ALTER COLUMN "lastRead" SET NOT NULL,
ALTER COLUMN "lastRead" SET DEFAULT CURRENT_TIMESTAMP;
