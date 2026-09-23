/**
 * R1.6-P3A — CAP-D02.01 Service Management, persisted-catalog foundation
 * only. Deliberately narrow: identity (`code`), staff-facing naming
 * (`displayName`), and enable/disable state (`enabled`) — nothing else.
 *
 * Three distinct, already-established "Service" concerns exist elsewhere
 * in this codebase and are NOT touched or duplicated by this file:
 *   - `Service.ts` (`ServiceCode`, `deriveServiceCode`) — the code-level,
 *     time-derived CLASSIFICATION axis. This file's own `code` field
 *     reuses that same closed `ServiceCode` type as its natural key;
 *     `deriveServiceCode` remains the sole classification authority.
 *   - `ServicePeriod.ts` — booking-window ELIGIBILITY (which start times
 *     are offered), keyed by area + date, not by Service. Not persisted
 *     here; this file owns no schedule/window data at all.
 *   - `ServiceSession.ts` — the daily OPERATIONAL SESSION lifecycle
 *     (Created/Opened/Closed/Cancelled). A `ServiceDefinition` describes
 *     "what a Service is"; a `ServiceSession` describes "this Service,
 *     running today." Neither owns the other's data.
 *
 * Update-in-place, not versioned — a `ServiceDefinition` is a small,
 * slowly-changing reference record (two rows today), not a lifecycle
 * object like `FloorplanVersion`. No optimistic-concurrency `version`
 * column exists (P3A ships no update path at all — see
 * `domain/repositories/ServiceDefinitionRepository.ts`), matching
 * `ClosingDay`/`ServicePeriodOverride`'s own precedent for simple
 * reference-data tables (product-principles.md PRP-014/PRP-020).
 */
import { ServiceCode } from "./Service.js";

export interface ServiceDefinition {
  readonly code: ServiceCode;
  readonly displayName: string;
  readonly enabled: boolean;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}
