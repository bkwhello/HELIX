import { describe, it, expect } from "vitest";
import { SeatingAvailabilityService } from "../../application/floor/SeatingAvailabilityService.js";
import { ReservationRepository, SaveResult } from "../../domain/repositories/ReservationRepository.js";
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { ReservationAggregate } from "../../domain/aggregates/ReservationAggregate.js";
import { ReservationId } from "../../domain/value-objects/ReservationId.js";
import { Table } from "../../domain/floor/Table.js";
import { Seat } from "../../domain/floor/Seat.js";
import { ResourceBlock } from "../../domain/floor/ResourceBlock.js";
import { SeatingAssignment } from "../../domain/floor/SeatingAssignment.js";
import { validCreateCommand } from "../support/factories.js";

/**
 * P1-B4-A — unit coverage for SeatingAvailabilityService's own decision
 * logic, using minimal fake ports rather than real PostgreSQL. Two cases
 * specifically need this rather than tests/api/seating-availability.test.ts's
 * real-database coverage:
 *
 *  - "empty inventory returns an honest empty result": the shared
 *    integration test database has floor inventory seeded once, for the
 *    whole vitest run, by whichever floor-seating test file happens to run
 *    first (Table/Seat rows are deliberately never truncated between
 *    tests or files — see testDatabaseSafety.ts's own doc comment) — so a
 *    real-database test cannot reliably observe zero Table rows for an
 *    area without either reseeding-order assumptions or actively deleting
 *    shared fixture data other test files depend on. A fake FloorRepository
 *    whose findTablesByArea() returns [] proves the exact code path
 *    deterministically, with no such fragility.
 *  - NO_MANAGED_AREA: cheap and deterministic here; not otherwise required
 *    by the P1-B4-A test list, included for completeness at near-zero cost.
 */
function buildReservation(overrides: { preferredArea?: string; partySize?: number; reservationDate?: Date } = {}): ReservationAggregate {
  const cmd = validCreateCommand({
    reservationId: "res-fake-1",
    partySize: overrides.partySize ?? 3,
    ...(overrides.reservationDate ? { reservationDate: overrides.reservationDate } : {}),
    preferredArea: overrides.preferredArea as never,
  });
  const created = ReservationAggregate.create(cmd);
  if (!created.ok) throw new Error("test fixture setup failed: " + JSON.stringify(created.violations));
  return created.value;
}

class FakeReservationRepository implements ReservationRepository {
  constructor(private readonly reservation: ReservationAggregate | null) {}
  async findById(): Promise<ReservationAggregate | null> {
    return this.reservation;
  }
  async findByDate(): Promise<ReservationAggregate[]> {
    return [];
  }
  async findStartingBetween(): Promise<ReservationAggregate[]> {
    return [];
  }
  async findByCommandId(): Promise<ReservationAggregate | null> {
    return null;
  }
  async save(): Promise<SaveResult> {
    throw new Error("not used by SeatingAvailabilityService");
  }
  async findCriticalNotesByReservationId(): Promise<readonly never[]> {
    return [];
  }
  async findCriticalNotesByReservationIds(): Promise<readonly never[]> {
    return [];
  }
}

/** Every method returns "nothing found" — proves findTablesByArea([]) alone is sufficient to produce an honest empty result, with no other signal contributing. */
class EmptyFloorRepository implements FloorRepository {
  async findTableById(): Promise<Table | null> {
    return null;
  }
  async findTableByLabel(): Promise<Table | null> {
    return null;
  }
  async findTablesByArea(): Promise<readonly Table[]> {
    return [];
  }
  async findSeatById(): Promise<Seat | null> {
    return null;
  }
  async findSeatsByTableId(): Promise<readonly Seat[]> {
    return [];
  }
  async findOverlappingResourceBlocks(): Promise<readonly ResourceBlock[]> {
    return [];
  }
  async createResourceBlock(): Promise<ResourceBlock> {
    throw new Error("not used by SeatingAvailabilityService");
  }
  async listResourceBlocks(): Promise<readonly ResourceBlock[]> {
    return [];
  }
  async findResourceBlockById(): Promise<ResourceBlock | null> {
    return null;
  }
  async deleteResourceBlock(): Promise<void> {
    throw new Error("not used by SeatingAvailabilityService");
  }
  async findOverlappingResourceClaims(): Promise<{ readonly tableIds: ReadonlySet<string>; readonly seatIds: ReadonlySet<string> }> {
    return { tableIds: new Set(), seatIds: new Set() };
  }
  async findAssignmentByCommandId(): Promise<SeatingAssignment | null> {
    return null;
  }
  async findActiveAssignmentByReservationId(): Promise<SeatingAssignment | null> {
    return null;
  }
  async findActiveAssignmentStatusesByReservationIds(): Promise<ReadonlyMap<string, "Assigned" | "Seated">> {
    return new Map();
  }
  async findAssignmentResources(): Promise<readonly []> {
    return [];
  }
  async createAssignment(): Promise<SeatingAssignment> {
    throw new Error("not used by SeatingAvailabilityService");
  }
  async updateAssignmentStatus(): Promise<void> {
    throw new Error("not used by SeatingAvailabilityService");
  }
  async acquireSeatingResourceLock(): Promise<void> {
    throw new Error("not used by SeatingAvailabilityService");
  }
}

describe("SeatingAvailabilityService", () => {
  it("RESERVATION_NOT_FOUND when the repository has no such reservation", async () => {
    const service = new SeatingAvailabilityService(new FakeReservationRepository(null), new EmptyFloorRepository());
    const idResult = ReservationId.create("res-does-not-exist");
    if (!idResult.ok) throw new Error("test fixture id was rejected");
    const result = await service.getAvailableResourcesForReservation(idResult.value);
    expect(result.type).toBe("RESERVATION_NOT_FOUND");
  });

  it("NO_MANAGED_AREA when the reservation has no preferredArea", async () => {
    const reservation = buildReservation({ preferredArea: undefined });
    const service = new SeatingAvailabilityService(new FakeReservationRepository(reservation), new EmptyFloorRepository());
    const result = await service.getAvailableResourcesForReservation(reservation.getId());
    expect(result.type).toBe("NO_MANAGED_AREA");
  });

  it("empty inventory (findTablesByArea returns []) yields an honest empty result, not an error or a fabricated resource", async () => {
    const reservation = buildReservation({ preferredArea: "Sushi", partySize: 5 });
    const service = new SeatingAvailabilityService(new FakeReservationRepository(reservation), new EmptyFloorRepository());
    const result = await service.getAvailableResourcesForReservation(reservation.getId());
    expect(result.type).toBe("FOUND");
    if (result.type !== "FOUND") return;
    expect(result.availableResources).toEqual([]);
    expect(result.area).toBe("Sushi");
    expect(result.partySize).toBe(5);
    expect(result.assignmentStatus).toBe("Unassigned");
  });

  it("performs no writes — every FloorRepository/ReservationRepository write method is unreachable (throws if ever called)", async () => {
    const reservation = buildReservation({ preferredArea: "Teppanyaki" });
    const service = new SeatingAvailabilityService(new FakeReservationRepository(reservation), new EmptyFloorRepository());
    // Reaching FOUND without throwing already proves createAssignment/
    // updateAssignmentStatus/createResourceBlock/save were never invoked
    // — each fake implementation throws if called at all.
    await expect(service.getAvailableResourcesForReservation(reservation.getId())).resolves.toMatchObject({ type: "FOUND" });
  });

  // R1.5-P5 — H6: AvailableResourceRow.parentTable now carries nominalCapacity
  // (the same Table.nominalCapacity SeatabilityEvaluator already uses), so
  // the Reception picker can group/count occupied-vs-free per grill without
  // a second request or a second capacity source.
  class OneGrillFloorRepository extends EmptyFloorRepository {
    override async findTablesByArea(): Promise<readonly Table[]> {
      return [{ id: "grill-1", areaId: "Teppanyaki", operationalLabel: "Grill 1", nominalCapacity: 8, supportsSharedSeating: true, status: "Active" }];
    }
    override async findSeatsByTableId(): Promise<readonly Seat[]> {
      return [
        { id: "grill-1-seat-1", tableId: "grill-1", operationalLabel: "1-01", status: "Active", createdAt: new Date() },
        { id: "grill-1-seat-2", tableId: "grill-1", operationalLabel: "1-02", status: "Active", createdAt: new Date() },
      ];
    }
  }

  it("a Teppanyaki Seat's parentTable includes nominalCapacity, not just id/operationalLabel", async () => {
    const reservation = buildReservation({ preferredArea: "Teppanyaki", partySize: 2 });
    const service = new SeatingAvailabilityService(new FakeReservationRepository(reservation), new OneGrillFloorRepository());
    const result = await service.getAvailableResourcesForReservation(reservation.getId());
    expect(result.type).toBe("FOUND");
    if (result.type !== "FOUND") return;
    expect(result.availableResources).toHaveLength(2);
    for (const row of result.availableResources) {
      expect(row.kind).toBe("Seat");
      expect(row.parentTable).toEqual({ id: "grill-1", operationalLabel: "Grill 1", nominalCapacity: 8 });
    }
  });
});
