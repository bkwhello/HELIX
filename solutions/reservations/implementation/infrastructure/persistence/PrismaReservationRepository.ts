import { Prisma, PrismaClient } from "@prisma/client";
import { ReservationRepository, SaveResult } from "../../domain/repositories/ReservationRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

/** Either a top-level PrismaClient or an interactive-transaction client — the write logic below only ever needs the model delegates both expose. */
type PrismaWriteClient = Pick<Prisma.TransactionClient, "reservation" | "reservationEvent" | "appliedCommand">;

/**
 * Infrastructure adapter for the ReservationRepository port.
 * CAP-D01.01-R44 (idempotency) and CAP-D01.01-R05 (atomicity) are
 * enforced together inside save(): the state write, the event inserts,
 * and the applied-command marker are written in a single transaction.
 * Optimistic concurrency is enforced via the `version` column — see
 * ReservationRepository.save() for the contract.
 */
export class PrismaReservationRepository implements ReservationRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: ReservationId): Promise<ReservationAggregate | null> {
    const row = await this.prisma.reservation.findUnique({ where: { id: id.toString() } });
    return row ? this.toAggregate(row) : null;
  }

  async findByCommandId(commandId: string): Promise<ReservationAggregate | null> {
    const applied = await this.prisma.appliedCommand.findUnique({ where: { commandId } });
    if (!applied) return null;
    const row = await this.prisma.reservation.findUnique({ where: { id: applied.reservationId } });
    return row ? this.toAggregate(row) : null;
  }

  async findByDate(date: Date): Promise<ReservationAggregate[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const rows = await this.prisma.reservation.findMany({
      where: { reservationDate: { gte: startOfDay, lt: endOfDay } },
      orderBy: { reservationDate: "asc" },
    });
    return rows.map((row) => this.toAggregate(row));
  }

  private toAggregate(row: {
    id: string;
    status: string;
    servicePeriodId: string;
    contactId: string;
    contactName: string | null;
    reservationDate: Date;
    partySize: number;
    sourceCategory: string;
    externalReference: string | null;
    importedBy: string | null;
    preferredArea: string | null;
    notes: string | null;
    tableAssignment: string | null;
    arrivedAt: Date | null;
    createdBy: string;
    createdAt: Date;
    version: number;
  }): ReservationAggregate {
    return ReservationAggregate.reconstitute({
      id: row.id,
      status: row.status as ReservationStatus,
      servicePeriodId: row.servicePeriodId,
      contactId: row.contactId,
      contactName: row.contactName ?? undefined,
      reservationDate: row.reservationDate,
      partySize: row.partySize,
      source: {
        category: row.sourceCategory as ReservationSourceCategory,
        externalReference: row.externalReference ?? undefined,
        importedBy: row.importedBy ?? undefined,
      },
      preferredArea: (row.preferredArea as PreferredArea) ?? undefined,
      notes: row.notes ?? undefined,
      tableAssignment: row.tableAssignment ?? undefined,
      arrivedAt: row.arrivedAt ?? undefined,
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      version: row.version,
    });
  }

  async save(input: {
    readonly aggregate: ReservationAggregate;
    readonly expectedVersion: number;
    readonly commandId: string;
    readonly tx?: TransactionContext;
  }): Promise<SaveResult> {
    const { aggregate, expectedVersion, commandId, tx: externalTx } = input;

    // The idempotency pre-check always reads against the top-level client,
    // even when an external `tx` is supplied: it is a non-authoritative
    // fast path (the P2002 catch below is the real guard), and reading
    // through `externalTx` here would just mean "read my own
    // not-yet-committed write," which is never useful.
    const alreadyApplied = await this.prisma.appliedCommand.findUnique({ where: { commandId } });
    if (alreadyApplied) {
      // CAP-D01.01-R44 — a repeated command is a safe no-op: nothing is
      // written, so nothing was lost by discarding these events either.
      aggregate.pullEvents();
      return { type: "IDEMPOTENT_REPLAY" };
    }

    // Non-destructive read: if the transaction below fails for any reason
    // (including a concurrency conflict), these events must still be on
    // the aggregate afterwards so the caller can safely reload and retry
    // instead of silently losing them.
    const events = aggregate.peekEvents();
    const reservationId = aggregate.getId().toString();

    try {
      const writeWork = async (tx: PrismaWriteClient): Promise<void> => {
        const existing = await tx.reservation.findUnique({ where: { id: reservationId } });

        if (!existing) {
          await tx.reservation.create({
            data: {
              id: reservationId,
              servicePeriodId: aggregate.getServicePeriodId(),
              contactId: aggregate.getContactId(),
              contactName: aggregate.getContactName(),
              status: aggregate.getStatus(),
              reservationDate: aggregate.getReservationDateTime(),
              partySize: aggregate.getPartySize(),
              sourceCategory: eventSourceCategory(events) ?? "Staff",
              externalReference: eventExternalReference(events),
              importedBy: eventImportedBy(events),
              preferredArea: aggregate.getPreferredArea(),
              notes: aggregate.getNotes(),
              tableAssignment: aggregate.getTableAssignment(),
              createdBy: aggregate.getCreatedBy(),
              createdAt: aggregate.getCreatedAt(),
              version: 1,
            },
          });
        } else {
          // CAP-D01.01-R05 — reject a write based on a stale read rather
          // than blindly overwriting whatever another command wrote in
          // between. `expectedVersion` is supplied by the caller, not
          // read off the aggregate here, per the repository contract.
          const updated = await tx.reservation.updateMany({
            where: { id: reservationId, version: expectedVersion },
            data: {
              status: aggregate.getStatus(),
              reservationDate: aggregate.getReservationDateTime(),
              partySize: aggregate.getPartySize(),
              contactId: aggregate.getContactId(),
              contactName: aggregate.getContactName(),
              sourceCategory: aggregate.getSource().category,
              externalReference: aggregate.getSource().externalReference,
              importedBy: aggregate.getSource().importedBy,
              servicePeriodId: aggregate.getServicePeriodId(),
              tableAssignment: aggregate.getTableAssignment(),
              notes: aggregate.getNotes(),
              preferredArea: aggregate.getPreferredArea(),
              arrivedAt: aggregate.getArrivedAt() ?? null,
              version: { increment: 1 },
            },
          });
          if (updated.count === 0) {
            throw new ConcurrencyConflict();
          }
        }

        for (const event of events) {
          await tx.reservationEvent.create({
            data: {
              reservationId,
              type: event.type,
              occurredAt: event.occurredAt,
              payload: JSON.stringify(event),
            },
          });
        }

        await tx.appliedCommand.create({ data: { commandId, reservationId } });
      };

      if (externalTx) {
        // Participate in the caller's already-open transaction — do not
        // open a nested one. See ReservationRepository.save()'s doc
        // comment on `tx`.
        await writeWork(asPrismaTx(externalTx));
      } else {
        await this.prisma.$transaction((tx) => writeWork(tx));
      }
    } catch (err) {
      if (err instanceof ConcurrencyConflict) {
        return { type: "CONCURRENCY_CONFLICT" };
      }
      // Two concurrent creations of the same commandId can both pass the
      // findByCommandId check above and both reach this transaction; only
      // one wins the `commandId` unique constraint (AppliedCommand.commandId
      // is @id) and the transaction rolls back entirely for the other —
      // including its `reservation.create()` — so no orphaned row survives.
      //
      // Narrowed to the applied_commands primary key specifically (via
      // Prisma's error `meta.target`): a P2002 on some OTHER constraint
      // (e.g. a colliding ReservationEvent.id) is a genuine, unexpected
      // failure, not a benign duplicate-commandId replay, and must
      // propagate as such rather than being silently reinterpreted.
      const isCommandIdConflict =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2002" &&
        (Array.isArray(err.meta?.["target"])
          ? (err.meta?.["target"] as string[]).includes("commandId")
          : typeof err.meta?.["target"] === "string" && (err.meta?.["target"] as string).includes("applied_commands"));
      if (isCommandIdConflict) {
        if (externalTx) {
          // CAP-D02.03 — PostgreSQL aborts an entire transaction on any
          // statement error; it cannot be "partially" continued after
          // this, even though the JS exception was caught here. A caller
          // sharing this transaction (AvailabilityOrchestrator) may have
          // already written a capacity commitment earlier in the SAME
          // transaction that must now be rolled back too — silently
          // returning IDEMPOTENT_REPLAY here would make the caller think
          // it can keep issuing queries on a connection Postgres has
          // already poisoned. Re-throw so the failure propagates all the
          // way out of the shared transaction and Prisma performs a real
          // rollback; the caller resolves the actual winner afterward via
          // findByCommandId() against a fresh, healthy connection.
          throw new ReservationCommandRaceLost(commandId);
        }
        return { type: "IDEMPOTENT_REPLAY" };
      }
      throw err;
    }

    // Only drain the events once the transaction above has actually
    // committed — see the comment on `events` above.
    aggregate.pullEvents();
    return { type: "SAVED", newVersion: expectedVersion + 1 };
  }
}

/** Internal signal only — never escapes save(); see the catch block above. */
class ConcurrencyConflict extends Error {}

/** Thrown (not returned) by save() only when called with an external `tx` and the commandId was won by a concurrent transaction — see the catch block above for why this case cannot be handled the same way as the self-contained-transaction path. */
export class ReservationCommandRaceLost extends Error {
  constructor(public readonly commandId: string) {
    super(`Reservation command "${commandId}" was applied by a concurrent transaction.`);
  }
}

// Small helpers to pull creation-only fields out of the event stream
// without adding creation-specific getters to the aggregate itself.
function eventSourceCategory(events: readonly { type: string }[]): string | undefined {
  const created = events.find((e) => e.type === "ReservationCreated") as
    | { reservationSource?: string }
    | undefined;
  return created?.reservationSource;
}
function eventExternalReference(events: readonly { type: string }[]): string | undefined {
  const created = events.find((e) => e.type === "ReservationCreated") as
    | { externalReference?: string }
    | undefined;
  return created?.externalReference;
}
function eventImportedBy(events: readonly { type: string }[]): string | undefined {
  const created = events.find((e) => e.type === "ReservationCreated") as { importedBy?: string } | undefined;
  return created?.importedBy;
}
