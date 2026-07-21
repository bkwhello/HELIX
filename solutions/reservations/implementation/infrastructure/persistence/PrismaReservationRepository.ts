import { PrismaClient } from "@prisma/client";
import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * Infrastructure adapter for the ReservationRepository port.
 * CAP-D01.01-R44 (idempotency) and CAP-D01.01-R05 (atomicity) are
 * enforced together inside save(): the state upsert, the event inserts,
 * and the applied-command marker are written in a single transaction.
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

  private toAggregate(row: {
    id: string;
    status: string;
    servicePeriodId: string;
    contactId: string;
    reservationDate: Date;
    partySize: number;
    sourceCategory: string;
    externalReference: string | null;
    importedBy: string | null;
    createdBy: string;
    createdAt: Date;
  }): ReservationAggregate {
    return ReservationAggregate.reconstitute({
      id: row.id,
      status: row.status as ReservationStatus,
      servicePeriodId: row.servicePeriodId,
      contactId: row.contactId,
      reservationDate: row.reservationDate,
      partySize: row.partySize,
      source: {
        category: row.sourceCategory as ReservationSourceCategory,
        externalReference: row.externalReference ?? undefined,
        importedBy: row.importedBy ?? undefined,
      },
      createdBy: row.createdBy,
      createdAt: row.createdAt,
    });
  }

  async hasPotentialDuplicate(candidate: {
    contactId: string;
    reservationDate: Date;
    partySize: number;
  }): Promise<boolean> {
    // CAP-D01.01-R14 — a same-day, same-contact, same-party-size match is
    // treated as a plausible duplicate. Matching strategy is an
    // infrastructure concern, not a domain one.
    const startOfDay = new Date(candidate.reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const match = await this.prisma.reservation.findFirst({
      where: {
        contactId: candidate.contactId,
        partySize: candidate.partySize,
        reservationDate: { gte: startOfDay, lt: endOfDay },
        status: { in: [ReservationStatus.Proposed, ReservationStatus.Confirmed] },
      },
    });
    return match !== null;
  }

  async save(aggregate: ReservationAggregate, commandId: string): Promise<void> {
    const alreadyApplied = await this.prisma.appliedCommand.findUnique({ where: { commandId } });
    if (alreadyApplied) {
      // CAP-D01.01-R44 — a repeated command is a safe no-op.
      aggregate.pullEvents();
      return;
    }

    const events = aggregate.pullEvents();

    await this.prisma.$transaction(async (tx) => {
      await tx.reservation.upsert({
        where: { id: aggregate.getId().toString() },
        create: {
          id: aggregate.getId().toString(),
          servicePeriodId: aggregate.getServicePeriodId(),
          contactId: aggregate.getContactId(),
          status: aggregate.getStatus(),
          reservationDate: aggregate.getReservationDateTime(),
          partySize: aggregate.getPartySize(),
          sourceCategory: eventSourceCategory(events) ?? "Staff",
          externalReference: eventExternalReference(events),
          importedBy: eventImportedBy(events),
          createdBy: eventCreatedBy(events) ?? "unknown",
          createdAt: new Date(),
        },
        update: {
          status: aggregate.getStatus(),
          reservationDate: aggregate.getReservationDateTime(),
          partySize: aggregate.getPartySize(),
          contactId: aggregate.getContactId(),
        },
      });

      for (const event of events) {
        await tx.reservationEvent.create({
          data: {
            reservationId: aggregate.getId().toString(),
            type: event.type,
            occurredAt: event.occurredAt,
            payload: JSON.stringify(event),
          },
        });
      }

      await tx.appliedCommand.create({ data: { commandId, reservationId: aggregate.getId().toString() } });
    });
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
function eventCreatedBy(events: readonly { type: string }[]): string | undefined {
  const created = events.find((e) => e.type === "ReservationCreated") as { createdBy?: string } | undefined;
  return created?.createdBy;
}
