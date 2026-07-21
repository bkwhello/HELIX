import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { Clock } from "../ports/Clock.js";

export interface ModifyReservationRequest {
  readonly commandId: string;
  readonly reservationId: string;
  readonly actor: Actor;
  readonly changes: {
    readonly reservationDate?: Date;
    readonly partySize?: number;
    readonly contactId?: string;
  };
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
}

export class ModifyReservationHandler {
  constructor(private readonly repository: ReservationRepository, private readonly clock: Clock) {}

  async handle(request: ModifyReservationRequest): Promise<Result<void>> {
    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return idResult;

    // CAP-D01.01-R15 — Existing Reservation Required
    const aggregate = await this.repository.findById(idResult.value);
    if (!aggregate) {
      return fail([violation("CAP-D01.01-R15", "A reservation modification request must reference an existing Reservation Identity.")]);
    }

    const result = aggregate.modify(
      {
        actor: request.actor,
        changes: request.changes,
        isAuthorizedCorrection: request.isAuthorizedCorrection,
        correctionReason: request.correctionReason,
      },
      this.clock.now()
    );
    if (!result.ok) return result;

    await this.repository.save(aggregate, request.commandId);
    return ok(undefined);
  }
}
