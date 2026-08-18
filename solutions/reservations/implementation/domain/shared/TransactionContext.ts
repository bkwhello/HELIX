/**
 * CAP-D02.03 — shared transaction handle.
 *
 * Opaque type passed through domain repository ports (ReservationRepository,
 * CapacityRepository) so an application-layer orchestrator can make several
 * writes — a capacity commitment, a reservation, and an idempotency marker —
 * commit or roll back together as one atomic unit. This is a hard
 * architectural invariant for CAP-D02.03, not a convenience: a separately-
 * committed two-step sequence (write capacity, then write reservation) can
 * leave a guest's booking half-applied if the second write fails, and ad hoc
 * compensation (try to undo step one) is explicitly rejected as the normal
 * path for this MVA.
 *
 * Declared in domain/shared/, not in an infrastructure file, so this type —
 * and everything that merely passes the value through (domain ports,
 * application orchestrators) — never needs to know it is really a Prisma
 * transaction client. Only the Prisma-backed adapters in
 * infrastructure/persistence cast it back to Prisma.TransactionClient. This
 * keeps the domain/application layers free of any Prisma import, matching
 * the existing port/adapter boundary in this codebase.
 */
export type TransactionContext = unknown;
