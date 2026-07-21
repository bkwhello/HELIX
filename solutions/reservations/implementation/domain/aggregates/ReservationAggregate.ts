import { Result, RuleViolation, ok, fail, violation } from "../shared/Result.js";
import { ReservationId } from "../value-objects/ReservationId.js";
import { ReservationStatus } from "../value-objects/ReservationStatus.js";
import { PartySize } from "../value-objects/PartySize.js";
import { ReservationDateTime } from "../value-objects/ReservationDateTime.js";
import { ReservationSource } from "../value-objects/ReservationSource.js";
import { Actor } from "../value-objects/Actor.js";
import { PreferredArea } from "../value-objects/PreferredArea.js";
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
  checkConfirmationAuthorization,
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
    private readonly contactName: string | undefined,
    private dateTime: ReservationDateTime,
    private partySize: PartySize,
    private readonly source: ReservationSource,
    private readonly preferredArea: PreferredArea | undefined,
    private readonly notes: string | undefined,
    private readonly createdBy: string,
    private readonly createdAt: Date,
    /**
     * Optimistic-concurrency token: the version this aggregate was loaded
     * at. 0 means "not yet persisted". Read only by repository adapters —
     * the domain has no other use for it. See ReservationRepository.save().
     */
    private readonly version: number
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
    contactName?: string;
    reservationDate: Date;
    partySize: number;
    source: import("../value-objects/ReservationSource.js").ReservationSourceProps;
    preferredArea?: PreferredArea;
    notes?: string;
    createdBy: string;
    createdAt: Date;
    version: number;
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
      props.contactName,
      dateTime.value,
      partySize.value,
      source.value,
      props.preferredArea,
      props.notes,
      props.createdBy,
      props.createdAt,
      props.version
    );
  }

  /**
   * Common event-envelope fields (event-model.md §4) for the event about
   * to be pushed. `aggregateVersion` is this.version + 1 — the version
   * this write will produce once persisted — which is always correct
   * because the repository's optimistic-concurrency check (see
   * ReservationRepository.save()) guarantees at most one write succeeds
   * against a given this.version.
   */
  private nextEnvelope(
    cmd: { readonly eventId: string; readonly correlationId: string; readonly causationId?: string; readonly actor: Actor },
    occurredAt: Date
  ) {
    return {
      eventId: cmd.eventId,
      eventVersion: 1,
      reservationId: this.id.toString(),
      aggregateVersion: this.version + 1,
      occurredAt,
      correlationId: cmd.correlationId,
      causationId: cmd.causationId,
      actor: { id: cmd.actor.id, type: cmd.actor.kind },
    };
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
      cmd.contactName,
      dateTime,
      partySize,
      source,
      cmd.preferredArea,
      cmd.notes,
      cmd.actor.id,
      cmd.now,
      0
    );

    // CAP-D01.01-R14 is a Warning, not a blocking violation — recorded on
    // the event itself so it is never silently discarded: the persisted
    // history (and anything reading the event stream) can always see
    // whether a potential duplicate was flagged at creation time.
    const duplicateWarning = checkDuplicateWarning({
      dateTime,
      now: cmd.now,
      actor: cmd.actor,
      potentialDuplicateDetected: cmd.potentialDuplicateDetected,
    });

    aggregate.pendingEvents.push({
      ...aggregate.nextEnvelope(cmd, cmd.now),
      type: "ReservationCreated",
      servicePeriodId: cmd.servicePeriodId,
      contactId: cmd.contactId,
      contactName: cmd.contactName,
      reservationDate: dateTime.toDate(),
      partySize: partySize.toNumber(),
      reservationSource: source.category,
      externalReference: source.externalReference,
      importedBy: source.importedBy,
      potentialDuplicateWarning: duplicateWarning !== null,
      preferredArea: cmd.preferredArea,
      notes: cmd.notes,
    });

    return ok(aggregate);
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

    // CAP-D01.01-R20 — a date/time change must carry either a revalidated
    // Service Period or an explicit confirmation that the existing one
    // still holds. Without one of those, the reservation would end up
    // referencing a Service Period that no longer matches its own date/time.
    if (requiresServicePeriodRevalidation(changedFields)) {
      if (cmd.changes.servicePeriodId !== undefined) {
        previousValues["servicePeriodId"] = this.servicePeriodId;
        resultingValues["servicePeriodId"] = cmd.changes.servicePeriodId;
      } else if (cmd.isServicePeriodStillValid !== true) {
        violations.push(
          violation(
            "CAP-D01.01-R20",
            "A reservation date or time change requires the Service Period to be revalidated: supply a revalidated Service Period or confirm the existing one remains valid."
          )
        );
      }
    } else if (cmd.changes.servicePeriodId !== undefined) {
      // A direct Service Period correction, independent of any date/time change.
      previousValues["servicePeriodId"] = this.servicePeriodId;
      resultingValues["servicePeriodId"] = cmd.changes.servicePeriodId;
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
    if (cmd.changes.servicePeriodId !== undefined) {
      this.servicePeriodId = cmd.changes.servicePeriodId;
    }

    this.pendingEvents.push({
      ...this.nextEnvelope(cmd, now),
      type: "ReservationModified",
      changedFields,
      previousValues,
      resultingValues,
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
    const violations: RuleViolation[] = [
      ...checkConfirmationAuthorization(cmd.actor),
      ...checkConfirmationRules({ currentStatus: this.status, isReservationDataValid }),
    ];
    if (violations.length > 0) {
      return fail(violations);
    }

    this.status = ReservationStatus.Confirmed;
    this.pendingEvents.push({
      ...this.nextEnvelope(cmd, now),
      type: "ReservationConfirmed",
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
      ...this.nextEnvelope(cmd, now),
      type: "ReservationCancelled",
      cancelReason: cmd.reason,
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
        evidence: cmd.evidence,
        isManualCompletion: cmd.isManualCompletion,
        manualCompletionReason: cmd.manualCompletionReason,
      }),
    ];
    if (violations.length > 0) {
      return fail(violations);
    }

    this.status = ReservationStatus.Completed;
    this.pendingEvents.push({
      ...this.nextEnvelope(cmd, now),
      type: "ReservationCompleted",
      evidence: cmd.evidence,
      manualCompletionReason: cmd.manualCompletionReason,
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

  getContactName(): string | undefined {
    return this.contactName;
  }

  getPreferredArea(): PreferredArea | undefined {
    return this.preferredArea;
  }

  getNotes(): string | undefined {
    return this.notes;
  }

  getPartySize(): number {
    return this.partySize.toNumber();
  }

  getReservationDateTime(): Date {
    return this.dateTime.toDate();
  }

  getSource(): import("../value-objects/ReservationSource.js").ReservationSourceProps {
    return { category: this.source.category, externalReference: this.source.externalReference, importedBy: this.source.importedBy };
  }

  getCreatedBy(): string {
    return this.createdBy;
  }

  getCreatedAt(): Date {
    return this.createdAt;
  }

  /**
   * Optimistic-concurrency token this aggregate was loaded at. Repository
   * adapters use this to detect a concurrent write between load and save
   * (see ReservationRepository.save()); the domain has no other use for it.
   */
  getVersion(): number {
    return this.version;
  }

  /**
   * Non-destructive read of events recorded since the aggregate was loaded
   * or created. Repository adapters must use this — not pullEvents() —
   * while persistence is still in flight, so that a failed write leaves
   * the events intact on the aggregate for a safe retry. pullEvents()
   * should only be called once persistence has actually succeeded.
   */
  peekEvents(): readonly ReservationDomainEvent[] {
    return this.pendingEvents;
  }

  /** Drains and returns events recorded since the aggregate was loaded. Call only after a successful save — see peekEvents(). */
  pullEvents(): ReservationDomainEvent[] {
    const events = this.pendingEvents;
    this.pendingEvents = [];
    return events;
  }
}
