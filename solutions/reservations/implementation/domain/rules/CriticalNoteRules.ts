import { RuleViolation, violation } from "../shared/Result.js";
import { CriticalNoteStatus } from "../value-objects/ReservationCriticalNote.js";

/** The subset of a persisted ReservationCriticalNote row this module needs to validate against — never the full repository record shape, which also carries actor/timestamp fields irrelevant here. */
export interface ExistingCriticalNote {
  readonly id: string;
  readonly status: CriticalNoteStatus;
}

export interface CriticalNoteChangeRequest {
  readonly add: ReadonlyArray<{ readonly noteType: unknown; readonly detail: unknown }>;
  readonly update: ReadonlyArray<{ readonly id: string; readonly noteType: unknown; readonly detail: unknown }>;
  readonly resolve: ReadonlyArray<{ readonly id: string }>;
}

/**
 * R1.3-I3 — CAP-D05.02-R03/R04. Validates the `update`/`resolve` portion
 * of a critical-note change set against the Reservation's CURRENT
 * (freshly read, pre-transaction) notes — never against stale or assumed
 * state. Per-field type/length validation (CAP-D05.02-R01/R02) is a
 * SEPARATE concern, handled by `validateCriticalNoteInputs`/
 * `CriticalNoteDetail.create` — this module only checks identity and
 * lifecycle-state rules that require already-persisted context:
 *
 *   - CAP-D05.02-R03 — an `update`/`resolve` id must reference a note
 *     that both (a) exists and belongs to THIS reservation, and (b) is
 *     currently Active. An unknown id, a cross-reservation id (never
 *     present in `existingNotes` to begin with, since the caller only
 *     loads notes scoped to one reservation), and an already-Resolved
 *     id are deliberately NOT distinguished at this external boundary —
 *     the same "missing and disabled/invalid share one outcome" posture
 *     `CanonicalServicePeriodReader` already established for a different
 *     capability.
 *   - CAP-D05.02-R04 — an id may occur only once across the ENTIRE
 *     change set (within `update`, within `resolve`, and between the
 *     two) — never both updated and resolved in the same request, and
 *     never listed twice within the same array.
 *
 * Returns every violation found, never short-circuiting on the first —
 * matching `validateCriticalNoteInputs`'s own "collect all, fail once"
 * posture.
 */
export function validateCriticalNoteChangeIdentities(
  request: Pick<CriticalNoteChangeRequest, "update" | "resolve">,
  existingNotes: readonly ExistingCriticalNote[]
): readonly RuleViolation[] {
  const violations: RuleViolation[] = [];
  const existingById = new Map(existingNotes.map((n) => [n.id, n] as const));

  const seenIds = new Map<string, number>();
  const touchedIds = [...request.update.map((u) => u.id), ...request.resolve.map((r) => r.id)];
  for (const id of touchedIds) {
    seenIds.set(id, (seenIds.get(id) ?? 0) + 1);
  }
  const duplicateIds = [...seenIds.entries()].filter(([, count]) => count > 1).map(([id]) => id);
  if (duplicateIds.length > 0) {
    violations.push(
      violation("CAP-D05.02-R04", `Each critical note id may appear only once in a single change set. Duplicated: ${duplicateIds.join(", ")}.`)
    );
  }

  for (const id of touchedIds) {
    const existing = existingById.get(id);
    if (!existing || existing.status !== CriticalNoteStatus.Active) {
      violations.push(violation("CAP-D05.02-R03", `Critical note "${id}" does not reference an Active note on this reservation.`));
    }
  }

  return violations;
}
