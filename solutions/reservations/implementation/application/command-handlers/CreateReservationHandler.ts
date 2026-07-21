import { Result, fail, violation } from "../../domain/shared/Result.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";

export interface CreateReservationRequest {
  readonly commandId: string;
  readonly servicePeriodId: string;
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  readonly actor: Actor;
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
}

export class CreateReservationHandler {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(request: CreateReservationRequest): Promise<Result<ReservationAggregate>> {
    // CAP-D01.01-R44 — a repeated creation command must return the
    // reservation that was actually persisted the first time, not a
    // freshly generated identity that is silently discarded.
    const existing = await this.repository.findByCommandId(request.commandId);
    if (existing) {
      return { ok: true, value: existing };
    }

    // CAP-D01.01-R08 — required creation information.
    if (
      request.reservationDate === undefined ||
      request.partySize === undefined ||
      !request.contactId ||
      !request.servicePeriodId ||
      !request.source
    ) {
      return fail([violation("CAP-D01.01-R08", "A reservation creation request must contain date, time, party size, contact, and source.")]);
    }

    // CAP-D01.01-R14 — duplicate detection happens here, outside the domain.
    const potentialDuplicateDetected = await this.repository.hasPotentialDuplicate({
      contactId: request.contactId,
      reservationDate: request.reservationDate,
      partySize: request.partySize,
    });

    const result = ReservationAggregate.create({
      reservationId: this.idGenerator.generate(),
      servicePeriodId: request.servicePeriodId,
      contactId: request.contactId,
      reservationDate: request.reservationDate,
      partySize: request.partySize,
      source: request.source,
      actor: request.actor,
      now: this.clock.now(),
      isHistoricalCorrection: request.isHistoricalCorrection,
      historicalCorrectionReason: request.historicalCorrectionReason,
      potentialDuplicateDetected,
    });

    if (!result.ok) {
      return result;
    }

    await this.repository.save(result.value, request.commandId);
    return result;
  }
}
