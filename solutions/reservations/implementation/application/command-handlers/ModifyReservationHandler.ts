import { Result, fail, ok, violation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { ServicePeriodReader } from "../ports/ServicePeriodReader.js";
import { deriveServiceCode } from "../../domain/availability/Service.js";

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
    private readonly clock: Clock,
    /**
     * R1.6-P2B — required, mirroring CreateReservationHandler's own
     * mandatory ServicePeriodReader dependency (never optional-last here:
     * this closes a real "client, not server, was authoritative" gap —
     * an optional/no-op default would silently reintroduce it for any
     * caller that omitted the parameter).
     */
    private readonly servicePeriodReader: ServicePeriodReader
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

    // R1.6-P2B — server-authoritative Service-code handling, resolved
    // BEFORE aggregate.modify()/repository.save() are ever called, so a
    // rejection here mutates nothing (the surrounding transaction, when
    // one exists — see AvailabilityOrchestrator.modifyWithCapacity — rolls
    // back entirely on a failed Result, exactly like every other
    // validation failure in that method).
    //
    //   - date changing + servicePeriodId explicitly supplied: validate
    //     it against the NEW effective date; a mismatch rejects.
    //   - date changing + servicePeriodId omitted: derive the correct
    //     canonical code automatically and inject it into the changes
    //     passed to the aggregate — the existing CAP-D01.01-R20 rule
    //     (ModificationRules.requiresServicePeriodRevalidation) then sees
    //     an explicit value, exactly as if the caller had supplied it.
    //   - date NOT changing + servicePeriodId explicitly supplied:
    //     validate it against the CURRENT (unchanged) effective date; a
    //     mismatch still rejects — an explicit value is always checked.
    //   - date NOT changing + servicePeriodId omitted: untouched. A
    //     historical/legacy noncanonical value is never rewritten merely
    //     because some OTHER field changed.
    let changes = request.changes;
    const dateChanging = request.changes.reservationDate !== undefined;
    const effectiveDate = request.changes.reservationDate ?? aggregate.getReservationDateTime();

    if (request.changes.servicePeriodId !== undefined) {
      const validation = await this.servicePeriodReader.validateReservation({
        servicePeriodId: request.changes.servicePeriodId,
        reservationDate: effectiveDate,
        partySize: request.changes.partySize ?? aggregate.getPartySize(),
      });
      if (!validation.isValid) {
        return fail([
          violation("CAP-D01.01-R06", validation.reason ?? "The Service Period is not valid for this reservation date, time, and party size."),
        ]);
      }
    } else if (dateChanging) {
      changes = { ...request.changes, servicePeriodId: deriveServiceCode(effectiveDate) };
    }

    const result = aggregate.modify(
      {
        eventId: this.eventIdGenerator.generate(),
        correlationId: request.correlationId ?? request.commandId,
        causationId: request.causationId,
        actor: request.actor,
        changes,
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
