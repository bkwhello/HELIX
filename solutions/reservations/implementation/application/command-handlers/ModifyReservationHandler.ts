import { Result, fail, ok, violation, RuleViolation } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { ReservationRepository, CriticalNoteWrites } from "../../domain/repositories/ReservationRepository.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { ServicePeriodReader } from "../ports/ServicePeriodReader.js";
import { deriveServiceCode } from "../../domain/availability/Service.js";
import { validateCriticalNoteType, CriticalNoteDetail, CriticalNoteStatus, CriticalNoteType } from "../../domain/value-objects/ReservationCriticalNote.js";
import { validateCriticalNoteChangeIdentities, ExistingCriticalNote } from "../../domain/rules/CriticalNoteRules.js";
import { CriticalNoteSnapshot } from "../../domain/commands/ReservationCommands.js";

/** R1.3-I3 — CAP-D05.02. Explicit mutations only — omission can never remove or resolve a note. See CriticalNoteWrites's own doc comment for why this is never a complete-replacement set. */
export interface CriticalNoteChangeRequest {
  readonly add?: ReadonlyArray<{ readonly noteType: unknown; readonly detail: unknown }>;
  readonly update?: ReadonlyArray<{ readonly id: string; readonly noteType: unknown; readonly detail: unknown }>;
  readonly resolve?: ReadonlyArray<{ readonly id: string }>;
}

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
  /** R1.3-I3 — CAP-D05.02. Whole field omitted: no critical-note change. Missing `add`/`update`/`resolve` arrays mean no operation of that kind. An entirely empty change set (every array missing or empty) is a no-op. */
  readonly criticalNoteChanges?: CriticalNoteChangeRequest;
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
    private readonly servicePeriodReader: ServicePeriodReader,
    /** R1.3-I3 — CAP-D05.02. Generates ids for `criticalNoteChanges.add` entries BEFORE the command is built, the SAME "handler assigns identity" convention CreateReservationHandler already uses for `reservationId`. */
    private readonly idGenerator: IdGenerator
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

    // R1.3-I3 — CAP-D05.02. Validated BEFORE aggregate.modify()/save() are
    // ever called, same timing as the servicePeriodId handling below — a
    // rejection here mutates nothing. Normalizes the (possibly fully
    // omitted) request into concrete add/update/resolve arrays first.
    const noteChangeRequest = request.criticalNoteChanges;
    const addRequests = noteChangeRequest?.add ?? [];
    const updateRequests = noteChangeRequest?.update ?? [];
    const resolveRequests = noteChangeRequest?.resolve ?? [];
    const criticalNotesChanged = addRequests.length > 0 || updateRequests.length > 0 || resolveRequests.length > 0;

    let criticalNoteWrites: CriticalNoteWrites | undefined;
    let previousCriticalNoteSnapshots: readonly CriticalNoteSnapshot[] = [];
    let resultingCriticalNoteSnapshots: readonly CriticalNoteSnapshot[] = [];

    if (criticalNotesChanged) {
      const noteViolations: RuleViolation[] = [];
      const validatedAdds: { noteType: CriticalNoteType; detail: string }[] = [];
      for (const entry of addRequests) {
        const typeResult = validateCriticalNoteType(entry.noteType);
        const detailResult = CriticalNoteDetail.create(entry.detail as string);
        if (!typeResult.ok) noteViolations.push(...typeResult.violations);
        if (!detailResult.ok) noteViolations.push(...detailResult.violations);
        if (typeResult.ok && detailResult.ok) validatedAdds.push({ noteType: typeResult.value, detail: detailResult.value.toString() });
      }
      const validatedUpdates: { id: string; noteType: CriticalNoteType; detail: string }[] = [];
      for (const entry of updateRequests) {
        const typeResult = validateCriticalNoteType(entry.noteType);
        const detailResult = CriticalNoteDetail.create(entry.detail as string);
        if (!typeResult.ok) noteViolations.push(...typeResult.violations);
        if (!detailResult.ok) noteViolations.push(...detailResult.violations);
        if (typeResult.ok && detailResult.ok) validatedUpdates.push({ id: entry.id, noteType: typeResult.value, detail: detailResult.value.toString() });
      }

      // Unlocked, non-authoritative pre-read — the SAME posture
      // `this.repository.findById()` above already has (never passed
      // `request.tx` either). See
      // ReservationRepository.findCriticalNotesByReservationId's own doc
      // comment on why this is safe (save()'s optimistic version check is
      // what actually guards concurrent writes).
      const existingNotes = await this.repository.findCriticalNotesByReservationId(request.reservationId);
      const existingById = new Map(existingNotes.map((n) => [n.id, n] as const));
      const identityViolations = validateCriticalNoteChangeIdentities(
        { update: updateRequests, resolve: resolveRequests },
        existingNotes.map((n): ExistingCriticalNote => ({ id: n.id, status: n.status }))
      );
      noteViolations.push(...identityViolations);

      if (noteViolations.length > 0) {
        return fail(noteViolations);
      }

      const now = this.clock.now();
      const addsWithIds = validatedAdds.map((a) => ({ id: this.idGenerator.generate(), noteType: a.noteType, detail: a.detail }));

      criticalNoteWrites = {
        actingStaffUserId: request.actor.id,
        now,
        add: addsWithIds,
        update: validatedUpdates,
        resolve: resolveRequests.map((r) => ({ id: r.id })),
      };

      previousCriticalNoteSnapshots = [
        ...validatedUpdates.map((u): CriticalNoteSnapshot => {
          const existing = existingById.get(u.id)!;
          return { id: existing.id, noteType: existing.noteType, detail: existing.detail, status: existing.status };
        }),
        ...resolveRequests.map((r): CriticalNoteSnapshot => {
          const existing = existingById.get(r.id)!;
          return { id: existing.id, noteType: existing.noteType, detail: existing.detail, status: existing.status };
        }),
      ];
      resultingCriticalNoteSnapshots = [
        ...addsWithIds.map((a): CriticalNoteSnapshot => ({ id: a.id, noteType: a.noteType, detail: a.detail, status: CriticalNoteStatus.Active })),
        ...validatedUpdates.map((u): CriticalNoteSnapshot => ({ id: u.id, noteType: u.noteType, detail: u.detail, status: CriticalNoteStatus.Active })),
        ...resolveRequests.map((r): CriticalNoteSnapshot => ({ id: r.id, noteType: existingById.get(r.id)!.noteType, detail: existingById.get(r.id)!.detail, status: CriticalNoteStatus.Resolved })),
      ];
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
          violation(
            validation.ruleId ?? "CAP-D01.01-R06",
            validation.reason ?? "The Service Period is not valid for this reservation date, time, and party size."
          ),
        ]);
      }
    } else if (dateChanging) {
      // R1.6-P3A — the derived code can never itself MISMATCH (it is
      // derived from the very date being set), but the persisted Service
      // it now names may still be disabled or absent — this call exists
      // to reach that new check, not to re-prove the mismatch case.
      const derivedServicePeriodId = deriveServiceCode(effectiveDate);
      const validation = await this.servicePeriodReader.validateReservation({
        servicePeriodId: derivedServicePeriodId,
        reservationDate: effectiveDate,
        partySize: request.changes.partySize ?? aggregate.getPartySize(),
      });
      if (!validation.isValid) {
        return fail([
          violation(
            validation.ruleId ?? "CAP-D01.01-R06",
            validation.reason ?? "The Service Period is not valid for this reservation date, time, and party size."
          ),
        ]);
      }
      changes = { ...request.changes, servicePeriodId: derivedServicePeriodId };
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
        criticalNotesChanged,
        previousCriticalNotes: criticalNotesChanged ? previousCriticalNoteSnapshots : undefined,
        resultingCriticalNotes: criticalNotesChanged ? resultingCriticalNoteSnapshots : undefined,
      },
      this.clock.now()
    );
    if (!result.ok) return result;

    const saveResult = await this.repository.save({
      aggregate,
      expectedVersion: aggregate.getVersion(),
      commandId: request.commandId,
      tx: request.tx,
      criticalNoteWrites,
    });
    if (saveResult.type === "CONCURRENCY_CONFLICT") {
      return fail([violation("CAP-D01.01-R05", "The reservation was modified concurrently by another command. Reload and retry.")]);
    }
    return ok(undefined);
  }
}
