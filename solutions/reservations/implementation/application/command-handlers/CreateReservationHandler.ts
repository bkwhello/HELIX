import { Result, RuleViolation, fail, ok, violation } from "../../domain/shared/Result.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { ContactReader } from "../ports/ContactReader.js";
import { ServicePeriodReader } from "../ports/ServicePeriodReader.js";
import { DuplicateReservationChecker } from "../ports/DuplicateReservationChecker.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";

export interface CreateReservationRequest {
  readonly commandId: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly servicePeriodId: string;
  readonly contactId: string;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  readonly actor: Actor;
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
}

/**
 * DTO returned across the application boundary. The aggregate itself is
 * never returned outside this layer — it is an internal domain object,
 * not an API response shape.
 */
export interface CreateReservationOutcome {
  readonly reservationId: string;
  readonly status: ReservationStatus;
  readonly warnings: readonly RuleViolation[];
}

export class CreateReservationHandler {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly duplicateChecker: DuplicateReservationChecker,
    private readonly contactReader: ContactReader,
    private readonly servicePeriodReader: ServicePeriodReader,
    private readonly idGenerator: IdGenerator,
    private readonly eventIdGenerator: EventIdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(request: CreateReservationRequest): Promise<Result<CreateReservationOutcome>> {
    // 1. Idempotency — a previous attempt at this exact command already succeeded.
    const alreadyCreated = await this.repository.findByCommandId(request.commandId);
    if (alreadyCreated) {
      return ok(toOutcome(alreadyCreated, []));
    }

    // 2. Validate request — CAP-D01.01-R08.
    if (
      request.reservationDate === undefined ||
      request.partySize === undefined ||
      !request.contactId ||
      !request.servicePeriodId ||
      !request.source
    ) {
      return fail([violation("CAP-D01.01-R08", "A reservation creation request must contain date, time, party size, contact, and source.")]);
    }

    // 3. Validate contact — CAP-D01.01-R07 (cross-capability query, not an aggregate rule).
    const contactExists = await this.contactReader.exists(request.contactId);
    if (!contactExists) {
      return fail([violation("CAP-D01.01-R07", "The referenced Reservation Contact does not exist.")]);
    }

    // 4. Validate Service Period — CAP-D01.01-R06 (cross-capability query, not an aggregate rule).
    const servicePeriod = await this.servicePeriodReader.validateReservation({
      servicePeriodId: request.servicePeriodId,
      reservationDate: request.reservationDate,
      partySize: request.partySize,
    });
    if (!servicePeriod.isValid) {
      return fail([
        violation("CAP-D01.01-R06", servicePeriod.reason ?? "The Service Period is not valid for this reservation date, time, and party size."),
      ]);
    }

    // 5. Check for a possible duplicate — CAP-D01.01-R14 (Warning, not blocking).
    const potentialDuplicateDetected = await this.duplicateChecker.check({
      contactId: request.contactId,
      reservationDate: request.reservationDate,
      partySize: request.partySize,
    });

    // 6. Create the aggregate.
    const created = ReservationAggregate.create({
      reservationId: this.idGenerator.generate(),
      eventId: this.eventIdGenerator.generate(),
      correlationId: request.correlationId ?? request.commandId,
      causationId: request.causationId,
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
    if (!created.ok) return created;

    // 7. Persist state and events atomically.
    const saveResult = await this.repository.save({
      aggregate: created.value,
      expectedVersion: created.value.getVersion(),
      commandId: request.commandId,
    });

    if (saveResult.type === "IDEMPOTENT_REPLAY") {
      // Another concurrent call with this exact commandId won the race.
      const winner = await this.repository.findByCommandId(request.commandId);
      if (!winner) {
        return fail([violation("CAP-D01.01-R44", "The reservation could not be located after a concurrent duplicate command was detected.")]);
      }
      return ok(toOutcome(winner, []));
    }
    if (saveResult.type === "CONCURRENCY_CONFLICT") {
      // A freshly generated identity cannot legitimately conflict — IdGenerator
      // guarantees uniqueness — so this only signals an infrastructure fault.
      return fail([violation("CAP-D01.01-R05", "The reservation could not be created due to an unexpected concurrent write.")]);
    }

    // 8. Return an outcome DTO — the duplicate warning is now visible to
    // the immediate caller, not just recorded on the persisted event.
    const warnings: RuleViolation[] = potentialDuplicateDetected
      ? [violation("CAP-D01.01-R14", "A potentially duplicate reservation already exists.")]
      : [];
    return ok(toOutcome(created.value, warnings));
  }
}

function toOutcome(aggregate: ReservationAggregate, warnings: readonly RuleViolation[]): CreateReservationOutcome {
  return { reservationId: aggregate.getId().toString(), status: aggregate.getStatus(), warnings };
}
