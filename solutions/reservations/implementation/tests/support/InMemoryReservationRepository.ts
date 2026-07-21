import { ReservationRepository, SaveResult } from "../../domain/repositories/ReservationRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

interface StoredReservation {
  status: ReturnType<ReservationAggregate["getStatus"]>;
  servicePeriodId: string;
  contactId: string;
  reservationDate: Date;
  partySize: number;
  source: ReturnType<ReservationAggregate["getSource"]>;
  createdBy: string;
  createdAt: Date;
  version: number;
}

/**
 * Test double only — not the Phase 4 infrastructure adapter (see
 * PrismaReservationRepository). It stores plain snapshots and
 * reconstitutes a fresh aggregate on every read, the same way the real
 * adapter does, so it honours the same contract: idempotent save() for a
 * repeated commandId, optimistic-concurrency rejection via
 * `expectedVersion`, and events only drained after a write actually
 * "commits".
 */
export class InMemoryReservationRepository implements ReservationRepository {
  private readonly byId = new Map<string, StoredReservation>();
  private readonly appliedCommandIds = new Set<string>();
  private readonly reservationIdByCommandId = new Map<string, string>();
  forceNextSaveToFail = false;
  saveCallCount = 0;

  async findById(id: ReservationId): Promise<ReservationAggregate | null> {
    const row = this.byId.get(id.toString());
    return row ? this.toAggregate(id.toString(), row) : null;
  }

  async findByCommandId(commandId: string): Promise<ReservationAggregate | null> {
    const reservationId = this.reservationIdByCommandId.get(commandId);
    if (!reservationId) return null;
    const row = this.byId.get(reservationId);
    return row ? this.toAggregate(reservationId, row) : null;
  }

  async findByDate(date: Date): Promise<ReservationAggregate[]> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    return [...this.byId.entries()]
      .filter(([, row]) => row.reservationDate >= startOfDay && row.reservationDate < endOfDay)
      .sort(([, a], [, b]) => a.reservationDate.getTime() - b.reservationDate.getTime())
      .map(([id, row]) => this.toAggregate(id, row));
  }

  private toAggregate(id: string, row: StoredReservation): ReservationAggregate {
    return ReservationAggregate.reconstitute({
      id,
      status: row.status,
      servicePeriodId: row.servicePeriodId,
      contactId: row.contactId,
      reservationDate: row.reservationDate,
      partySize: row.partySize,
      source: row.source,
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

    // CAP-D01.01-R44 — safe to call again with the same commandId.
    if (this.appliedCommandIds.has(commandId)) {
      aggregate.pullEvents();
      return { type: "IDEMPOTENT_REPLAY" };
    }
    if (this.forceNextSaveToFail) {
      this.forceNextSaveToFail = false;
      throw new Error("Simulated persistence failure");
    }

    const id = aggregate.getId().toString();
    const existing = this.byId.get(id);

    // CAP-D01.01-R05 — reject a write based on a stale read rather than
    // blindly overwriting whatever another command wrote in between.
    if (existing && existing.version !== expectedVersion) {
      return { type: "CONCURRENCY_CONFLICT" };
    }

    // Events are only drained (pullEvents) after the write below
    // succeeds — mirrors PrismaReservationRepository.save().
    const newVersion = (existing?.version ?? 0) + 1;
    this.byId.set(id, {
      status: aggregate.getStatus(),
      servicePeriodId: aggregate.getServicePeriodId(),
      contactId: aggregate.getContactId(),
      reservationDate: aggregate.getReservationDateTime(),
      partySize: aggregate.getPartySize(),
      source: existing?.source ?? aggregate.getSource(),
      createdBy: existing?.createdBy ?? aggregate.getCreatedBy(),
      createdAt: existing?.createdAt ?? aggregate.getCreatedAt(),
      version: newVersion,
    });
    this.appliedCommandIds.add(commandId);
    this.reservationIdByCommandId.set(commandId, id);
    this.saveCallCount += 1;
    aggregate.pullEvents();
    return { type: "SAVED", newVersion };
  }

  wasCommandApplied(commandId: string): boolean {
    return this.appliedCommandIds.has(commandId);
  }
}
