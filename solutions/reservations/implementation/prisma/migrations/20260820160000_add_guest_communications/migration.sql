-- R1.6-B — Guest Communications Engine. Additive only. As with the
-- R1.6-A migration, `prisma migrate diff` against the live dev database
-- also proposed dropping and not recreating three unrelated, pre-existing
-- foreign keys on seating_assignment_resources/seating_assignments (a
-- Prisma-inferred referential-action mismatch against those hand-written
-- R1.5 migrations, unrelated to this change) — deliberately excluded.

-- AlterTable
ALTER TABLE "reservations" ADD COLUMN     "communication_language" TEXT NOT NULL DEFAULT 'nl';

-- CreateTable
CREATE TABLE "communication_messages" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "communication_type" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "recipient_email" TEXT NOT NULL,
    "payload" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Pending',
    "attempt_count" INTEGER NOT NULL DEFAULT 0,
    "available_at" TIMESTAMPTZ NOT NULL,
    "claimed_at" TIMESTAMPTZ,
    "provider_message_id" TEXT,
    "last_error" TEXT,
    "idempotency_key" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sent_at" TIMESTAMPTZ,

    CONSTRAINT "communication_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "guest_management_credentials" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMPTZ NOT NULL,
    "revoked_at" TIMESTAMPTZ,

    CONSTRAINT "guest_management_credentials_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "communication_messages_idempotency_key_key" ON "communication_messages"("idempotency_key");

-- CreateIndex
CREATE INDEX "communication_messages_reservation_id_idx" ON "communication_messages"("reservation_id");

-- CreateIndex
CREATE INDEX "communication_messages_status_available_at_idx" ON "communication_messages"("status", "available_at");

-- CreateIndex
CREATE UNIQUE INDEX "guest_management_credentials_token_hash_key" ON "guest_management_credentials"("token_hash");

-- CreateIndex
CREATE INDEX "guest_management_credentials_reservation_id_idx" ON "guest_management_credentials"("reservation_id");
