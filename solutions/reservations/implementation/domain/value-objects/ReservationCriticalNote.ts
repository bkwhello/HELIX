import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * R1.3-I3 — CAP-D05.02 (Allergy and Critical Note Management) foundation.
 *
 * Deliberately a two-member closed type, not an open string: "Allergy"
 * singles out the one category this capability's own purpose names
 * explicitly ("prominently expose allergy information"); "Critical"
 * covers every other critical operational note without inventing a
 * taxonomy nothing has asked for yet. No severity scoring, medical
 * diagnosis, or automated risk interpretation — see the R1.6-P1B13
 * design gate's own explicit exclusion.
 */
export const CriticalNoteType = {
  Allergy: "Allergy",
  Critical: "Critical",
} as const;

export type CriticalNoteType = (typeof CriticalNoteType)[keyof typeof CriticalNoteType];

const VALID_NOTE_TYPES: readonly string[] = Object.values(CriticalNoteType);

export function isCriticalNoteType(value: unknown): value is CriticalNoteType {
  return typeof value === "string" && VALID_NOTE_TYPES.includes(value);
}

export const CriticalNoteStatus = {
  Active: "Active",
  Resolved: "Resolved",
} as const;

export type CriticalNoteStatus = (typeof CriticalNoteStatus)[keyof typeof CriticalNoteStatus];

const MAX_DETAIL_LENGTH = 500;

/**
 * CAP-D05.02-R01 — Critical Note Detail Must Be Trimmed and Bounded
 *
 * Detail shall be non-empty after trimming leading/trailing whitespace,
 * and no longer than 500 characters. This is deliberately still free
 * text INSIDE a typed, attributed, visibly-distinct record — AC31
 * (CAP-D01.01) objects to allergy information being reduced to
 * unstructured notes, not to prose existing at all once it is owned by
 * this structure. The stored value is the trimmed form, never the raw
 * (possibly padded) input — this constructor is the only place that
 * decides what "the detail" actually is.
 */
export class CriticalNoteDetail {
  private constructor(private readonly value: string) {}

  static create(raw: string): Result<CriticalNoteDetail> {
    if (typeof raw !== "string") {
      return fail([violation("CAP-D05.02-R01", "Critical note detail must be a string.")]);
    }
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
      return fail([violation("CAP-D05.02-R01", "Critical note detail must not be empty.")]);
    }
    if (trimmed.length > MAX_DETAIL_LENGTH) {
      return fail([violation("CAP-D05.02-R01", `Critical note detail must be ${MAX_DETAIL_LENGTH} characters or fewer.`)]);
    }
    return ok(new CriticalNoteDetail(trimmed));
  }

  toString(): string {
    return this.value;
  }
}

/**
 * CAP-D05.02-R02 — Critical Note Type Must Be a Registered Category
 */
export function validateCriticalNoteType(raw: unknown): Result<CriticalNoteType> {
  if (!isCriticalNoteType(raw)) {
    return fail([violation("CAP-D05.02-R02", `noteType must be one of: ${VALID_NOTE_TYPES.join(", ")}.`)]);
  }
  return ok(raw);
}

/** Typed, already-validated shape used by both the ReservationCreated event payload and repository insert instructions — never raw client input. */
export interface CriticalNoteInput {
  readonly noteType: CriticalNoteType;
  readonly detail: string;
}

/** Validates a full array of create-time critical note inputs, collecting every violation (never short-circuiting on the first) so a caller can report all of them at once. */
export function validateCriticalNoteInputs(raw: ReadonlyArray<{ readonly noteType?: unknown; readonly detail?: unknown }>): Result<readonly CriticalNoteInput[]> {
  const violations = [];
  const validated: CriticalNoteInput[] = [];
  for (const entry of raw) {
    const typeResult = validateCriticalNoteType(entry.noteType);
    const detailResult = CriticalNoteDetail.create(entry.detail as string);
    if (!typeResult.ok) violations.push(...typeResult.violations);
    if (!detailResult.ok) violations.push(...detailResult.violations);
    if (typeResult.ok && detailResult.ok) {
      validated.push({ noteType: typeResult.value, detail: detailResult.value.toString() });
    }
  }
  if (violations.length > 0) {
    return fail(violations);
  }
  return ok(validated);
}
