import { ServiceDefinition } from "../availability/ServiceDefinition.js";
import { ServiceCode } from "../availability/Service.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * R1.6-P3A — port for CAP-D02.01's persisted-catalog foundation. R1.6-P3B
 * adds the one mutation this capability's product decisions allow: a
 * partial update of `displayName`/`enabled` by immutable `code`. Still no
 * create/delete method — the two-row catalog (`lunch`, `dinner`) remains
 * fixed by migration seed data (Chief Engineer decision: no Create/Delete
 * Service operation), and `code` itself is never mutated by anything here.
 */
export interface ServiceDefinitionRepository {
  findByCode(code: ServiceCode, tx?: TransactionContext): Promise<ServiceDefinition | null>;

  /** Deterministic order (by code) — used by tests and the P3B management service; the management service itself re-orders to the canonical lunch/dinner sequence rather than trusting this order for its own API response. */
  list(tx?: TransactionContext): Promise<readonly ServiceDefinition[]>;

  /**
   * R1.6-P3B — partial update of `displayName` and/or `enabled` for an
   * existing row, by its immutable `code`. `patch` carries only the
   * field(s) the caller actually wants to change — never re-send a field
   * to "confirm" its current value; ServiceCatalogManagementService's own
   * same-value idempotency check is what decides whether to call this at
   * all, so an actual call here always represents a real, intended write.
   * Returns the updated row, or `null` if `code` has no row (never thrown
   * as a not-found error) — a defensive case only, since every caller
   * that can reach this already validated `code` is canonical and looked
   * the row up first.
   */
  update(code: ServiceCode, patch: { readonly displayName?: string; readonly enabled?: boolean }, tx?: TransactionContext): Promise<ServiceDefinition | null>;
}
