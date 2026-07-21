import { ReservationRepository } from "../../domain/repositories/ReservationRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";

/**
 * Test double only — not a Phase 4 infrastructure adapter. A real
 * persistence adapter (Postgres via Prisma) is built later, once the
 * domain and application layers are verified against acceptance.md.
 */
export class InMemoryReservationRepository implements ReservationRepository {
  private readonly byId = new Map<string, ReservationAggregate>();
  private readonly appliedCommandIds = new Set<string>();
  private readonly reservationIdByCommandId = new Map<string, string>();
  forceNextSaveToFail = false;
  saveCallCount = 0;

  async findById(id: ReservationId): Promise<ReservationAggregate | null> {
    return this.byId.get(id.toString()) ?? null;
  }

  async findByCommandId(commandId: string): Promise<ReservationAggregate | null> {
    const reservationId = this.reservationIdByCommandId.get(commandId);
    if (!reservationId) return null;
    return this.byId.get(reservationId) ?? null;
  }

  async hasPotentialDuplicate(): Promise<boolean> {
    return false;
  }

  async save(aggregate: ReservationAggregate, commandId: string): Promise<void> {
    // CAP-D01.01-R44 — safe to call again with the same commandId.
    if (this.appliedCommandIds.has(commandId)) {
      return;
    }
    if (this.forceNextSaveToFail) {
      this.forceNextSaveToFail = false;
      throw new Error("Simulated persistence failure");
    }
    this.byId.set(aggregate.getId().toString(), aggregate);
    this.appliedCommandIds.add(commandId);
    this.reservationIdByCommandId.set(commandId, aggregate.getId().toString());
    this.saveCallCount += 1;
    aggregate.pullEvents();
  }

  wasCommandApplied(commandId: string): boolean {
    return this.appliedCommandIds.has(commandId);
  }
}
