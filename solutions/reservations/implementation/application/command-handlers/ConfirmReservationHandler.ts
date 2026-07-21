import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { Clock } from "../ports/Clock.js";

export interface ConfirmReservationRequest {
  readonly commandId: string;
  readonly reservationId: string;
  readonly actor: Actor;
  /** CAP-D01.01-R23: supplied by the caller, e.g. after re-checking required fields. */
  readonly isReservationDataValid: boolean;
}

export class ConfirmReservationHandler {
  constructor(private readonly repository: ReservationRepository, private readonly clock: Clock) {}

  async handle(request: ConfirmReservationRequest): Promise<Result<void>> {
    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return idResult;

    const aggregate = await this.repository.findById(idResult.value);
    if (!aggregate) {
      return fail([violation("CAP-D01.01-R15", "A reservation confirmation request must reference an existing Reservation Identity.")]);
    }

    const result = aggregate.confirm({ actor: request.actor }, this.clock.now(), request.isReservationDataValid);
    if (!result.ok) return result;

    await this.repository.save(aggregate, request.commandId);
    return ok(undefined);
  }
}
