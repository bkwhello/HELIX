import { ServiceDefinition } from "../availability/ServiceDefinition.js";
import { ServiceCode } from "../availability/Service.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * R1.6-P3A — port for CAP-D02.01's persisted-catalog foundation. Read/
 * integration only, deliberately: no create/update/delete method exists
 * here — the two-row catalog (`lunch`, `dinner`) is fixed by migration
 * seed data for this increment (Chief Engineer decision: no Create/Delete
 * Service operation). A future management-API increment adds mutation
 * methods here; P3A does not.
 */
export interface ServiceDefinitionRepository {
  findByCode(code: ServiceCode, tx?: TransactionContext): Promise<ServiceDefinition | null>;

  /** Deterministic order (by code) — used by tests and reserved for future management-UI wiring; no HTTP route exposes this in P3A. */
  list(tx?: TransactionContext): Promise<readonly ServiceDefinition[]>;
}
