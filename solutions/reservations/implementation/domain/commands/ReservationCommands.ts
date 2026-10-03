import { Actor } from "../value-objects/Actor.js";
import { ReservationSourceProps } from "../value-objects/ReservationSource.js";
import { CompletionEvidence } from "../value-objects/CompletionEvidence.js";
import { PreferredArea } from "../value-objects/PreferredArea.js";
import { CommunicationLanguage } from "../value-objects/CommunicationLanguage.js";
import { CriticalNoteType } from "../value-objects/ReservationCriticalNote.js";

/** R1.3-I3 — a single create-time critical note, already validated (CAP-D05.02-R01/R02) and id-assigned by the caller (the same "handler pre-generates identity" convention CreateReservationCommand.reservationId itself already uses) BEFORE this command is built. The aggregate never generates ids. */
export interface CriticalNoteCreateInput {
  readonly id: string;
  readonly noteType: CriticalNoteType;
  readonly detail: string;
}

/** R1.3-I3 — a typed, point-in-time snapshot of one critical note, used ONLY to let ReservationAggregate.modify() stamp a complete, reconstructable `criticalNotes` entry onto the resulting ReservationModified event. Never used for persistence decisions — those are made by the caller before this command is built, using the SAME pre-read state this snapshot is drawn from. */
export interface CriticalNoteSnapshot {
  readonly id: string;
  readonly noteType: CriticalNoteType;
  readonly detail: string;
  readonly status: "Active" | "Resolved";
}

/**
 * Fields every domain command carries so the resulting event can be
 * stamped with a stable envelope (event-model.md §4, §15 Event
 * Correlation). `eventId` is minted once per command by the application
 * layer (EventIdGenerator) — a command produces at most one event in
 * this lifecycle model, so command and event identity are 1:1 here.
 */
interface CommandEnvelope {
  readonly eventId: string;
  readonly correlationId: string;
  readonly causationId?: string;
}

export interface CreateReservationCommand extends CommandEnvelope {
  readonly reservationId: string;
  readonly servicePeriodId: string;
  readonly contactId: string;
  /** CAP-D01.01-R07: "Additional guest or contact information may exist" alongside the primary contact identity. Not required by R08 — the pilot UI enforces it operationally, not the domain. */
  readonly contactName?: string;
  /** CAP-D05.01 — reservation-time contact snapshots (assignment §7/§8). Captured from the resolved Contact at booking time; later Contact edits must not rewrite these. */
  readonly contactPhoneSnapshot?: string;
  readonly contactEmailSnapshot?: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  /** CAP-D01.01-R48: a guest preference (e.g. Sushi counter vs Teppanyaki), never a seating guarantee. Warning severity — optional here for the same reason. */
  readonly preferredArea?: PreferredArea;
  /** CAP-D01.01-R36/R37: operational context (e.g. allergies, special requests) — never the authoritative allergy record; see CAP-D05.02-owned `criticalNotes` below for that. */
  readonly notes?: string;
  /** R1.3-I3 — CAP-D05.02. Every entry is a new Active note; omitted means none created. Already-validated, id-assigned inputs — see CriticalNoteCreateInput's own doc comment. */
  readonly criticalNotes?: ReadonlyArray<CriticalNoteCreateInput>;
  /** R1.6-B — guest-facing communication language (assignment §3/§4). Absent only on a legacy/internal path predating this concept; defaulted to DEFAULT_COMMUNICATION_LANGUAGE by ReservationAggregate.create(), never inferred. */
  readonly communicationLanguage?: CommunicationLanguage;
  readonly actor: Actor;
  readonly now: Date;
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
  readonly potentialDuplicateDetected?: boolean;
}

export interface ModifyReservationCommand extends CommandEnvelope {
  readonly actor: Actor;
  readonly changes: {
    readonly reservationDate?: Date;
    readonly partySize?: number;
    readonly contactId?: string;
    /** CAP-D01.01-R07: a mis-noted guest name is exactly the kind of correction staff need to make. */
    readonly contactName?: string;
    /** CAP-D05.01 — the same kind of staff correction as contactName, applied to this reservation's own snapshot only. Does not re-validate against or write back to the Contact record — see rule-model.md CAP-D05.01-R04. */
    readonly contactPhoneSnapshot?: string;
    readonly contactEmailSnapshot?: string;
    /** CAP-D01.01-R12: e.g. staff logged it as Telephone but it was actually a Google booking. */
    readonly source?: ReservationSourceProps;
    /** CAP-D01.01-R20: a revalidated Service Period for a date/time change, or a standalone correction. */
    readonly servicePeriodId?: string;
    /** CAP-D01.01-R48: a manual, staff-entered table note (e.g. "C1") — not a Seating Assignment guarantee, which stays owned elsewhere once that capability exists. */
    readonly tableAssignment?: string;
    /** CAP-D01.01-R36/R37: added or corrected after creation, e.g. "put it on the bill" or a wish mentioned in a follow-up call. */
    readonly notes?: string;
    /** CAP-D01.01-R48: a guest can change their mind, or staff learn the real preference after creation. */
    readonly preferredArea?: PreferredArea;
    /** Operational arrival marker. `null` explicitly clears a mistaken mark; `undefined` (omitted) leaves it untouched. */
    readonly arrivedAt?: Date | null;
  };
  /** CAP-D01.01-R20: supplied by the caller after confirming the existing Service Period still holds for the new date/time. */
  readonly isServicePeriodStillValid?: boolean;
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
  /**
   * R1.3-I3 — CAP-D05.02. True only when a real (non-empty) critical-note
   * add/update/resolve was requested AND already validated by the caller
   * (ModifyReservationHandler) against a fresh pre-read of this
   * reservation's current notes — this command never re-validates
   * identity/lifecycle rules itself. When true,
   * `previousCriticalNotes`/`resultingCriticalNotes` must both be
   * supplied so `modify()` can stamp a complete `criticalNotes` entry
   * onto the resulting event; when false/omitted, no critical-note
   * change occurred and neither snapshot is read.
   */
  readonly criticalNotesChanged?: boolean;
  readonly previousCriticalNotes?: ReadonlyArray<CriticalNoteSnapshot>;
  readonly resultingCriticalNotes?: ReadonlyArray<CriticalNoteSnapshot>;
}

export interface ConfirmReservationCommand extends CommandEnvelope {
  readonly actor: Actor;
}

export interface CancelReservationCommand extends CommandEnvelope {
  readonly actor: Actor;
  readonly reason?: string;
  readonly reasonRequiredByPolicy?: boolean;
}

export interface CompleteReservationCommand extends CommandEnvelope {
  readonly actor: Actor;
  /** CAP-D01.01-R30: evidence the visit concluded. Absent only for a manual completion (see manualCompletionReason). */
  readonly evidence?: CompletionEvidence;
  readonly isManualCompletion?: boolean;
  readonly manualCompletionReason?: string;
}
