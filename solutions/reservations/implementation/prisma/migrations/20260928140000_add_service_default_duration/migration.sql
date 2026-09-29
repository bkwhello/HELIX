-- R1.6-P3D-1 — CAP-D02.01 Service Management, default reservation
-- duration snapshot foundation. Adds one nullable integer column to
-- "services" (a planning DEFAULT only) and one nullable integer column
-- to "service_sessions" (a one-time snapshot of that default, taken at
-- session-creation and never rewritten). Entirely independent of the
-- existing default_start_minute/default_end_minute and start_minute/
-- end_minute pairs (no pairing, no cross-validation) — see the P3D
-- design gate report and domain/availability/ServiceDefaultDuration.ts.
-- Neither column affects deriveServiceCode classification, booking-
-- window eligibility, CapacityPool/CapacityCommitment/availability,
-- seating timing, or Floor-view timing, all of which remain governed
-- exclusively by CapacityPool.durationMinutes (domain/availability/
-- CapacityPool.ts), unchanged by this migration.
--
-- Three unrelated `DropForeignKey` statements and one `DropTable`
-- (`_test_database_sentinel`, a test-only table outside this schema
-- entirely) that `prisma migrate diff` generated against the current
-- database state were deliberately removed from this file before it was
-- ever applied to any database — the same "unrelated schema drift, not
-- part of this capability's work" posture the add_service_catalog and
-- add_service_operating_interval migrations' own header comments already
-- document for an identical class of diff noise.

-- AlterTable
ALTER TABLE "services" ADD COLUMN "default_duration_minutes" INTEGER;

-- AlterTable
ALTER TABLE "service_sessions" ADD COLUMN "duration_snapshot_minutes" INTEGER;

-- CheckConstraint: NULL, or an integer in [15,480] inclusive, divisible
-- by 15 — the real, database-level enforcement of
-- ServiceDefaultDuration.ts's own `createServiceDefaultDuration`
-- invariants. Application code is the fast path; this constraint is
-- what actually guarantees it, matching this project's established
-- "the lock/service is the fast path, the constraint is what actually
-- guarantees it" posture (see e.g.
-- services_default_operating_interval_check above/elsewhere).
ALTER TABLE "services" ADD CONSTRAINT "services_default_duration_minutes_check"
    CHECK (
      "default_duration_minutes" IS NULL
      OR (
        "default_duration_minutes" >= 15
        AND "default_duration_minutes" <= 480
        AND "default_duration_minutes" % 15 = 0
      )
    );

-- CheckConstraint: identical shape, applied to the ServiceSession
-- snapshot column — see ServiceDefaultDuration.ts's own doc comment for
-- why both this constraint and the application-layer constructor exist
-- (defense in depth, never relying on either alone).
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_duration_snapshot_minutes_check"
    CHECK (
      "duration_snapshot_minutes" IS NULL
      OR (
        "duration_snapshot_minutes" >= 15
        AND "duration_snapshot_minutes" <= 480
        AND "duration_snapshot_minutes" % 15 = 0
      )
    );

-- No seed/update statement — both canonical Service rows (`lunch`,
-- `dinner`) remain NULL for this new column. No accepted product value
-- exists for either; this migration does not invent one (Chief Engineer
-- decision, R1.6-P3D-1 authorization).
