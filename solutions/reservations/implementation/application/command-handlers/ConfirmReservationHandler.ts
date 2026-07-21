import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";

export interface ConfirmReservationRequest {
  readonly commandId: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly reservationId: string;
  readonly actor: Actor;
  /** CAP-D01.01-R23: supplied by the caller, e.g. after re-checking required fields. */
  readonly isReservationDataValid: boolean;
}

export class ConfirmReservationHandler {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventIdGenerator: EventIdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(request: ConfirmReservationRequest): Promise<Result<void>> {
    // CAP-D01.01-R44 — a retried command that already succeeded is a no-op.
    const alreadyApplied = await this.repository.findByCommandId(request.commandId);
    if (alreadyApplied) {
      return ok(undefined);
    }

    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return idResult;

    const aggregate = await this.repository.findById(idResult.value);
    if (!aggregate) {
      return fail([violation("CAP-D01.01-R15", "A reservation confirmation request must reference an existing Reservation Identity.")]);
    }

    const result = aggregate.confirm(
      {
        eventId: this.eventIdGenerator.generate(),
        correlationId: request.correlationId ?? request.commandId,
        causationId: request.causationId,
        actor: request.actor,
      },
      this.clock.now(),
      request.isReservationDataValid
    );
    if (!result.ok) return result;

    const saveResult = await this.repository.save({
      aggregate,
      expectedVersion: aggregate.getVersion(),
      commandId: request.commandId,
    });
    if (saveResult.type === "CONCURRENCY_CONFLICT") {
      return fail([violation("CAP-D01.01-R05", "The reservation was modified concurrently by another command. Reload and retry.")]);
    }
    return ok(undefined);
  }
}
