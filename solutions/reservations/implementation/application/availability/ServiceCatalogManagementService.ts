import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode, isServiceCode } from "../../domain/availability/Service.js";
import { ServiceOperatingInterval } from "../../domain/availability/ServiceOperatingInterval.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { SecurityEventRecorder, ServiceChangeMetadata } from "../ports/SecurityEventRecorder.js";

export type ServiceCatalogUpdateOutcome =
  | { readonly type: "UPDATED"; readonly service: ServiceDefinition }
  | { readonly type: "SERVICE_NOT_FOUND" };

const CANONICAL_ORDER: readonly ServiceCode[] = ["lunch", "dinner"];

/** By value, never by object identity — two independently-constructed intervals with equal minutes are equal, and `null` only equals `null`. */
function intervalsEqual(a: ServiceOperatingInterval | null, b: ServiceOperatingInterval | null): boolean {
  if (a === null || b === null) return a === b;
  return a.startMinute === b.startMinute && a.endMinute === b.endMinute;
}

type ServiceChanges = {
  displayName?: string;
  enabled?: boolean;
  defaultOperatingInterval?: ServiceOperatingInterval | null;
  defaultDurationMinutes?: number | null;
};

/**
 * R1.6-P3G — builds the one allowlisted metadata shape (see
 * SecurityEventRecorder.ts's own `ServiceChangeMetadata` doc comment):
 * only the public domain field names that actually changed, each as an
 * explicit `{ old, new }` pair, `null` preserved rather than omitted,
 * field order fixed (displayName, enabled, defaultOperatingInterval,
 * defaultDurationMinutes) so the serialized JSON is deterministic —
 * never a spread of `existing`/`changes`, never a database column name.
 */
function buildServiceChangeMetadata(code: ServiceCode, existing: ServiceDefinition, changes: ServiceChanges): ServiceChangeMetadata {
  const fields: Record<string, { old: unknown; new: unknown }> = {};
  if (changes.displayName !== undefined) {
    fields["displayName"] = { old: existing.displayName, new: changes.displayName };
  }
  if (changes.enabled !== undefined) {
    fields["enabled"] = { old: existing.enabled, new: changes.enabled };
  }
  if (changes.defaultOperatingInterval !== undefined) {
    fields["defaultOperatingInterval"] = {
      old: existing.defaultOperatingInterval
        ? { startMinute: existing.defaultOperatingInterval.startMinute, endMinute: existing.defaultOperatingInterval.endMinute }
        : null,
      new: changes.defaultOperatingInterval ? { startMinute: changes.defaultOperatingInterval.startMinute, endMinute: changes.defaultOperatingInterval.endMinute } : null,
    };
  }
  if (changes.defaultDurationMinutes !== undefined) {
    fields["defaultDurationMinutes"] = { old: existing.defaultDurationMinutes, new: changes.defaultDurationMinutes };
  }
  return { serviceCode: code, changes: fields };
}

/**
 * R1.6-P3B — CAP-D02.01 Service catalog management: authenticated read of
 * the fixed `lunch`/`dinner` catalog, and a controlled update of
 * `displayName`/`enabled` only. No create/delete — the catalog is fixed by
 * migration seed data (Chief Engineer decision) — and `code` is never
 * accepted as a mutable field here; the route layer (api/app.ts) rejects a
 * body containing `code` before this service is ever called.
 *
 * Deliberately NOT consulted by ServiceSessionService or its repository —
 * see tests/integration/service-catalog-migration.test.ts's own structural
 * proof. Disabling a Service here affects only future
 * CanonicalServicePeriodReader.validateReservation() calls (CAP-D02.01-R01);
 * it never rewrites or invalidates an existing Reservation and never blocks
 * ServiceSession lifecycle.
 *
 * R1.6-P3G — `update()` now runs its entire read-compare-write-audit
 * sequence inside one transaction, locking the target row first (see
 * ServiceDefinitionRepository.lockAndFindByCode's own doc comment) so
 * concurrent PATCH requests for the SAME code serialize at that lock
 * rather than racing an unlocked read against a later write. Every real
 * (non-no-op) update emits exactly one SecurityEvent — ServiceDeactivated
 * on a true->false transition, ServiceReactivated on false->true, and
 * ServiceModified for anything else — via the SAME transaction, so a
 * failure on either the Service write or the audit write rolls both
 * back (Chief Engineer directive: fail-closed, no new public failure
 * contract — an unhandled rejection reaches Express 5's existing
 * catch-all error middleware exactly like any other infrastructure
 * fault).
 */
export class ServiceCatalogManagementService {
  constructor(
    private readonly repository: ServiceDefinitionRepository,
    private readonly transactionManager: TransactionManager,
    private readonly securityEventRecorder: SecurityEventRecorder
  ) {}

  /** Deterministic lunch-then-dinner order — enforced here, never assumed from repository row order (Postgres gives no ordering guarantee without an explicit ORDER BY, and this method does not trust the adapter's own default either). */
  async list(): Promise<readonly ServiceDefinition[]> {
    const rows = await this.repository.list();
    const byCode = new Map(rows.map((s) => [s.code, s] as const));
    return CANONICAL_ORDER.map((code) => byCode.get(code)).filter((s): s is ServiceDefinition => s !== undefined);
  }

  /**
   * `code` is an unvalidated string (a raw route param) — any value that
   * is not one of the two canonical codes, or that names a code with no
   * row, both surface identically as SERVICE_NOT_FOUND; this service
   * never distinguishes "malformed code" from "missing row" to its
   * caller, matching CanonicalServicePeriodReader's own "missing and
   * disabled share one outcome" posture at its external boundary.
   *
   * `patch`'s fields are assumed already shape-validated by the caller
   * (trimmed non-empty string / real boolean) — same division of
   * responsibility as ServiceSessionService.create()'s own doc comment.
   *
   * Same-value idempotency: a field is only ever written to the
   * repository if it actually differs from the current row. Requesting
   * no real change (an empty diff after comparison) returns UPDATED with
   * the existing, byte-identical row — no repository call, so
   * `updatedAt` is never bumped for a no-op request.
   *
   * R1.6-P3C-2 — `defaultOperatingInterval` joins that same same-value
   * idempotency check, compared by value via `intervalsEqual` (never by
   * object identity, and never by re-deriving it from two independent
   * minute fields): omitted means "no interval change," an object means
   * "atomically set," `null` means "atomically clear" — and either of the
   * latter two is only actually written if it differs from the current
   * value, so a same-value object resend and a null-clear-of-an-already-
   * null interval are both no-ops, exactly like unchanged displayName/
   * enabled.
   *
   * R1.6-P3D-2 — `defaultDurationMinutes` joins the same same-value
   * idempotency check, compared as a plain scalar (`===`): omitted means
   * "no duration change," a number means "set/replace," `null` means
   * "clear" — written only if it differs from the current value. Any
   * combination of displayName/enabled/interval/duration changes is
   * still exactly ONE repository call (one atomic patch, one atomic
   * UPDATE), never split into per-field writes.
   *
   * R1.6-P3G — `actingStaffUserId` is the authenticated staff member
   * issuing this PATCH (threaded from the route's own session identity,
   * never trusted from the request body) and is used ONLY to attribute
   * the one SecurityEvent a real update emits; it plays no role in the
   * comparison/validation logic above. The old/new comparison itself now
   * runs against `lockAndFindByCode`'s locked read (never a pre-
   * transaction/unlocked one), inside the same transaction as the
   * eventual write(s) — see this class's own header comment.
   */
  async update(
    code: string,
    patch: {
      readonly displayName?: string;
      readonly enabled?: boolean;
      readonly defaultOperatingInterval?: ServiceOperatingInterval | null;
      readonly defaultDurationMinutes?: number | null;
    },
    actingStaffUserId: string
  ): Promise<ServiceCatalogUpdateOutcome> {
    if (!isServiceCode(code)) return { type: "SERVICE_NOT_FOUND" };

    return this.transactionManager.runInTransaction(async (tx) => {
      const existing = await this.repository.lockAndFindByCode(code, tx);
      if (!existing) return { type: "SERVICE_NOT_FOUND" };

      const changes: ServiceChanges = {};
      if (patch.displayName !== undefined && patch.displayName !== existing.displayName) changes.displayName = patch.displayName;
      if (patch.enabled !== undefined && patch.enabled !== existing.enabled) changes.enabled = patch.enabled;
      if (patch.defaultOperatingInterval !== undefined && !intervalsEqual(patch.defaultOperatingInterval, existing.defaultOperatingInterval)) {
        changes.defaultOperatingInterval = patch.defaultOperatingInterval;
      }
      if (patch.defaultDurationMinutes !== undefined && patch.defaultDurationMinutes !== existing.defaultDurationMinutes) {
        changes.defaultDurationMinutes = patch.defaultDurationMinutes;
      }

      if (Object.keys(changes).length === 0) {
        return { type: "UPDATED", service: existing };
      }

      const updated = await this.repository.update(code, changes, tx);
      const service = updated ?? existing;
      const metadata = buildServiceChangeMetadata(code, existing, changes);

      if (changes.enabled === true) {
        await this.securityEventRecorder.recordServiceReactivated({ actingStaffUserId, metadata }, tx);
      } else if (changes.enabled === false) {
        await this.securityEventRecorder.recordServiceDeactivated({ actingStaffUserId, metadata }, tx);
      } else {
        await this.securityEventRecorder.recordServiceModified({ actingStaffUserId, metadata }, tx);
      }

      return { type: "UPDATED", service };
    });
  }
}
