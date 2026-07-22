import { Actor } from "../value-objects/Actor.js";
import { ReservationSourceProps } from "../value-objects/ReservationSource.js";
import { CompletionEvidence } from "../value-objects/CompletionEvidence.js";
import { PreferredArea } from "../value-objects/PreferredArea.js";

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
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  /** CAP-D01.01-R48: a guest preference (e.g. Sushi counter vs Teppanyaki), never a seating guarantee. Warning severity — optional here for the same reason. */
  readonly preferredArea?: PreferredArea;
  /** CAP-D01.01-R36/R37: operational context (e.g. allergies, special requests) — never the authoritative allergy record, which belongs to Allergy and Critical Notes Management once that capability exists. */
  readonly notes?: string;
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
  };
  /** CAP-D01.01-R20: supplied by the caller after confirming the existing Service Period still holds for the new date/time. */
  readonly isServicePeriodStillValid?: boolean;
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
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
