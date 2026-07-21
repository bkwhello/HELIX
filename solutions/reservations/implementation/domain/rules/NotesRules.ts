import { RuleViolation, violation } from "../shared/Result.js";

const STRUCTURED_FIELDS = new Set([
  "date",
  "time",
  "partySize",
  "contact",
  "allergyInformation",
  "reservationStatus",
  "servicePeriod",
  "reservationSource",
]);

/**
 * CAP-D01.01-R36 — Notes Shall Not Replace Structured Information
 *
 * Reservation Notes are free text; this rule is enforced by never
 * allowing a note-setting operation to also set one of the structured
 * fields listed above.
 */
export function checkNoteDoesNotReplaceStructuredField(targetField: string): RuleViolation[] {
  if (STRUCTURED_FIELDS.has(targetField)) {
    return [violation("CAP-D01.01-R36", `"${targetField}" is a structured field and cannot be set through a note.`)];
  }
  return [];
}

/**
 * CAP-D01.01-R37 — Critical Information Must Be Owned by the Correct Capability
 *
 * Reservation Management may reference allergy information but never
 * redefines its authoritative meaning. Enforced by omission: the
 * Reservation aggregate has no field that stores authoritative allergy
 * data, only an optional reference id owned by Allergy and Critical
 * Notes Management.
 */
export interface NoteChange {
  readonly actor: string;
  readonly timestamp: Date;
}

/** CAP-D01.01-R38 — Notes Require Change Attribution */
export function checkNoteAttribution(change: NoteChange): RuleViolation[] {
  if (!change.actor || change.actor.trim().length === 0) {
    return [violation("CAP-D01.01-R38", "Creation, modification, or removal of a note affecting service decisions must be attributable.")];
  }
  return [];
}
