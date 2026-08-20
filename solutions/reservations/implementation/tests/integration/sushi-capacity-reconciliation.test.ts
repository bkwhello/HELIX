import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient, truncateSeatingDomainTables } from "./support/testDatabaseSafety.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";
import { TEPPANYAKI_SELF_SERVICE_CEILING } from "../../domain/availability/TeppanyakiSelfServicePacing.js";

/**
 * "CHIEF ENGINEER CORRECTION — R1.5 — Final Sushi Capacity
 * Reconciliation," §3/§4 — the permanent T1-T5 regression suite. Real
 * PostgreSQL throughout. T1/T2 use real overlapping CapacityCommitment
 * intervals (an existing commitment seeded with the SAME interval as the
 * request under test), per the same pattern established in
 * teppanyaki-self-service-pacing.test.ts. T4/T5 query the actual seeded
 * floor tables — this is the permanent, automated drift-prevention check
 * specifically requested to stop the 47/49/51 discrepancy from silently
 * recurring a fourth time.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let seedCounter = 0;

function sushiRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    commandId: `sushi-recon-cmd-${++seedCounter}`,
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 1,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    ...overrides,
  };
}

/** Seeds one Committed commitment with the SAME [18:00,19:30) Sushi interval every test below requests against, so it genuinely overlaps. */
async function seedExistingSushiOccupancy(partySize: number): Promise<void> {
  seedCounter += 1;
  const duration = CAPACITY_POOLS.Sushi.durationMinutes;
  const start = new Date("2026-08-20T18:00:00Z");
  const end = new Date(start.getTime() + duration * 60_000);
  await prisma.capacityCommitment.create({
    data: {
      commitmentId: `sushi-recon-seed-${seedCounter}`,
      capacityPoolId: "Sushi",
      startTime: start,
      endTime: end,
      partySize,
      status: "Committed",
      commandId: `sushi-recon-seed-cmd-${seedCounter}`,
    },
  });
}

describe("Sushi capacity reconciliation — T1/T2 (real PostgreSQL, real overlapping intervals)", () => {
  beforeAll(async () => {
    await resetDatabase(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });
  beforeEach(async () => {
    await resetDatabase(prisma);
    await seedTestContact(prisma);
  });

  it("T1 — existing Sushi occupancy 50 + request 1 -> ACCEPT", async () => {
    await seedExistingSushiOccupancy(50);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(sushiRequest({ partySize: 1 }));
    expect(result.type).toBe("CREATED");
  });

  it("T2 — existing Sushi occupancy 51 + request 1 -> CAPACITY_EXHAUSTED", async () => {
    await seedExistingSushiOccupancy(51);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(sushiRequest({ partySize: 1 }));
    expect(result.type).toBe("CAPACITY_UNAVAILABLE");
    if (result.type === "CAPACITY_UNAVAILABLE" && result.availability.type === "CAPACITY_EXHAUSTED") {
      expect(result.availability.maxExistingOccupancy).toBe(51);
      expect(result.availability.capacity).toBe(51);
    }
  });
});

describe("Sushi capacity reconciliation — T3 (Teppanyaki unaffected by this correction)", () => {
  it("T3 — Teppanyaki remains physical capacity 40, self-service ceiling 32, unchanged by the Sushi reconciliation", () => {
    expect(CAPACITY_POOLS.Teppanyaki.maximumCapacity).toBe(40);
    expect(TEPPANYAKI_SELF_SERVICE_CEILING).toBe(32);
  });
});

describe("Sushi capacity reconciliation — T4/T5 (seeded floor inventory, real PostgreSQL)", () => {
  beforeAll(async () => {
    await truncateSeatingDomainTables(prisma);
    await seedFloor(process.env["TEST_DATABASE_URL"]!);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("T4 — Table 14 remains absent", async () => {
    const table14 = await prisma.table.findFirst({ where: { operationalLabel: "Table 14" } });
    expect(table14).toBeNull();
  });

  it("T5 — the seeded Sushi physical-resource inventory sums to the authoritative Sushi capacity (51) — the permanent 47/49/51 drift-prevention check", async () => {
    const sushiTables = await prisma.table.findMany({ where: { areaId: "Sushi" } });
    const seededSushiTotal = sushiTables.reduce((sum, t) => sum + t.nominalCapacity, 0);
    expect(seededSushiTotal).toBe(CAPACITY_POOLS.Sushi.maximumCapacity);
    expect(seededSushiTotal).toBe(51);
  });

  it("T5 (Teppanyaki control) — the seeded Teppanyaki physical-resource inventory sums to 40, and the 32 self-service ceiling plays no part in that sum", async () => {
    const teppanyakiTables = await prisma.table.findMany({ where: { areaId: "Teppanyaki" } });
    const seededTeppanyakiTotal = teppanyakiTables.reduce((sum, t) => sum + t.nominalCapacity, 0);
    expect(seededTeppanyakiTotal).toBe(CAPACITY_POOLS.Teppanyaki.maximumCapacity);
    expect(seededTeppanyakiTotal).toBe(40);
    expect(seededTeppanyakiTotal).not.toBe(TEPPANYAKI_SELF_SERVICE_CEILING);
  });
});
