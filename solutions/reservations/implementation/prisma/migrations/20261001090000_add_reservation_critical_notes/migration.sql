-- R1.3-I3 — CAP-D05.02 (Allergy and Critical Note Management) foundation.
-- Adds exactly one new table: the sole authoritative allergy/critical-
-- note record for a Reservation. `reservations.notes` remains a
-- separate, untouched, non-authoritative general-comments column — this
-- migration does not alter it. Additive only: new table, primary key,
-- required index, foreign key, CHECK constraints. No seed or data
-- update — see the R1.6-P1B13 design gate and its accepted decisions.

-- CreateTable
CREATE TABLE "reservation_critical_notes" (
    "id" TEXT NOT NULL,
    "reservation_id" TEXT NOT NULL,
    "note_type" TEXT NOT NULL,
    "detail" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'Active',
    "created_by_staff_user_id" TEXT NOT NULL,
    "updated_by_staff_user_id" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,
    "resolved_at" TIMESTAMPTZ,

    CONSTRAINT "reservation_critical_notes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "reservation_critical_notes_reservation_id_idx" ON "reservation_critical_notes"("reservation_id");

-- AddForeignKey
ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "reservation_critical_notes_reservation_id_fkey"
    FOREIGN KEY ("reservation_id") REFERENCES "reservations"("id") ON DELETE RESTRICT ON UPDATE RESTRICT;

-- CheckConstraint: CAP-D05.02-R02 — note_type is a closed, two-member
-- category. Mirrors ServiceCatalog's own "application constructor is the
-- fast path, this CHECK is what actually guarantees it" posture.
ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "reservation_critical_notes_note_type_check"
    CHECK ("note_type" IN ('Allergy', 'Critical'));

-- CheckConstraint: status is a closed, two-member lifecycle.
ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "reservation_critical_notes_status_check"
    CHECK ("status" IN ('Active', 'Resolved'));

-- CheckConstraint: CAP-D05.02's own Active/resolvedAt invariant —
-- Active requires resolved_at NULL; Resolved requires resolved_at
-- NOT NULL. Enforced here as the real, database-level guarantee behind
-- the application-layer rule of the same name.
ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "reservation_critical_notes_status_resolved_at_check"
    CHECK (
      ("status" = 'Active' AND "resolved_at" IS NULL)
      OR ("status" = 'Resolved' AND "resolved_at" IS NOT NULL)
    );

-- CheckConstraint: CAP-D05.02-R01 — detail must be non-empty once
-- trimmed (the application layer is responsible for storing the
-- already-trimmed value; this is the defense-in-depth backstop against
-- a row ever being written with only whitespace).
ALTER TABLE "reservation_critical_notes" ADD CONSTRAINT "reservation_critical_notes_detail_not_blank_check"
    CHECK (length(btrim("detail")) > 0 AND length("detail") <= 500);
