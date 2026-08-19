import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

export interface ModifyReservationRequest {
  readonly commandId: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly reservationId: string;
  readonly actor: Actor;
  readonly changes: {
    readonly reservationDate?: Date;
    readonly partySize?: number;
    readonly contactId?: string;
    readonly contactName?: string;
    readonly contactPhoneSnapshot?: string;
    readonly contactEmailSnapshot?: string;
    readonly source?: ReservationSourceProps;
    readonly servicePeriodId?: string;
    readonly tableAssignment?: string;
    readonly notes?: string;
    readonly preferredArea?: PreferredArea;
    readonly arrivedAt?: Date | null;
  };
  readonly isServicePeriodStillValid?: boolean;
  readonly isAuthorizedCorrection?: boolean;
  readonly correctionReason?: string;
  /** CAP-D02.03 — see CreateReservationRequest.tx. */
  readonly tx?: TransactionContext;
}

export class ModifyReservationHandler {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly eventIdGenerator: EventIdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(request: ModifyReservationRequest): Promise<Result<void>> {
    // CAP-D01.01-R44 — a retried command that already succeeded is a no-op.
    const alreadyApplied = await this.repository.findByCommandId(request.commandId);
    if (alreadyApplied) {
      return ok(undefined);
    }

    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return idResult;

    // CAP-D01.01-R15 — Existing Reservation Required
    const aggregate = await this.repository.findById(idResult.value);
    if (!aggregate) {
      return fail([violation("CAP-D01.01-R15", "A reservation modification request must reference an existing Reservation Identity.")]);
    }

    const result = aggregate.modify(
      {
        eventId: this.eventIdGenerator.generate(),
        correlationId: request.correlationId ?? request.commandId,
        causationId: request.causationId,
        actor: request.actor,
        changes: request.changes,
        isServicePeriodStillValid: request.isServicePeriodStillValid,
        isAuthorizedCorrection: request.isAuthorizedCorrection,
        correctionReason: request.correctionReason,
      },
      this.clock.now()
    );
    if (!result.ok) return result;

    const saveResult = await this.repository.save({
      aggregate,
      expectedVersion: aggregate.getVersion(),
      commandId: request.commandId,
      tx: request.tx,
    });
    if (saveResult.type === "CONCURRENCY_CONFLICT") {
      return fail([violation("CAP-D01.01-R05", "The reservation was modified concurrently by another command. Reload and retry.")]);
    }
    return ok(undefined);
  }
}
