import { TransactionContext } from "../../domain/shared/TransactionContext.js";

/**
 * CAP-D02.03 — runs a unit of work inside a single database transaction.
 *
 * All repository/store calls that accept the `tx` handed to `work` and
 * are invoked with it participate in that same transaction: one commit or
 * rollback for everything. This is how the "capacity commitment +
 * reservation write + idempotency marker must succeed or fail together"
 * invariant is actually enforced — see AvailabilityOrchestrator.
 */
export interface TransactionManager {
  runInTransaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T>;
}
