/*
  Warnings:

  - Added the required column `reservationId` to the `applied_commands` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_applied_commands" (
    "commandId" TEXT NOT NULL PRIMARY KEY,
    "reservationId" TEXT NOT NULL,
    "appliedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_applied_commands" ("appliedAt", "commandId") SELECT "appliedAt", "commandId" FROM "applied_commands";
DROP TABLE "applied_commands";
ALTER TABLE "new_applied_commands" RENAME TO "applied_commands";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
