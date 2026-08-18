-- CreateTable
CREATE TABLE "reservations" (
    "id" TEXT NOT NULL,
    "servicePeriodId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "contactName" TEXT,
    "status" TEXT NOT NULL,
    "reservationDate" TIMESTAMPTZ NOT NULL,
    "partySize" INTEGER NOT NULL,
    "sourceCategory" TEXT NOT NULL,
    "externalReference" TEXT,
    "importedBy" TEXT,
    "preferredArea" TEXT,
    "notes" TEXT,
    "tableAssignment" TEXT,
    "arrivedAt" TIMESTAMPTZ,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL,
    "updatedAt" TIMESTAMPTZ NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "reservations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reservation_events" (
    "id" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "occurredAt" TIMESTAMPTZ NOT NULL,
    "payload" TEXT NOT NULL,

    CONSTRAINT "reservation_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "applied_commands" (
    "commandId" TEXT NOT NULL,
    "reservationId" TEXT NOT NULL,
    "appliedAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "applied_commands_pkey" PRIMARY KEY ("commandId")
);

-- CreateTable
CREATE TABLE "closing_days" (
    "id" TEXT NOT NULL,
    "fromDate" TIMESTAMPTZ NOT NULL,
    "toDate" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "createdBy" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "closing_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "capacity_commitments" (
    "commitment_id" TEXT NOT NULL,
    "reservation_id" TEXT,
    "capacity_pool_id" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "party_size" INTEGER NOT NULL,
    "status" TEXT NOT NULL,
    "command_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "capacity_commitments_pkey" PRIMARY KEY ("commitment_id")
);

-- CreateIndex
CREATE INDEX "reservation_events_reservationId_idx" ON "reservation_events"("reservationId");

-- CreateIndex
CREATE INDEX "capacity_commitments_capacity_pool_id_start_time_end_time_idx" ON "capacity_commitments"("capacity_pool_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "capacity_commitments_reservation_id_idx" ON "capacity_commitments"("reservation_id");

-- CreateIndex
CREATE INDEX "capacity_commitments_command_id_idx" ON "capacity_commitments"("command_id");

-- AddForeignKey
ALTER TABLE "reservation_events" ADD CONSTRAINT "reservation_events_reservationId_fkey" FOREIGN KEY ("reservationId") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CAP-D02.03 §22 — database-level invariants, not left to UI/application
-- validation alone. Hand-written: Prisma has no declarative CHECK-
-- constraint syntax as of this client version (5.22), so these are added
-- directly to the generated migration rather than expressed in
-- schema.prisma. If a future `prisma migrate dev` regenerates this
-- migration's SQL from schema.prisma, these three lines must be
-- reapplied by hand — see prisma/schema.prisma's CapacityCommitment doc
-- comment, which cross-references this file.
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_party_size_positive" CHECK ("partySize" > 0);

ALTER TABLE "capacity_commitments" ADD CONSTRAINT "capacity_commitments_party_size_positive" CHECK ("party_size" > 0);

ALTER TABLE "capacity_commitments" ADD CONSTRAINT "capacity_commitments_start_before_end" CHECK ("start_time" < "end_time");
