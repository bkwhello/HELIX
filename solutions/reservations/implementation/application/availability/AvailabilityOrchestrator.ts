/**
 * CAP-D02.03 — Availability Orchestrator.
 *
 * The one place that composes: booking policy -> capacity lock -> capacity
 * evaluation -> capacity write -> CAP-D01.01 reservation write, as a single
 * shared PostgreSQL transaction (TransactionManager.runInTransaction). This
 * is a hard architectural invariant (assignment §"shared transaction"), not
 * a convenience — see domain/shared/TransactionContext.ts.
 *
 * Deliberately does NOT change CreateReservationHandler / ModifyReservationHandler
 * / CancelReservationHandler: it calls them with an extra `tx`, reusing all
 * existing CAP-D01.01 validation and the CAP-D01.01-R47 boundary (capacity
 * awareness lives here, never on ReservationAggregate).
 *
 * Idempotency has two layers, both necessary:
 *  1. A pre-transaction findByCommandId check (fast path — a plain retry
 *     never opens a transaction or takes a lock).
 *  2. A post-lock, tx-scoped capacityRepository.findByCommandId check,
 *     because the *expected*, not just theoretically-possible, shape of a
 *     genuine duplicate-commandId race is: both callers pass check #1
 *     (neither has committed yet), then SERIALIZE on the same
 *     pg_advisory_xact_lock (same pool+date, because a retry of the same
 *     logical request targets the same resource) — so by the time the
 *     second one gets the lock, the first has already committed. Without
 *     this second check, the second caller would write a duplicate
 *     capacity commitment even though CreateReservationHandler's own
 *     internal idempotency check will correctly no-op the reservation
 *     write.
 *  3. A defense-in-depth catch for ReservationCommandRaceLost, covering
 *     the residual case where two duplicate-commandId calls do NOT
 *     serialize on the same lock (e.g. a client bug submits the same
 *     commandId against two different pools/dates) — PrismaReservationRepository
 *     throws this when the shared transaction's own commandId write loses
 *     a race, and the whole transaction (including any capacity write
 *     already made) is rolled back by Prisma before this is caught.
 */
import { CreateReservationHandler, CreateReservationRequest, CreateReservationOutcome, toOutcome } from "../command-handlers/CreateReservationHandler.js";
import { ModifyReservationHandler, ModifyReservationRequest } from "../command-handlers/ModifyReservationHandler.js";
import { CancelReservationHandler, CancelReservationRequest } from "../command-handlers/CancelReservationHandler.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { CapacityRepository } from "../../domain/repositories/CapacityRepository.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { ClosingDayStore } from "../ports/ClosingDayStore.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { ReservationCommandRaceLost } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { CapacityPoolId, CAPACITY_POOLS, isCapacityPoolId } from "../../domain/availability/CapacityPool.js";
import { evaluateSimultaneousOccupancy } from "../../domain/availability/AvailabilityEvaluator.js";
import { evaluateBookingPolicy, BookingPolicyOutcome } from "../../domain/availability/BookingPolicy.js";
import { AvailabilityOutcome } from "../../domain/availability/AvailabilityResult.js";
import { toLocalServiceDate } from "../../domain/availability/ServiceTime.js";
import { sortLockResources } from "../../domain/availability/LockKey.js";
import { RuleViolation, violation } from "../../domain/shared/Result.js";
import { Actor, ActorKind } from "../../domain/value-objects/Actor.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

/** Thrown only inside a runInTransaction callback to force a rollback when a wrapped CAP-D01.01 handler rejects after a capacity write already happened in the same transaction. Never escapes this file. */
class OrchestratedValidationFailure extends Error {
  constructor(public readonly violations: readonly RuleViolation[]) {
    super("Reservation validation failed after a capacity write; rolling back.");
  }
}

export type CreateWithCapacityResult =
  | { readonly type: "CREATED"; readonly outcome: CreateReservationOutcome }
  | { readonly type: "CAPACITY_UNAVAILABLE"; readonly availability: AvailabilityOutcome }
  | { readonly type: "BOOKING_POLICY_REJECTED"; readonly policy: BookingPolicyOutcome }
  | { readonly type: "VALIDATION_FAILED"; readonly violations: readonly RuleViolation[] };

export type ModifyWithCapacityResult =
  | { readonly type: "MODIFIED" }
  | { readonly type: "CAPACITY_UNAVAILABLE"; readonly availability: AvailabilityOutcome }
  | { readonly type: "BOOKING_POLICY_REJECTED"; readonly policy: BookingPolicyOutcome }
  /** The reservation has no active CAP-D02.03 commitment to move (e.g. it predates capacity tracking, or its area is not a managed pool) — this MVA does not attempt to retrofit one. See CAP_D02_03_IMPLEMENTATION_REPORT, Known Limitations. */
  | { readonly type: "NO_ACTIVE_COMMITMENT" }
  | { readonly type: "VALIDATION_FAILED"; readonly violations: readonly RuleViolation[] };

export type CancelWithCapacityResult =
  | { readonly type: "CANCELLED" }
  | { readonly type: "VALIDATION_FAILED"; readonly violations: readonly RuleViolation[] };

export class AvailabilityOrchestrator {
  constructor(
    private readonly reservationRepository: ReservationRepository,
    private readonly capacityRepository: CapacityRepository,
    private readonly transactionManager: TransactionManager,
    private readonly closingDayStore: ClosingDayStore,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock,
    private readonly createHandler: CreateReservationHandler,
    private readonly modifyHandler: ModifyReservationHandler,
    private readonly cancelHandler: CancelReservationHandler
  ) {}

  /**
   * Only ApprovedGuestChannel is the self-service channel the booking
   * policy (party-size routing, same-day cutoff) exists to constrain —
   * see domain/value-objects/Actor.ts's ActorKind doc comment ("a staff
   * member, an approved guest-facing channel, or an approved
   * integration"). Staff, and trusted system integrations acting on a
   * guest's behalf (e.g. a future Guestplan sync), are exempt.
   */
  private isStaffActor(actor: Actor): boolean {
    return actor.kind !== ActorKind.ApprovedGuestChannel;
  }

  async createWithCapacity(request: CreateReservationRequest): Promise<CreateWithCapacityResult> {
    const alreadyApplied = await this.reservationRepository.findByCommandId(request.commandId);
    if (alreadyApplied) {
      return { type: "CREATED", outcome: toOutcome(alreadyApplied, []) };
    }

    const poolRaw = request.preferredArea;
    if (!poolRaw || !isCapacityPoolId(poolRaw)) {
      return {
        type: "VALIDATION_FAILED",
        violations: [violation("CAP-D02.03", "A capacity-managed reservation must specify preferredArea as Sushi or Teppanyaki.")],
      };
    }
    const pool: CapacityPoolId = poolRaw;

    const policy = evaluateBookingPolicy({
      partySize: request.partySize,
      requestedStart: request.reservationDate,
      now: this.clock.now(),
      isStaffActor: this.isStaffActor(request.actor),
    });
    if (policy.type !== "ALLOWED") {
      return { type: "BOOKING_POLICY_REJECTED", policy };
    }

    // CAP-D01.01-R51 — checked here too (CreateReservationHandler checks
    // it again internally) so a doomed request never reaches the capacity
    // lock/write at all. See file header on why capacity work must not
    // happen ahead of a rejection that is certain regardless of capacity.
    if (await this.closingDayStore.isClosed(request.reservationDate)) {
      return {
        type: "VALIDATION_FAILED",
        violations: [violation("CAP-D01.01-R51", "Reservations cannot be created for a date that is marked closed.")],
      };
    }

    const durationMinutes = CAPACITY_POOLS[pool].durationMinutes;
    const rangeStart = request.reservationDate;
    const rangeEnd = new Date(rangeStart.getTime() + durationMinutes * 60_000);
    const localServiceDate = toLocalServiceDate(rangeStart);

    try {
      const work = await this.transactionManager.runInTransaction(async (tx) => {
        await this.capacityRepository.acquireCapacityLock({ capacityPoolId: pool, localServiceDate, tx });

        // See file header, idempotency layer 2.
        const existingForCommand = await this.capacityRepository.findByCommandId(request.commandId, tx);
        if (existingForCommand) {
          return { kind: "ALREADY_APPLIED" as const };
        }

        const overlapping = await this.capacityRepository.findOverlappingCommitments({ capacityPoolId: pool, rangeStart, rangeEnd, tx });
        const evaluation = evaluateSimultaneousOccupancy({
          requestedStart: rangeStart,
          requestedDurationMinutes: durationMinutes,
          candidates: overlapping,
        });
        const capacity = CAPACITY_POOLS[pool].maximumCapacity;
        if (evaluation.maxExistingOccupancy + request.partySize > capacity) {
          return {
            kind: "CAPACITY_UNAVAILABLE" as const,
            availability: { type: "CAPACITY_EXHAUSTED" as const, maxExistingOccupancy: evaluation.maxExistingOccupancy, capacity },
          };
        }

        const created = await this.createHandler.handle({ ...request, tx });
        if (!created.ok) throw new OrchestratedValidationFailure(created.violations);

        const commitmentId = this.idGenerator.generate();
        await this.capacityRepository.create({
          commitment: {
            commitmentId,
            reservationId: created.value.reservationId,
            capacityPoolId: pool,
            startTime: rangeStart,
            endTime: rangeEnd,
            partySize: request.partySize,
            commandId: request.commandId,
          },
          tx,
        });

        return { kind: "CREATED" as const, outcome: created.value };
      });

      if (work.kind === "CAPACITY_UNAVAILABLE") {
        return { type: "CAPACITY_UNAVAILABLE", availability: work.availability };
      }
      if (work.kind === "ALREADY_APPLIED") {
        const winner = await this.reservationRepository.findByCommandId(request.commandId);
        if (!winner) {
          return {
            type: "VALIDATION_FAILED",
            violations: [violation("CAP-D01.01-R44", "The reservation could not be located after a concurrent duplicate command was detected.")],
          };
        }
        return { type: "CREATED", outcome: toOutcome(winner, []) };
      }
      return { type: "CREATED", outcome: work.outcome };
    } catch (err) {
      if (err instanceof ReservationCommandRaceLost) {
        const winner = await this.reservationRepository.findByCommandId(request.commandId);
        if (winner) return { type: "CREATED", outcome: toOutcome(winner, []) };
        return {
          type: "VALIDATION_FAILED",
          violations: [violation("CAP-D01.01-R44", "The reservation could not be located after a concurrent duplicate command was detected.")],
        };
      }
      if (err instanceof OrchestratedValidationFailure) {
        return { type: "VALIDATION_FAILED", violations: err.violations };
      }
      throw err;
    }
  }

  async modifyWithCapacity(request: ModifyReservationRequest): Promise<ModifyWithCapacityResult> {
    const alreadyApplied = await this.reservationRepository.findByCommandId(request.commandId);
    if (alreadyApplied) return { type: "MODIFIED" };

    const idResult = ReservationId.create(request.reservationId);
    if (!idResult.ok) return { type: "VALIDATION_FAILED", violations: idResult.violations };

    const current = await this.reservationRepository.findById(idResult.value);
    if (!current) {
      return {
        type: "VALIDATION_FAILED",
        violations: [violation("CAP-D01.01-R15", "A reservation modification request must reference an existing Reservation Identity.")],
      };
    }

    const changes = request.changes;
    const capacityRelevant = changes.reservationDate !== undefined || changes.partySize !== undefined || changes.preferredArea !== undefined;

    if (!capacityRelevant) {
      return this.modifyWithoutCapacityChange(request);
    }

    const currentPoolRaw = current.getPreferredArea();
    if (!currentPoolRaw || !isCapacityPoolId(currentPoolRaw)) {
      return { type: "NO_ACTIVE_COMMITMENT" };
    }
    const existingCommitment = await this.capacityRepository.findActiveByReservationId(request.reservationId);
    if (!existingCommitment) {
      return { type: "NO_ACTIVE_COMMITMENT" };
    }

    const newPartySize = changes.partySize ?? current.getPartySize();
    const newPoolRaw = changes.preferredArea ?? currentPoolRaw;
    if (!isCapacityPoolId(newPoolRaw)) {
      return {
        type: "VALIDATION_FAILED",
        violations: [violation("CAP-D02.03", `preferredArea "${newPoolRaw}" is not a capacity-managed area.`)],
      };
    }
    const newPool: CapacityPoolId = newPoolRaw;
    const newStart = changes.reservationDate ?? current.getReservationDateTime();

    const policy = evaluateBookingPolicy({
      partySize: newPartySize,
      requestedStart: newStart,
      now: this.clock.now(),
      isStaffActor: this.isStaffActor(request.actor),
    });
    if (policy.type !== "ALLOWED") {
      return { type: "BOOKING_POLICY_REJECTED", policy };
    }

    const durationMinutes = CAPACITY_POOLS[newPool].durationMinutes;
    const newEnd = new Date(newStart.getTime() + durationMinutes * 60_000);
    const oldLocalDate = toLocalServiceDate(existingCommitment.startTime);
    const newLocalDate = toLocalServiceDate(newStart);
    // CAP-D02.03 — deterministic global lock order across both resources
    // (old and new may be the same, or genuinely different, pool/date).
    const lockResources = sortLockResources([
      { capacityPoolId: existingCommitment.capacityPoolId, localServiceDate: oldLocalDate },
      { capacityPoolId: newPool, localServiceDate: newLocalDate },
    ]);

    try {
      const work = await this.transactionManager.runInTransaction(async (tx) => {
        for (const resource of lockResources) {
          await this.capacityRepository.acquireCapacityLock({ capacityPoolId: resource.capacityPoolId, localServiceDate: resource.localServiceDate, tx });
        }

        const existingForCommand = await this.capacityRepository.findByCommandId(request.commandId, tx);
        if (existingForCommand) {
          return { kind: "ALREADY_APPLIED" as const };
        }

        // Self-exclusion by commitmentId (CAP-D02.03 §7), never by
        // reservationId: excludes exactly the interval being replaced,
        // not "everything belonging to this reservation" (irrelevant
        // distinction today since a reservation has at most one active
        // commitment, but the port contract is explicit about which key
        // it is because that is the correctness-relevant property).
        const overlapping = await this.capacityRepository.findOverlappingCommitments({
          capacityPoolId: newPool,
          rangeStart: newStart,
          rangeEnd: newEnd,
          tx,
        });
        const evaluation = evaluateSimultaneousOccupancy({
          requestedStart: newStart,
          requestedDurationMinutes: durationMinutes,
          candidates: overlapping,
          excludeCommitmentId: existingCommitment.commitmentId,
        });
        const capacity = CAPACITY_POOLS[newPool].maximumCapacity;
        if (evaluation.maxExistingOccupancy + newPartySize > capacity) {
          return {
            kind: "CAPACITY_UNAVAILABLE" as const,
            availability: { type: "CAPACITY_EXHAUSTED" as const, maxExistingOccupancy: evaluation.maxExistingOccupancy, capacity },
          };
        }

        await this.capacityRepository.updateStatus({ commitmentId: existingCommitment.commitmentId, status: "Superseded", tx });
        const newCommitmentId = this.idGenerator.generate();
        await this.capacityRepository.create({
          commitment: {
            commitmentId: newCommitmentId,
            reservationId: request.reservationId,
            capacityPoolId: newPool,
            startTime: newStart,
            endTime: newEnd,
            partySize: newPartySize,
            commandId: request.commandId,
          },
          tx,
        });

        const modifyResult = await this.modifyHandler.handle({ ...request, tx });
        if (!modifyResult.ok) throw new OrchestratedValidationFailure(modifyResult.violations);

        return { kind: "MODIFIED" as const };
      });

      if (work.kind === "CAPACITY_UNAVAILABLE") return { type: "CAPACITY_UNAVAILABLE", availability: work.availability };
      return { type: "MODIFIED" };
    } catch (err) {
      if (err instanceof ReservationCommandRaceLost) return { type: "MODIFIED" };
      if (err instanceof OrchestratedValidationFailure) return { type: "VALIDATION_FAILED", violations: err.violations };
      throw err;
    }
  }

  private async modifyWithoutCapacityChange(request: ModifyReservationRequest): Promise<ModifyWithCapacityResult> {
    try {
      await this.transactionManager.runInTransaction(async (tx) => {
        const result = await this.modifyHandler.handle({ ...request, tx });
        if (!result.ok) throw new OrchestratedValidationFailure(result.violations);
      });
      return { type: "MODIFIED" };
    } catch (err) {
      if (err instanceof ReservationCommandRaceLost) return { type: "MODIFIED" };
      if (err instanceof OrchestratedValidationFailure) return { type: "VALIDATION_FAILED", violations: err.violations };
      throw err;
    }
  }

  async cancelWithCapacity(request: CancelReservationRequest): Promise<CancelWithCapacityResult> {
    const alreadyApplied = await this.reservationRepository.findByCommandId(request.commandId);
    if (alreadyApplied) return { type: "CANCELLED" };

    // Advisory only — picks which (pool, date) resource to lock. Not
    // trusted as "the" commitment to release: see the re-read below for
    // why.
    const snapshot = await this.capacityRepository.findActiveByReservationId(request.reservationId);

    try {
      await this.transactionManager.runInTransaction(async (tx) => {
        if (snapshot) {
          const localServiceDate = toLocalServiceDate(snapshot.startTime);
          await this.capacityRepository.acquireCapacityLock({ capacityPoolId: snapshot.capacityPoolId, localServiceDate, tx });

          const existingForCommand = await this.capacityRepository.findByCommandId(request.commandId, tx);
          if (!existingForCommand) {
            // Re-read the active commitment INSIDE the transaction, after
            // acquiring the lock, rather than trusting `snapshot`: a
            // concurrent Modify could have superseded it (new
            // commitmentId) between the pre-transaction snapshot and this
            // point, while this transaction waited for the lock. Releasing
            // the stale snapshot's id in that case would mark an already-
            // Superseded row Released (harmless) while leaving the
            // ACTUALLY active commitment permanently Committed — a
            // capacity leak on an otherwise-cancelled reservation. This
            // re-read closes that window for same-resource races (a
            // concurrent Modify that also changes pool/date is a
            // narrower residual case — see CAP_D02_03_IMPLEMENTATION_REPORT,
            // Known Limitations).
            const current = await this.capacityRepository.findActiveByReservationId(request.reservationId, tx);
            if (current) {
              await this.capacityRepository.updateStatus({ commitmentId: current.commitmentId, status: "Released", tx });
            }
          }
        }

        const cancelResult = await this.cancelHandler.handle({ ...request, tx });
        if (!cancelResult.ok) throw new OrchestratedValidationFailure(cancelResult.violations);
      });
      return { type: "CANCELLED" };
    } catch (err) {
      if (err instanceof ReservationCommandRaceLost) return { type: "CANCELLED" };
      if (err instanceof OrchestratedValidationFailure) return { type: "VALIDATION_FAILED", violations: err.violations };
      throw err;
    }
  }
}
