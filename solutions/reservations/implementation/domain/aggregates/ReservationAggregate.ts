import { Result, RuleViolation, ok, fail } from "../shared/Result.js";
import { ReservationId } from "../value-objects/ReservationId.js";
import { ReservationStatus } from "../value-objects/ReservationStatus.js";
import { PartySize } from "../value-objects/PartySize.js";
import { ReservationDateTime } from "../value-objects/ReservationDateTime.js";
import { ReservationSource } from "../value-objects/ReservationSource.js";
import {
  CreateReservationCommand,
  ModifyReservationCommand,
  ConfirmReservationCommand,
  CancelReservationCommand,
  CompleteReservationCommand,
} from "../commands/ReservationCommands.js";
import { ReservationDomainEvent } from "../events/ReservationEvents.js";
import { checkCreationRules, checkDuplicateWarning } from "../rules/CreationRules.js";
import { checkModificationRules, requiresServicePeriodRevalidation } from "../rules/ModificationRules.js";
import { checkConfirmationRules } from "../rules/ConfirmationRules.js";
import { checkCancellationRules } from "../rules/CancellationRules.js";
import { checkCompletionRules } from "../rules/CompletionRules.js";
import {
  checkModificationAuthorization,
  checkCancellationAuthorization,
  checkCompletionAuthorization,
} from "../rules/AuthorizationRules.js";

/**
 * CAP-D01.01 — Reservation Management
 *
 * The aggregate enforces business behaviour only. It has no knowledge of
 * databases, HTTP, REST, GraphQL, queues, or UI (see capability.md,
 * Out of Scope, and the Phase 3 engineering brief for this capability).
 */
export class ReservationAggregate {
  private pendingEvents: ReservationDomainEvent[] = [];

  private constructor(
    private readonly id: ReservationId,
    private status: ReservationStatus,
    private servicePeriodId: string,
    private contactId: string,
    private dateTime: ReservationDateTime,
    private partySize: PartySize,
    private readonly source: ReservationSource,
    private readonly createdBy: string,
    private readonly createdAt: Date
  ) {}

  /**
   * Rebuilds an aggregate from previously persisted state. Unlike
   * create(), this never emits CAP-D01.01-E01 — it is reconstruction,
   * not a new business fact. Used only by repository adapters.
   */
  static reconstitute(props: {
    id: string;
    status: ReservationStatus;
    servicePeriodId: string;
    contactId: string;
    reservationDate: Date;
    partySize: number;
    source: import("../value-objects/ReservationSource.js").ReservationSourceProps;
    createdBy: string;
    createdAt: Date;
  }): ReservationAggregate {
    const id = ReservationId.create(props.id);
    const dateTime = ReservationDateTime.create(props.reservationDate);
    const partySize = PartySize.create(props.partySize);
    const source = ReservationSource.create(props.source);

    if (!id.ok || !dateTime.ok || !partySize.ok || !source.ok) {
      throw new Error("Cannot reconstitute ReservationAggregate: persisted data violates value object invariants.");
    }

    return new ReservationAggregate(
      id.value,
      props.status,
      props.servicePeriodId,
      props.contactId,
      dateTime.value,
      partySize.value,
      source.value,
      props.createdBy,
      props.createdAt
    );
  }

  // ---------------------------------------------------------------------
  // Creation
  // ---------------------------------------------------------------------

  /** CAP-D01.01-E01 — creates a new reservation in the Proposed state. */
  static create(cmd: CreateReservationCommand): Result<ReservationAggregate> {
    const idResult = ReservationId.create(cmd.reservationId);
    const dateTimeResult = ReservationDateTime.create(cmd.reservationDate);
    const partySizeResult = PartySize.create(cmd.partySize);
    const sourceResult = ReservationSource.create(cmd.source);

    const violations: RuleViolation[] = [];
    for (const r of [idResult, dateTimeResult, partySizeResult, sourceResult]) {
      if (!r.ok) violations.push(...r.violations);
    }
    if (violations.length > 0) {
      return fail(violations);
    }
    // Type-narrowed after the loop above confirmed every result is ok.
    const id = (idResult as { ok: true; value: ReservationId }).value;
    const dateTime = (dateTimeResult as { ok: true; value: ReservationDateTime }).value;
    const partySize = (partySizeResult as { ok: true; value: PartySize }).value;
    const source = (sourceResult as { ok: true; value: ReservationSource }).value;

    const ruleViolations = checkCreationRules({
      dateTime,
      now: cmd.now,
      actor: cmd.actor,
      isHistoricalCorrection: cmd.isHistoricalCorrection,
      historicalCorrectionReason: cmd.historicalCorrectionReason,
      potentialDuplicateDetected: cmd.potentialDuplicateDetected,
    });
    if (ruleViolations.length > 0) {
      return fail(ruleViolations);
    }

    const aggregate = new ReservationAggregate(
      id,
      ReservationStatus.Proposed,
      cmd.servicePeriodId,
      cmd.contactId,
      dateTime,
      partySize,
      source,
      cmd.actor.id,
      cmd.now
    );

    // CAP-D01.01-R14 is a Warning, not a blocking violation — surfaced
    // as an event annotation rather than a rejection.
    const duplicateWarning = checkDuplicateWarning({
      dateTime,
      now: cmd.now,
      actor: cmd.actor,
      potentialDuplicateDetected: cmd.potentialDuplicateDetected,
    });

    aggregate.pendingEvents.push({
      type: "ReservationCreated",
      reservationId: id.toString(),
      occurredAt: cmd.now,
      servicePeriodId: cmd.servicePeriodId,
      contactId: cmd.contactId,
      reservationDate: dateTime.toDate(),
      partySize: partySize.toNumber(),
      reservationSource: source.category,
      createdBy: cmd.actor.id,
      externalReference: source.externalReference,
      importedBy: source.importedBy,
    });

    return ok(aggregate);
    // duplicateWarning is intentionally not thrown away silently by callers:
    // application-layer command handlers should log/surface it (see
    // application/command-handlers/CreateReservationHandler.ts).
    void duplicateWarning;
  }

  // ---------------------------------------------------------------------
  // Modification
  // ---------------------------------------------------------------------

  /** CAP-D01.01-E02 */
  modify(cmd: ModifyReservationCommand, now: Date): Result<void> {
    const changedFields = Object.keys(cmd.changes).filter(
      (k) => (cmd.changes as Record<string, unknown>)[k] !== undefined
    );

    const violations: RuleViolation[] = [
      ...checkModificationAuthorization(cmd.actor),
      ...checkModificationRules({
        currentStatus: this.status,
        isAuthorizedCorrection: cmd.isAuthorizedCorrection,
        correctionReason: cmd.correctionReason,
        changedFields,
      }),
    ];

    const previousValues: Record<string, unknown> = {};
    const resultingValues: Record<string, unknown> = {};

    if (cmd.changes.reservationDate !== undefined) {
      const dateTimeResult = ReservationDateTime.create(cmd.changes.reservationDate);
      if (!dateTimeResult.ok) {
        violations.push(...dateTimeResult.violations);
      } else {
        previousValues["reservationDate"] = this.dateTime.toDate();
        resultingValues["reservationDate"] = dateTimeResult.value.toDate();
      }
    }

    if (cmd.changes.partySize !== undefined) {
      const partySizeResult = PartySize.create(cmd.changes.partySize);
      if (!partySizeResult.ok) {
        violations.push(...partySizeResult.violations);
      } else {
        previousValues["partySize"] = this.partySize.toNumber();
        resultingValues["partySize"] = partySizeResult.value.toNumber();
      }
    }

    if (cmd.changes.contactId !== undefined) {
      previousValues["contactId"] = this.contactId;
      resultingValues["contactId"] = cmd.changes.contactId;
    }

    if (violations.length > 0) {
      return fail(violations);
    }

    // All changes validated — apply atomically (CAP-D01.01-R05).
    if (cmd.changes.reservationDate !== undefined) {
      const r = ReservationDateTime.create(cmd.changes.reservationDate);
      if (r.ok) this.dateTime = r.value;
    }
    if (cmd.changes.partySize !== undefined) {
      const r = PartySize.create(cmd.changes.partySize);
      if (r.ok) this.partySize = r.value;
    }
    if (cmd.changes.contactId !== undefined) {
      this.contactId = cmd.changes.contactId;
    }

    this.pendingEvents.push({
      type: "ReservationModified",
      reservationId: this.id.toString(),
      occurredAt: now,
      changedFields,
      previousValues,
      resultingValues,
      actor: cmd.actor.id,
      reason: cmd.correctionReason,
    });

    return ok(undefined);
  }

  /** CAP-D01.01-R20 — call after a date/time change to know whether Service Period must be revalidated. */
  needsServicePeriodRevalidation(changedFields: readonly string[]): boolean {
    return requiresServicePeriodRevalidation(changedFields);
  }

  // ---------------------------------------------------------------------
  // Confirmation
  // ---------------------------------------------------------------------

  /** CAP-D01.01-E03 */
  confirm(cmd: ConfirmReservationCommand, now: Date, isReservationDataValid: boolean): Result<void> {
    const violations = checkConfirmationRules({ currentStatus: this.status, isReservationDataValid });
    if (violations.length > 0) {
      return fail(violations);
    }

    this.status = ReservationStatus.Confirmed;
    this.pendingEvents.push({
      type: "ReservationConfirmed",
      reservationId: this.id.toString(),
      occurredAt: now,
      actor: cmd.actor.id,
    });
    return ok(undefined);
  }

  // ---------------------------------------------------------------------
  // Cancellation
  // ---------------------------------------------------------------------

  /** CAP-D01.01-E04 */
  cancel(cmd: CancelReservationCommand, now: Date): Result<void> {
    const violations: RuleViolation[] = [
      ...checkCancellationAuthorization(cmd.actor),
      ...checkCancellationRules({
        currentStatus: this.status,
        cancelReason: cmd.reason,
        reasonRequiredByPolicy: cmd.reasonRequiredByPolicy,
      }),
    ];
    if (violations.length > 0) {
      return fail(violations);
    }

    this.status = ReservationStatus.Cancelled;
    this.pendingEvents.push({
      type: "ReservationCancelled",
      reservationId: this.id.toString(),
      occurredAt: now,
      cancelReason: cmd.reason,
      cancelledBy: cmd.actor.id,
    });
    return ok(undefined);
  }

  // ---------------------------------------------------------------------
  // Completion
  // ---------------------------------------------------------------------

  /** CAP-D01.01-E05 */
  complete(cmd: CompleteReservationCommand, now: Date): Result<void> {
    const violations: RuleViolation[] = [
      ...checkCompletionAuthorization(cmd.actor),
      ...checkCompletionRules({
        currentStatus: this.status,
        hasOperationalEvidence: cmd.hasOperationalEvidence,
        isManualCompletion: cmd.isManualCompletion,
        manualCompletionReason: cmd.manualCompletionReason,
      }),
    ];
    if (violations.length > 0) {
      return fail(violations);
    }

    this.status = ReservationStatus.Completed;
    this.pendingEvents.push({
      type: "ReservationCompleted",
      reservationId: this.id.toString(),
      occurredAt: now,
      actor: cmd.actor.id,
      evidence: cmd.isManualCompletion ? cmd.manualCompletionReason : undefined,
    });
    return ok(undefined);
  }

  // ---------------------------------------------------------------------
  // Read access / event drain
  // ---------------------------------------------------------------------

  getId(): ReservationId {
    return this.id;
  }

  getStatus(): ReservationStatus {
    return this.status;
  }

  getServicePeriodId(): string {
    return this.servicePeriodId;
  }

  getContactId(): string {
    return this.contactId;
  }

  getPartySize(): number {
    return this.partySize.toNumber();
  }

  getReservationDateTime(): Date {
    return this.dateTime.toDate();
  }

  /** Drains and returns events recorded since the aggregate was loaded. The repository calls this after a successful save. */
  pullEvents(): ReservationDomainEvent[] {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }
}
