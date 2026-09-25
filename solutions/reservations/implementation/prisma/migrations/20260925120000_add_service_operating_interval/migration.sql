-- R1.6-P3C-1 — CAP-D02.01 Service Management, operating-interval snapshot
-- foundation. Adds two nullable-pair integer columns to "services" (a
-- planning DEFAULT only) and two nullable-pair integer columns to
-- "service_sessions" (a one-time snapshot of that default, taken at
-- session-creation and never rewritten). Neither pair affects
-- deriveServiceCode classification, booking-window eligibility, capacity,
-- seating, or ServiceSession open/close/cancel transitions — see the
-- R1.6-P3C-A design addendum's accepted decisions and
-- domain/availability/ServiceOperatingInterval.ts.
--
-- Three unrelated `DropForeignKey` statements and one `DropTable`
-- (`_test_database_sentinel`, a test-only table outside this schema
-- entirely) that `prisma migrate diff` generated against the current
-- database state were deliberately removed from this file before it was
-- ever applied to any database — the same "unrelated schema drift, not
-- part of this capability's work" posture the add_service_catalog
-- migration's own header comment already documents for an identical
-- class of diff noise.

-- AlterTable
ALTER TABLE "services" ADD COLUMN "default_start_minute" INTEGER,
ADD COLUMN "default_end_minute" INTEGER;

-- AlterTable
ALTER TABLE "service_sessions" ADD COLUMN "start_minute" INTEGER,
ADD COLUMN "end_minute" INTEGER;

-- CheckConstraint: paired nullability (both null, or both non-null),
-- integer range, and end > start (end exclusive, overnight intervals
-- unsupported) — the real, database-level enforcement of
-- ServiceOperatingInterval.ts's own invariants. Application code is the
-- fast path; this constraint is what actually guarantees it, matching
-- this project's established "the lock/service is the fast path, the
-- constraint is what actually guarantees it" posture (see e.g.
-- service_sessions_floorplan_version_required_when_active_check above).
ALTER TABLE "services" ADD CONSTRAINT "services_default_operating_interval_check"
    CHECK (
      ("default_start_minute" IS NULL AND "default_end_minute" IS NULL)
      OR (
        "default_start_minute" IS NOT NULL AND "default_end_minute" IS NOT NULL
        AND "default_start_minute" >= 0 AND "default_start_minute" <= 1439
        AND "default_end_minute" >= 1 AND "default_end_minute" <= 1440
        AND "default_end_minute" > "default_start_minute"
      )
    );

-- CheckConstraint: identical shape, applied to the ServiceSession
-- snapshot pair — see ServiceOperatingInterval.ts's own
-- parsePersistedServiceOperatingInterval doc comment for why both this
-- constraint and the application-layer parser exist (defense in depth,
-- never relying on either alone).
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_operating_interval_snapshot_check"
    CHECK (
      ("start_minute" IS NULL AND "end_minute" IS NULL)
      OR (
        "start_minute" IS NOT NULL AND "end_minute" IS NOT NULL
        AND "start_minute" >= 0 AND "start_minute" <= 1439
        AND "end_minute" >= 1 AND "end_minute" <= 1440
        AND "end_minute" > "start_minute"
      )
    );

-- Seed: lunch's default operating interval is set to [720, 960) —
-- 12:00-16:00 Europe/Amsterdam local time — the SAME boundary already
-- live and owner-confirmed as the canonical lunch/dinner classification
-- rule (domain/availability/Service.ts's deriveServiceCode, R1.6-P2B
-- decision #4). This is not a new guess; it duplicates an already-
-- accepted value into this new advisory field. Dinner's operating
-- interval is deliberately left NULL: no accepted product value exists
-- for a dinner end time anywhere in this codebase or the capability
-- registry, and this migration does not invent one.
UPDATE "services" SET "default_start_minute" = 720, "default_end_minute" = 960 WHERE "code" = 'lunch';
