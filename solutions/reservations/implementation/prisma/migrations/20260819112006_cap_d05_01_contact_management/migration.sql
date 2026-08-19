-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "contactEmailSnapshot" TEXT,
ADD COLUMN     "contactPhoneSnapshot" TEXT;

-- CreateTable
CREATE TABLE "contacts" (
    "id" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "phone_raw" TEXT,
    "phone_normalized" TEXT,
    "email_raw" TEXT,
    "email_normalized" TEXT,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "last_relevant_activity_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "contacts_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "contacts_phone_normalized_idx" ON "contacts"("phone_normalized");

-- CreateIndex
CREATE INDEX "contacts_email_normalized_idx" ON "contacts"("email_normalized");
