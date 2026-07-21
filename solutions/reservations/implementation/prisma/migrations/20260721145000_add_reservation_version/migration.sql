-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_reservations" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "servicePeriodId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "reservationDate" DATETIME NOT NULL,
    "partySize" INTEGER NOT NULL,
    "sourceCategory" TEXT NOT NULL,
    "externalReference" TEXT,
    "importedBy" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL,
    "updatedAt" DATETIME NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1
);
INSERT INTO "new_reservations" ("contactId", "createdAt", "createdBy", "externalReference", "id", "importedBy", "partySize", "reservationDate", "servicePeriodId", "sourceCategory", "status", "updatedAt") SELECT "contactId", "createdAt", "createdBy", "externalReference", "id", "importedBy", "partySize", "reservationDate", "servicePeriodId", "sourceCategory", "status", "updatedAt" FROM "reservations";
DROP TABLE "reservations";
ALTER TABLE "new_reservations" RENAME TO "reservations";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
