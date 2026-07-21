import { Prisma, PrismaClient } from "@prisma/client";
import { ReservationRepository, SaveResult } from "../../domain/repositories/ReservationRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { PreferredArea } from "../../domain/value-objects/PreferredArea.js";

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
      createdBy: row.createdBy,
      createdAt: row.createdAt,
      version: row.version,
    });
  }

  async save(input: {
    readonly aggregate: ReservationAggregate;
    readonly expectedVersion: number;
    readonly commandId: string;
  }): Promise<SaveResult> {
    const { aggregate, expectedVersion, commandId } = input;

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
      await this.prisma.$transaction(async (tx) => {
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
              servicePeriodId: aggregate.getServicePeriodId(),
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
      });
    } catch (err) {
      if (err instanceof ConcurrencyConflict) {
        return { type: "CONCURRENCY_CONFLICT" };
      }
      // Two concurrent creations of the same commandId can both pass the
      // findByCommandId check above and both reach this transaction; only
      // one wins the `commandId` unique constraint (AppliedCommand.commandId
      // is @id) and the transaction rolls back entirely for the other —
      // including its `reservation.create()` — so no orphaned row survives.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
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
