import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { Clock } from "../ports/Clock.js";

export interface CancelReservationRequest {
  readonly commandId: string;
  readonly reservationId: string;
  readonly actor: Actor;
  readonly reason?: string;
  readonly reasonRequiredByPolicy?: boolean;
}

export class CancelReservationHandler {
  constructor(private readonly repository: ReservationRepository, private readonly clock: Clock) {}

  async handle(request: CancelReservationRequest): Promise<Result<void>> {
    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return idResult;

    const aggregate = await this.repository.findById(idResult.value);
    if (!aggregate) {
      return fail([violation("CAP-D01.01-R15", "A cancellation request must reference an existing Reservation Identity.")]);
    }

    const result = aggregate.cancel(
      { actor: request.actor, reason: request.reason, reasonRequiredByPolicy: request.reasonRequiredByPolicy },
      this.clock.now()
    );
    if (!result.ok) return result;

    await this.repository.save(aggregate, request.commandId);
    return ok(undefined);
  }
}
