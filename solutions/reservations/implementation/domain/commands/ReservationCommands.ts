import { Actor } from "../value-objects/Actor.js";
import { ReservationSourceProps } from "../value-objects/ReservationSource.js";

export interface CreateReservationCommand {
  readonly reservationId: string;
  readonly servicePeriodId: string;
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  readonly actor: Actor;
  readonly now: Date;
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
  readonly potentialDuplicateDetected?: boolean;
}

export interface ModifyReservationCommand {
  readonly actor: Actor;
  readonly changes: {
    readonly reservationDate?: Date;
    readonly partySize?: number;
    readonly contactId?: string;
  };
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
}

export interface ConfirmReservationCommand {
  readonly actor: Actor;
}

export interface CancelReservationCommand {
  readonly actor: Actor;
  readonly reason?: string;
  readonly reasonRequiredByPolicy?: boolean;
}

export interface CompleteReservationCommand {
  readonly actor: Actor;
  readonly hasOperationalEvidence: boolean;
  readonly isManualCompletion?: boolean;
  readonly manualCompletionReason?: string;
}
