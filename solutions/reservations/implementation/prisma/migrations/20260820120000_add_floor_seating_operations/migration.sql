-- CAP-D03.03/CAP-D04.01 — Floor & Seating Operations (R1.5).
-- See R1_5_FLOOR_SEATING_FINAL_ARCHITECTURE.md §4/§10/§19 and
-- R1_5_FLOOR_SEATING_IMPLEMENTATION_REPORT.md for the full design.

-- CreateTable
CREATE TABLE "tables" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "operational_label" TEXT NOT NULL,
    "nominal_capacity" INTEGER NOT NULL,
    "supports_shared_seating" BOOLEAN NOT NULL DEFAULT false,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tables_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seats" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "operational_label" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "seats_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "resource_blocks" (
    "id" TEXT NOT NULL,
    "table_id" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "resource_blocks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seating_assignments" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "release_reason" TEXT,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,
    "assigned_by" TEXT NOT NULL,
    "assigned_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "seated_at" TIMESTAMPTZ,
    "released_by" TEXT,
    "released_at" TIMESTAMPTZ,
    "command_id" TEXT NOT NULL,

    CONSTRAINT "seating_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "seating_assignment_resources" (
    "id" TEXT NOT NULL,
    "assignment_id" TEXT NOT NULL,
    "table_id" TEXT,
    "seat_id" TEXT,
    "status" TEXT NOT NULL,
    "start_time" TIMESTAMPTZ NOT NULL,
    "end_time" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "seating_assignment_resources_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "tables_area_id_idx" ON "tables"("area_id");

-- CreateIndex
CREATE INDEX "seats_table_id_idx" ON "seats"("table_id");

-- CreateIndex
CREATE INDEX "resource_blocks_table_id_start_time_end_time_idx" ON "resource_blocks"("table_id", "start_time", "end_time");

-- CreateIndex
CREATE INDEX "seating_assignments_reservation_id_idx" ON "seating_assignments"("reservation_id");

-- CreateIndex
CREATE INDEX "seating_assignments_command_id_idx" ON "seating_assignments"("command_id");

-- CreateIndex
CREATE INDEX "seating_assignment_resources_assignment_id_idx" ON "seating_assignment_resources"("assignment_id");

-- CreateIndex
CREATE INDEX "seating_assignment_resources_table_id_idx" ON "seating_assignment_resources"("table_id");

-- CreateIndex
CREATE INDEX "seating_assignment_resources_seat_id_idx" ON "seating_assignment_resources"("seat_id");

-- AddForeignKey
ALTER TABLE "seats" ADD CONSTRAINT "seats_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "seating_assignment_resources" ADD CONSTRAINT "seating_assignment_resources_assignment_id_fkey" FOREIGN KEY ("assignment_id") REFERENCES "seating_assignments"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey — hand-added: tableId/seatId are deliberately NOT declared
-- as Prisma relations in schema.prisma (they are optional/polymorphic —
-- exactly one is set per row, enforced by the CHECK constraint below), so
-- Prisma's own diff does not generate these. Nullable FKs are valid in
-- PostgreSQL — a NULL value never violates a foreign key.
ALTER TABLE "seating_assignment_resources" ADD CONSTRAINT "seating_assignment_resources_table_id_fkey" FOREIGN KEY ("table_id") REFERENCES "tables"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "seating_assignment_resources" ADD CONSTRAINT "seating_assignment_resources_seat_id_fkey" FOREIGN KEY ("seat_id") REFERENCES "seats"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey — SeatingAssignment.reservationId, unlike
-- Reservation.contactId (deliberately not an FK, per that column's own
-- schema comment, to avoid backfilling pre-existing legacy rows), IS a
-- real foreign key: seating_assignments is a brand-new table with no
-- legacy rows to reconcile, so there is no reason to weaken this
-- reference — CAP-D04.01 final architecture §10.
ALTER TABLE "seating_assignments" ADD CONSTRAINT "seating_assignments_reservation_id_fkey" FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- R1.5 final architecture §10 — a Reservation has at most one non-Released
-- SeatingAssignment at a time. Same technique as
-- capacity_commitments_one_committed_per_reservation (R1.1) and
-- staff_users_one_owner (R1.2) — a partial UNIQUE index, since Prisma has
-- no declarative syntax for one.
CREATE UNIQUE INDEX "seating_assignments_one_active_per_reservation"
ON "seating_assignments" ("reservation_id")
WHERE "status" IN ('Assigned', 'Seated');

-- R1.5 final architecture §19 — hand-written CHECK constraints, same
-- rationale as prisma/migrations/20260817090958_init_postgres_with_capacity
-- (Prisma has no declarative CHECK-constraint syntax as of this client
-- version). If a future `prisma migrate dev` regenerates this migration's
-- SQL from schema.prisma, every constraint below this line must be
-- reapplied by hand.
ALTER TABLE "tables" ADD CONSTRAINT "tables_nominal_capacity_positive" CHECK ("nominal_capacity" > 0);

ALTER TABLE "resource_blocks" ADD CONSTRAINT "resource_blocks_start_before_end" CHECK ("start_time" < "end_time");

ALTER TABLE "seating_assignments" ADD CONSTRAINT "seating_assignments_start_before_end" CHECK ("start_time" < "end_time");

ALTER TABLE "seating_assignment_resources" ADD CONSTRAINT "seating_assignment_resources_start_before_end" CHECK ("start_time" < "end_time");

-- Exactly one of table_id/seat_id per row — a table-level claim (ordinary
-- Sushi table, bar position, or a whole non-shared-seating resource) XOR
-- a seat-level claim (an individual Teppanyaki seat). Final architecture
-- §10.
ALTER TABLE "seating_assignment_resources" ADD CONSTRAINT "seating_assignment_resources_exactly_one_resource"
CHECK (
  ("table_id" IS NOT NULL AND "seat_id" IS NULL) OR
  ("table_id" IS NULL AND "seat_id" IS NOT NULL)
);

-- R1.5 final architecture §19 — the structural overlap-prevention backstop
-- the assignment explicitly demanded be precise, not a plain unique index
-- (which cannot represent legitimate non-overlapping reuse of the same
-- resource — see the architecture report's own worked argument). Two
-- separate EXCLUDE constraints because seating_assignment_resources is
-- deliberately polymorphic (table_id XOR seat_id) rather than a single
-- generic resource-id column — collapsing that split purely to simplify
-- this constraint would reintroduce the generic-resource-abstraction
-- model (Model C) the R1.5 architecture investigation explicitly rejected
-- for lack of evidenced need.
--
-- btree_gist is required for a GiST index to support equality (`=`) on a
-- plain TEXT column alongside range overlap (`&&`) in the same exclusion
-- constraint — a standard PostgreSQL contrib extension, ships with
-- PostgreSQL itself, no new external dependency.
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- WHERE clause scopes the constraint to Assigned/Seated rows only, so a
-- Released row never blocks a new claim on the same resource/interval —
-- required for both ordinary reassignment and No-Show release to ever
-- succeed. tstzrange(start_time, end_time, '[)') matches this codebase's
-- existing half-open interval convention exactly (AvailabilityEvaluator's
-- intervalsOverlap) — back-to-back claims (A.end_time = B.start_time) are
-- correctly NOT treated as overlapping.
ALTER TABLE "seating_assignment_resources"
  ADD CONSTRAINT "seating_resource_no_overlap_table"
  EXCLUDE USING gist (
    "table_id" WITH =,
    tstzrange("start_time", "end_time", '[)') WITH &&
  )
  WHERE ("table_id" IS NOT NULL AND "status" IN ('Assigned', 'Seated'));

ALTER TABLE "seating_assignment_resources"
  ADD CONSTRAINT "seating_resource_no_overlap_seat"
  EXCLUDE USING gist (
    "seat_id" WITH =,
    tstzrange("start_time", "end_time", '[)') WITH &&
  )
  WHERE ("seat_id" IS NOT NULL AND "status" IN ('Assigned', 'Seated'));
