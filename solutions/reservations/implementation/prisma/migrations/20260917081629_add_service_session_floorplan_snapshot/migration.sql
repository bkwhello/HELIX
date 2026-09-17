-- AlterTable
ALTER TABLE "service_sessions" ADD COLUMN     "floorplan_version_id" TEXT;

-- AddForeignKey
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_floorplan_version_id_fkey" FOREIGN KEY ("floorplan_version_id") REFERENCES "floorplan_versions"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CheckConstraint: Opened and Closed ServiceSessions must carry a non-null
-- floorplan_version_id (the Open-time snapshot); Created and Cancelled
-- sessions are unconstrained (null before Open, and Cancelled-from-Created
-- never acquires one). Real-database backstop for R1.5-P2C's own
-- application-level invariant — mirrors this project's established
-- "the lock/service is the fast path, the constraint is what actually
-- guarantees it" posture (see e.g. the composite Floorplan default-version
-- FK's own doc comment).
ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_floorplan_version_required_when_active_check"
    CHECK (status NOT IN ('Opened', 'Closed') OR floorplan_version_id IS NOT NULL);
