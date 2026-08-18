-- R1.1 P0 fix (Concurrent Modify vs Modify) — CAP-D02.03 §14 INV-01/INV-03.
--
-- Structural defense in depth alongside the orchestrator-level fix
-- (reservation-scoped advisory lock in AvailabilityOrchestrator): even if
-- a future code path had a bug that tried to leave two Committed
-- commitments active for the same reservation, PostgreSQL itself now
-- refuses the second insert, aborting that transaction rather than
-- silently persisting a phantom-occupancy state.
--
-- No WHERE reservation_id IS NOT NULL clause is needed: PostgreSQL never
-- treats two NULLs as equal under a UNIQUE index, so rows with a NULL
-- reservation_id (a hypothetical future non-reservation capacity hold —
-- see CapacityCommitment's schema doc comment) are already unconstrained
-- by this index without an explicit guard.
CREATE UNIQUE INDEX "capacity_commitments_one_committed_per_reservation"
ON "capacity_commitments" ("reservation_id")
WHERE "status" = 'Committed';
