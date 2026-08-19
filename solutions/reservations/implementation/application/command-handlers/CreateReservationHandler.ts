import { Result, RuleViolation, fail, ok, violation } from "../../domain/shared/Result.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ContactStatus } from "../../domain/value-objects/ContactStatus.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { ReservationSourceProps } from "../../domain/value-objects/ReservationSource.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { ContactRepository, ContactRecord } from "../ports/ContactRepository.js";
import { CreateContactHandler } from "./CreateContactHandler.js";
import { ServicePeriodReader } from "../ports/ServicePeriodReader.js";
import { DuplicateReservationChecker } from "../ports/DuplicateReservationChecker.js";
import { ClosingDayStore } from "../ports/ClosingDayStore.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { EventIdGenerator } from "../ports/EventIdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { ReservationCommandRaceLost } from "../../infrastructure/persistence/PrismaReservationRepository.js";

/**
 * CAP-D05.01 — the two, and only two, ways a reservation may reference a
 * Reservation Contact (R1.3-I1 assignment §13 "Explicit Reuse vs
 * Explicit New"). There is no third, implicit path: the persistence
 * layer never silently decides to reuse or create based on matching —
 * that decision belongs to the caller (ultimately, to a staff member),
 * made explicit in the request shape itself so it is auditable/testable.
 */
export type ContactSelection =
  | { readonly type: "ExistingContact"; readonly contactId: string }
  | { readonly type: "CreateNewContact"; readonly displayName: string; readonly phone?: string; readonly email?: string };

export interface CreateReservationRequest {
  readonly commandId: string;
  readonly correlationId?: string;
  readonly causationId?: string;
  readonly servicePeriodId: string;
  readonly contactSelection: ContactSelection;
  readonly reservationDate: Date;
  readonly partySize: number;
  readonly source: ReservationSourceProps;
  readonly preferredArea?: PreferredArea;
  /** CAP-D01.01-R36/R37: operational context (allergies, special requests). */
  readonly notes?: string;
  readonly actor: Actor;
  readonly isHistoricalCorrection?: boolean;
  readonly historicalCorrectionReason?: string;
  /** CAP-D02.03 — when supplied by AvailabilityOrchestrator, the final persistence write (step 8 below) joins this transaction instead of opening its own, so it commits or rolls back atomically with a paired capacity commitment write. Absent for a plain CAP-D01.01 create (unchanged behavior). */
  readonly tx?: TransactionContext;
}

/**
 * DTO returned across the application boundary. The aggregate itself is
 * never returned outside this layer — it is an internal domain object,
 * not an API response shape.
 */
export interface CreateReservationOutcome {
  readonly reservationId: string;
  readonly status: ReservationStatus;
  readonly contactName?: string;
  readonly preferredArea?: PreferredArea;
  readonly notes?: string;
  readonly warnings: readonly RuleViolation[];
}

/**
 * Thrown only inside a transaction this handler itself opened (the
 * "CreateNewContact, no external tx" path — see handle()), to force a
 * rollback when the new Contact write already succeeded but the
 * subsequent reservation creation then fails validation. Mirrors
 * AvailabilityOrchestrator's OrchestratedValidationFailure — same
 * problem (a downstream failure after an upstream write in the same
 * transaction), same fix. Never escapes handle().
 */
class ReservationFailureAfterContactWrite extends Error {
  constructor(public readonly violations: readonly RuleViolation[]) {
    super("Reservation validation failed after a new Contact write; rolling back.");
  }
}

export class CreateReservationHandler {
  constructor(
    private readonly repository: ReservationRepository,
    private readonly duplicateChecker: DuplicateReservationChecker,
    private readonly contactRepository: ContactRepository,
    private readonly createContactHandler: CreateContactHandler,
    private readonly servicePeriodReader: ServicePeriodReader,
    private readonly closingDayStore: ClosingDayStore,
    private readonly idGenerator: IdGenerator,
    private readonly eventIdGenerator: EventIdGenerator,
    private readonly clock: Clock,
    private readonly transactionManager: TransactionManager
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
      !request.contactSelection ||
      !request.servicePeriodId ||
      !request.source
    ) {
      return fail([violation("CAP-D01.01-R08", "A reservation creation request must contain date, time, party size, contact, and source.")]);
    }
    // CAP-D01.01-R10 — checked here, not left to the aggregate later:
    // everything from this point on (including the closing-day lookup
    // below, which turns a date into a calendar key) assumes it already
    // has a real Date, not an Invalid Date.
    if (Number.isNaN(request.reservationDate.getTime())) {
      return fail([violation("CAP-D01.01-R10", "Reservation date and time must form a valid date-time value.")]);
    }

    // 3. Reject a marked closing day — CAP-D01.01-R51 (explicit pilot stopgap, see rule-model.md §16b).
    const closed = await this.closingDayStore.isClosed(request.reservationDate);
    if (closed) {
      return fail([violation("CAP-D01.01-R51", "Reservations cannot be created for a date that is marked closed.")]);
    }

    // 4. Resolve the Reservation Contact — CAP-D05.01. An existing
    // Contact is looked up (read-only, no lock/transaction needed) and
    // validated Active here; a NEW Contact's input is only validated
    // here, not yet written — the actual write happens in step 8,
    // atomically with the reservation write (see finalize() below).
    let existingContact: ContactRecord | null = null;
    if (request.contactSelection.type === "ExistingContact") {
      existingContact = await this.contactRepository.findById(request.contactSelection.contactId, request.tx);
      if (!existingContact || existingContact.status !== ContactStatus.Active) {
        return fail([violation("CAP-D05.01-R01", "The referenced Reservation Contact does not exist or is not active.")]);
      }
    }

    // 5. Validate Service Period — CAP-D01.01-R06 (cross-capability query, not an aggregate rule).
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

    // 6. Check for a possible duplicate — CAP-D01.01-R14 (Warning, not
    // blocking). A brand-new Contact cannot already have a reservation
    // under its own (not-yet-existing) id, so this is trivially false
    // for the CreateNewContact path — correct, not a gap.
    const potentialDuplicateDetected = existingContact
      ? await this.duplicateChecker.check({
          contactId: existingContact.id,
          reservationDate: request.reservationDate,
          partySize: request.partySize,
        })
      : false;

    // 7/8. Resolve-or-create the Contact and persist the reservation.
    // CAP-D02.03 §21 (R1.3 architecture investigation, Option C): an
    // EXISTING Contact needs no write of its own, so it never forces a
    // new transaction; a NEW Contact's write must be atomic with the
    // reservation write (never orphaned by a downstream failure), so it
    // always shares a transaction with it — either the caller's
    // (request.tx, the CAP-D02.03 capacity path) or one opened here.
    const finalize = async (tx?: TransactionContext): Promise<Result<CreateReservationOutcome>> => {
      let contactId: string;
      let contactName: string | undefined;
      let contactPhoneSnapshot: string | undefined;
      let contactEmailSnapshot: string | undefined;

      if (existingContact) {
        contactId = existingContact.id;
        contactName = existingContact.displayName;
        contactPhoneSnapshot = existingContact.phoneRaw;
        contactEmailSnapshot = existingContact.emailRaw;
        // Best-effort retention-anchor touch — see ContactRepository.touchActivity's doc comment on why this is not part of the atomic write.
        await this.contactRepository.touchActivity(contactId, this.clock.now());
      } else {
        const selection = request.contactSelection as Extract<typeof request.contactSelection, { type: "CreateNewContact" }>;
        const contactResult = await this.createContactHandler.handle({
          displayName: selection.displayName,
          phone: selection.phone,
          email: selection.email,
          actor: request.actor,
          tx,
        });
        if (!contactResult.ok) {
          // Nothing was written (CreateContactHandler validates before
          // writing) — safe to return directly, no rollback needed.
          return fail(contactResult.violations);
        }
        contactId = contactResult.value.id;
        contactName = contactResult.value.displayName;
        contactPhoneSnapshot = contactResult.value.phoneRaw;
        contactEmailSnapshot = contactResult.value.emailRaw;
      }

      const created = ReservationAggregate.create({
        reservationId: this.idGenerator.generate(),
        eventId: this.eventIdGenerator.generate(),
        correlationId: request.correlationId ?? request.commandId,
        causationId: request.causationId,
        servicePeriodId: request.servicePeriodId,
        contactId,
        contactName,
        contactPhoneSnapshot,
        contactEmailSnapshot,
        reservationDate: request.reservationDate,
        partySize: request.partySize,
        source: request.source,
        preferredArea: request.preferredArea,
        notes: request.notes,
        actor: request.actor,
        now: this.clock.now(),
        isHistoricalCorrection: request.isHistoricalCorrection,
        historicalCorrectionReason: request.historicalCorrectionReason,
        potentialDuplicateDetected,
      });
      if (!created.ok) {
        if (!existingContact && tx && !request.tx) {
          // A new Contact was already written in a transaction THIS
          // handler opened itself (the plain, non-capacity path) — must
          // force a rollback via throw, not a normal return, since only
          // the try/catch around runInTransaction() below can trigger
          // that rollback (see ReservationFailureAfterContactWrite's doc
          // comment). When `request.tx` is set instead (the capacity
          // path), `tx` here IS request.tx — an externally-owned
          // transaction this handler must never throw into. Returning
          // the failed Result normally is correct there: the caller
          // (AvailabilityOrchestrator) already converts a failed Result
          // from createHandler.handle() into its OWN thrown
          // OrchestratedValidationFailure, which rolls back everything
          // in ITS transaction — including this Contact write, since
          // it's the same transaction. Throwing here too would just be
          // an uncaught exception on that path (see final-gate report).
          throw new ReservationFailureAfterContactWrite(created.violations);
        }
        return created;
      }

      const saveResult = await this.repository.save({
        aggregate: created.value,
        expectedVersion: created.value.getVersion(),
        commandId: request.commandId,
        tx,
      });

      if (saveResult.type === "IDEMPOTENT_REPLAY") {
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

      const warnings: RuleViolation[] = potentialDuplicateDetected
        ? [violation("CAP-D01.01-R14", "A potentially duplicate reservation already exists.")]
        : [];
      return ok(toOutcome(created.value, warnings));
    };

    if (request.tx || existingContact) {
      // Either already inside the caller's transaction (capacity path),
      // or no new write is needed at all (existing Contact reused) — no
      // new transaction required either way.
      return finalize(request.tx);
    }

    // Plain path, new Contact: open a transaction spanning the Contact
    // write and the reservation write together.
    try {
      return await this.transactionManager.runInTransaction((tx) => finalize(tx));
    } catch (err) {
      if (err instanceof ReservationFailureAfterContactWrite) {
        return fail(err.violations);
      }
      if (err instanceof ReservationCommandRaceLost) {
        // Mirrors AvailabilityOrchestrator's handling of the same error:
        // passing `tx` into repository.save() (required so the new
        // Contact write and the reservation write commit/roll back
        // together) means a commandId race now surfaces as a thrown
        // ReservationCommandRaceLost instead of PrismaReservationRepository's
        // self-contained-transaction IDEMPOTENT_REPLAY return — resolve
        // the actual winner against a fresh connection instead.
        const winner = await this.repository.findByCommandId(request.commandId);
        if (winner) return ok(toOutcome(winner, []));
        return fail([violation("CAP-D01.01-R44", "The reservation could not be located after a concurrent duplicate command was detected.")]);
      }
      throw err;
    }
  }
}

/** Exported for AvailabilityOrchestrator, which needs to build the same outcome DTO shape when it resolves a race-lost commandId to its winning aggregate — see PrismaReservationRepository's ReservationCommandRaceLost. */
export function toOutcome(aggregate: ReservationAggregate, warnings: readonly RuleViolation[]): CreateReservationOutcome {
  return {
    reservationId: aggregate.getId().toString(),
    status: aggregate.getStatus(),
    contactName: aggregate.getContactName(),
    preferredArea: aggregate.getPreferredArea(),
    notes: aggregate.getNotes(),
    warnings,
  };
}
