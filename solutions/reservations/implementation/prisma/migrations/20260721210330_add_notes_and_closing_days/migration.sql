-- AlterTable
ALTER TABLE "reservations" ADD COLUMN "notes" TEXT;

-- CreateTable
CREATE TABLE "closing_days" (
    "date" DATETIME NOT NULL PRIMARY KEY,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
