/*
  Warnings:

  - The primary key for the `closing_days` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `date` on the `closing_days` table. All the data in the column will be lost.
  - Added the required column `fromDate` to the `closing_days` table without a default value. This is not possible if the table is not empty.
  - The required column `id` was added to the `closing_days` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Added the required column `toDate` to the `closing_days` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_closing_days" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "fromDate" DATETIME NOT NULL,
    "toDate" DATETIME NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_closing_days" ("createdAt", "createdBy", "reason") SELECT "createdAt", "createdBy", "reason" FROM "closing_days";
DROP TABLE "closing_days";
ALTER TABLE "new_closing_days" RENAME TO "closing_days";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
