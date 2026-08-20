import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { TEPPANYAKI_SELF_SERVICE_CEILING } from "../../domain/availability/TeppanyakiSelfServicePacing.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";

/**
 * "OWNER DECISION — TEPPANYAKI SELF-SERVICE PACING POLICY" — permanent
 * regression tests T1-T8 (§8 of that decision). Real PostgreSQL
 * throughout, real overlapping CapacityCommitment intervals (not merely
 * reservation totals for the day) — an existing commitment is seeded with
 * the SAME interval as the request under test, so
 * evaluateSimultaneousOccupancy's real overlap detection, not a naive
 * sum, produces the "existing occupancy" figure each test starts from.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };
const NOW = new Date("2026-08-10T10:00:00Z");
let requestCounter = 0;
let seedCounter = 0;

function teppanyakiRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  requestCounter += 1;
  return {
    commandId: `pacing-cmd-${requestCounter}`,
    servicePeriodId: "sp-teppanyaki",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Teppanyaki",
    actor: staffActor,
    ...overrides,
  };
}

/** Seeds one Committed commitment with the SAME [18:00,20:30) Teppanyaki interval every test in this file requests against, so it genuinely overlaps rather than merely coexisting somewhere in the same day. */
async function seedExistingOccupancy(partySize: number, poolId: "Teppanyaki" | "Sushi" = "Teppanyaki"): Promise<void> {
  seedCounter += 1;
  const duration = CAPACITY_POOLS[poolId].durationMinutes;
  const start = new Date("2026-08-20T18:00:00Z");
  const end = new Date(start.getTime() + duration * 60_000);
  await prisma.capacityCommitment.create({
    data: {
      commitmentId: `pacing-seed-${seedCounter}`,
      capacityPoolId: poolId,
      startTime: start,
      endTime: end,
      partySize,
      status: "Committed",
      commandId: `pacing-seed-cmd-${seedCounter}`,
    },
  });
}

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

describe("Teppanyaki self-service pacing ceiling — sanity", () => {
  it("the ceiling is exactly 32 (40 * 80%)", () => {
    expect(TEPPANYAKI_SELF_SERVICE_CEILING).toBe(32);
  });
});

describe("T1 — occupancy 31 + self-service party 1 = 32 -> ACCEPT", () => {
  it("does not route to staff at exactly the ceiling", async () => {
    await seedExistingOccupancy(31);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 1, actor: guestChannelActor }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T2 — occupancy 31 + self-service party 2 = 33 -> ROUTE_TO_STAFF", () => {
  it("routes to staff, not CAPACITY_EXHAUSTED", async () => {
    await seedExistingOccupancy(31);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 2, actor: guestChannelActor }));
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") expect(result.policy.type).toBe("ROUTE_TO_STAFF");
  });
});

describe("T3 — occupancy 32 + self-service party 1 = 33 -> ROUTE_TO_STAFF", () => {
  it("routes to staff", async () => {
    await seedExistingOccupancy(32);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 1, actor: guestChannelActor }));
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") expect(result.policy.type).toBe("ROUTE_TO_STAFF");
  });
});

describe("T4 — occupancy 32 + staff party 8 = 40 -> ACCEPT (staff exempt from the 32 ceiling)", () => {
  it("accepts, subject to CanSeat", async () => {
    await seedExistingOccupancy(32);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 8, actor: staffActor }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T5 — occupancy 32 + staff party 9 = 41 -> CAPACITY_EXHAUSTED", () => {
  it("rejects on actual physical capacity, not the pacing ceiling", async () => {
    await seedExistingOccupancy(32);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 9, actor: staffActor }));
    expect(result.type).toBe("CAPACITY_UNAVAILABLE");
    if (result.type === "CAPACITY_UNAVAILABLE" && result.availability.type === "CAPACITY_EXHAUSTED") {
      expect(result.availability.capacity).toBe(40);
    }
  });
});

describe("T6 — occupancy 39 + staff party 1 = 40 -> ACCEPT", () => {
  it("accepts exactly at physical capacity", async () => {
    await seedExistingOccupancy(39);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 1, actor: staffActor }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T7 — occupancy 40 + staff party 1 = 41 -> CAPACITY_EXHAUSTED", () => {
  it("rejects one over physical capacity", async () => {
    await seedExistingOccupancy(40);
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(teppanyakiRequest({ partySize: 1, actor: staffActor }));
    expect(result.type).toBe("CAPACITY_UNAVAILABLE");
  });
});

describe("T8 — Sushi is unaffected by the Teppanyaki 80% pacing policy", () => {
  it("a Sushi self-service request projected well past 80% of Sushi capacity (51) is NOT routed to staff on pacing grounds", async () => {
    // 80% of Sushi's 51 would be ~40.8 — seed occupancy at 42 (already
    // past that ratio) and request 1 more (43 total, still <= 51 physical
    // capacity) to prove no Sushi-side pacing ceiling exists at all.
    await seedExistingOccupancy(42, "Sushi");
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(
      teppanyakiRequest({ partySize: 1, actor: guestChannelActor, preferredArea: "Sushi" })
    );
    expect(result.type).toBe("CREATED");
  });

  it("a Sushi request landing exactly at physical capacity (51) still only fails on CAPACITY_EXHAUSTED, never ROUTE_TO_STAFF for pacing reasons", async () => {
    await seedExistingOccupancy(51, "Sushi");
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(
      teppanyakiRequest({ partySize: 1, actor: guestChannelActor, preferredArea: "Sushi" })
    );
    expect(result.type).toBe("CAPACITY_UNAVAILABLE");
    if (result.type === "CAPACITY_UNAVAILABLE" && result.availability.type === "CAPACITY_EXHAUSTED") {
      expect(result.availability.capacity).toBe(51);
    }
  });
});
