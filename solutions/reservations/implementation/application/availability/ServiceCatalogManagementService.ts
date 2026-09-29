import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode, isServiceCode } from "../../domain/availability/Service.js";
import { ServiceOperatingInterval } from "../../domain/availability/ServiceOperatingInterval.js";

export type ServiceCatalogUpdateOutcome =
  | { readonly type: "UPDATED"; readonly service: ServiceDefinition }
  | { readonly type: "SERVICE_NOT_FOUND" };

const CANONICAL_ORDER: readonly ServiceCode[] = ["lunch", "dinner"];

/** By value, never by object identity — two independently-constructed intervals with equal minutes are equal, and `null` only equals `null`. */
function intervalsEqual(a: ServiceOperatingInterval | null, b: ServiceOperatingInterval | null): boolean {
  if (a === null || b === null) return a === b;
  return a.startMinute === b.startMinute && a.endMinute === b.endMinute;
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
 */
export class ServiceCatalogManagementService {
  constructor(private readonly repository: ServiceDefinitionRepository) {}

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
   */
  async update(
    code: string,
    patch: {
      readonly displayName?: string;
      readonly enabled?: boolean;
      readonly defaultOperatingInterval?: ServiceOperatingInterval | null;
      readonly defaultDurationMinutes?: number | null;
    }
  ): Promise<ServiceCatalogUpdateOutcome> {
    if (!isServiceCode(code)) return { type: "SERVICE_NOT_FOUND" };
    const existing = await this.repository.findByCode(code);
    if (!existing) return { type: "SERVICE_NOT_FOUND" };

    const changes: {
      displayName?: string;
      enabled?: boolean;
      defaultOperatingInterval?: ServiceOperatingInterval | null;
      defaultDurationMinutes?: number | null;
    } = {};
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
    const updated = await this.repository.update(code, changes);
    return { type: "UPDATED", service: updated ?? existing };
  }
}
