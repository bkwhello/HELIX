import { ServiceDefinition } from "../availability/ServiceDefinition.js";
import { ServiceCode } from "../availability/Service.js";
import { ServiceOperatingInterval } from "../availability/ServiceOperatingInterval.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * R1.6-P3A — port for CAP-D02.01's persisted-catalog foundation. R1.6-P3B
 * adds the one mutation this capability's product decisions allow: a
 * partial update of `displayName`/`enabled` by immutable `code`. R1.6-P3C-2
 * extends that same mutation with `defaultOperatingInterval`. Still no
 * create/delete method — the two-row catalog (`lunch`, `dinner`) remains
 * fixed by migration seed data (Chief Engineer decision: no Create/Delete
 * Service operation), and `code` itself is never mutated by anything here.
 */
export interface ServiceDefinitionRepository {
  findByCode(code: ServiceCode, tx?: TransactionContext): Promise<ServiceDefinition | null>;

  /**
   * R1.6-P3G — same shape as `findByCode`, but takes a database row lock
   * (`SELECT ... FOR UPDATE`) on the returned row, serializing concurrent
   * callers against each other for this one `code`. `tx` is REQUIRED
   * (unlike every other method here): a row lock taken outside an
   * explicit, still-open transaction is released the instant the single
   * SELECT statement completes, which would make the lock meaningless —
   * this method exists specifically for the "lock, read authoritative
   * state, compare, then write" pattern
   * `ServiceCatalogManagementService.update()` uses, never for a plain
   * read. Returns `null` for an unknown code, exactly like `findByCode`.
   */
  lockAndFindByCode(code: ServiceCode, tx: TransactionContext): Promise<ServiceDefinition | null>;

  /** Deterministic order (by code) — used by tests and the P3B management service; the management service itself re-orders to the canonical lunch/dinner sequence rather than trusting this order for its own API response. */
  list(tx?: TransactionContext): Promise<readonly ServiceDefinition[]>;

  /**
   * R1.6-P3B — partial update of `displayName` and/or `enabled` for an
   * existing row, by its immutable `code`. R1.6-P3C-2 adds
   * `defaultOperatingInterval` to that same patch: omitted touches neither
   * persisted column, an object atomically sets both in one write, and
   * `null` atomically clears both in one write — no partial-pair write is
   * ever possible through this method. R1.6-P3D-2 adds
   * `defaultDurationMinutes` alongside it: a single nullable scalar, so
   * omitted touches nothing, `null` writes SQL NULL, and a configured
   * value writes that integer — entirely independent of
   * `defaultOperatingInterval` (no pairing, no cross-validation). Every
   * supplied field in one call is written in exactly ONE atomic repository
   * update, never a read-modify-write split. `patch` carries only the
   * field(s) the caller actually wants to change — never re-send a field
   * to "confirm" its current value; ServiceCatalogManagementService's own
   * same-value idempotency check (comparing intervals/duration by value,
   * not identity) is what decides whether to call this at all, so an
   * actual call here always represents a real, intended write. Returns
   * the updated row, or `null` if `code` has no row (never thrown as a
   * not-found error) — a defensive case only, since every caller that can
   * reach this already validated `code` is canonical and looked the row
   * up first.
   */
  update(
    code: ServiceCode,
    patch: {
      readonly displayName?: string;
      readonly enabled?: boolean;
      readonly defaultOperatingInterval?: ServiceOperatingInterval | null;
      readonly defaultDurationMinutes?: number | null;
    },
    tx?: TransactionContext
  ): Promise<ServiceDefinition | null>;
}
