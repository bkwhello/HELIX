-- R1.6-P3A — CAP-D02.01 Service Management, persisted-catalog foundation.
--
-- Three unrelated `DropForeignKey` statements that Prisma's migration-diff
-- generated for this migration (against pre-existing
-- seating_assignment_resources/seating_assignments constraints added via
-- raw SQL in earlier migrations, outside Prisma's own native FK tracking)
-- were deliberately removed from this file before it was ever applied to
-- any database — they are unrelated schema drift, not part of this
-- capability's work, and dropping them would have been destructive.

-- CreateTable
CREATE TABLE "services" (
    "code" TEXT NOT NULL,
    "display_name" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "services_pkey" PRIMARY KEY ("code")
);

-- Seed: exactly the two canonical rows this increment authorizes (Chief
-- Engineer decision — no Create/Delete Service operation). updated_at is
-- stamped explicitly (not left to the column default) since this is the
-- one INSERT that will ever set it without an application-layer update.
INSERT INTO "services" ("code", "display_name", "enabled", "created_at", "updated_at")
VALUES
    ('lunch', 'Lunch', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
    ('dinner', 'Dinner', true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

-- Safety guard: fail this migration outright if any existing
-- service_sessions row already carries a service_code outside the
-- canonical set just seeded above. Prevents the ADD CONSTRAINT below from
-- either silently succeeding against incompatible data or requiring a
-- silent rewrite of existing rows — this migration never rewrites
-- existing ServiceSession data under any circumstance. Both
-- helix_reservations_dev and the isolated test database hold zero
-- ServiceSession rows as of this migration's authorship; this guard turns
-- that into a verified precondition for every environment this migration
-- is ever applied to, not an assumption.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM "service_sessions"
    WHERE "service_code" NOT IN ('lunch', 'dinner')
  ) THEN
    RAISE EXCEPTION 'add_service_catalog migration aborted: service_sessions contains a service_code value outside the canonical seeded set (lunch, dinner). Resolve incompatible rows before applying this migration.';
  END IF;
END $$;

-- AddForeignKey
-- ON UPDATE RESTRICT (not CASCADE): "lunch"/"dinner" are the immutable
-- natural key this migration seeds — no application code ever renames a
-- Service's `code`, and this FK ensures the database itself refuses any
-- attempt to, rather than silently cascading a rename into every
-- referencing ServiceSession row.
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_code_fkey" FOREIGN KEY ("service_code") REFERENCES "services"("code") ON DELETE RESTRICT ON UPDATE RESTRICT;
