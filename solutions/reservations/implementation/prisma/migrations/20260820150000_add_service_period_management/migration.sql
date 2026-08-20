-- R1.6-A — Service Period Management (booking-window eligibility).
-- Additive only. The raw `prisma migrate diff` output against the live
-- dev database also proposed dropping and not recreating three unrelated,
-- pre-existing foreign keys on seating_assignment_resources/
-- seating_assignments (a Prisma-inferred referential-action mismatch
-- against those hand-written R1.5 migrations, unrelated to this change) —
-- those statements were deliberately excluded from this migration; only
-- the two new tables below were added.

-- CreateTable
CREATE TABLE "service_period_overrides" (
    "id" TEXT NOT NULL,
    "area_id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "status" TEXT NOT NULL,
    "reason" TEXT,
    "created_by" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "service_period_overrides_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "service_period_override_windows" (
    "id" TEXT NOT NULL,
    "override_id" TEXT NOT NULL,
    "first_start_minute" INTEGER NOT NULL,
    "last_start_minute" INTEGER NOT NULL,

    CONSTRAINT "service_period_override_windows_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "service_period_overrides_area_id_date_key" ON "service_period_overrides"("area_id", "date");

-- CreateIndex
CREATE INDEX "service_period_override_windows_override_id_idx" ON "service_period_override_windows"("override_id");

-- AddForeignKey
ALTER TABLE "service_period_override_windows" ADD CONSTRAINT "service_period_override_windows_override_id_fkey" FOREIGN KEY ("override_id") REFERENCES "service_period_overrides"("id") ON DELETE CASCADE ON UPDATE CASCADE;
