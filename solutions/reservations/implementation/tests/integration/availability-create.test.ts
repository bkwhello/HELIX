import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";

/**
 * CAP-D02.03 — real PostgreSQL evidence. §"This capability MUST be
 * tested against real PostgreSQL. SQLite is NOT acceptable as
 * concurrency evidence for CAP-D02.03." These tests run
 * AvailabilityOrchestrator end-to-end against the dedicated, sentinel-
 * gated TEST_DATABASE_URL instance (R1.4 P0 — see
 * tests/integration/support/testDatabaseSafety.ts), never the pilot's
 * DATABASE_URL — no mocks/fakes for persistence.
 */
const prisma = createTestPrismaClient();

const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z"); // well before any requested date, so the same-day cutoff never applies
let requestCounter = 0;

function baseRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  requestCounter += 1;
  return {
    commandId: `create-cmd-${requestCounter}`,
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "ExistingContact", contactId: "contact-1" },
    reservationDate: new Date("2026-08-20T18:00:00Z"),
    partySize: 4,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi",
    actor: staffActor,
    ...overrides,
  };
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

describe("AvailabilityOrchestrator.createWithCapacity — mandatory false-sold-out regression, real PostgreSQL", () => {
  it("does not falsely reject C when A and B occupy non-overlapping slices of the requested interval (A 18:00-18:30/40, B 19:00-19:30/40, C 18:15-19:15/20, capacity 60)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);

    // A and B are seeded directly as real, persisted Committed rows rather
    // than via orchestrator.createWithCapacity: the Sushi pool's booking
    // duration is fixed at 90 minutes (CAPACITY_POOLS) for every
    // orchestrator-driven create, so two 90-minute Sushi bookings starting
    // an hour apart would always overlap each other too, which cannot
    // reproduce the "A and B never overlap, but both overlap C" shape the
    // original defect needs. Seeding the exact 30-minute intervals from
    // the architecture decision directly still exercises the real thing
    // under test — findOverlappingCommitments's SQL query and
    // evaluateSimultaneousOccupancy's algorithm, both against real
    // PostgreSQL — for the request that actually goes through the
    // orchestrator (C).
    await prisma.capacityCommitment.create({
      data: {
        commitmentId: "seed-a",
        capacityPoolId: "Sushi",
        startTime: new Date("2026-08-20T18:00:00Z"),
        endTime: new Date("2026-08-20T18:30:00Z"),
        partySize: 40,
        status: "Committed",
        commandId: "seed-cmd-a",
      },
    });
    await prisma.capacityCommitment.create({
      data: {
        commitmentId: "seed-b",
        capacityPoolId: "Sushi",
        startTime: new Date("2026-08-20T19:00:00Z"),
        endTime: new Date("2026-08-20T19:30:00Z"),
        partySize: 40,
        status: "Committed",
        commandId: "seed-cmd-b",
      },
    });

    // C is a real orchestrator create: requested [18:15, 19:15) via a
    // Teppanyaki-shaped ad hoc pool would need a 60-minute duration, which
    // Sushi does not offer — instead this asserts the same property
    // directly against the fixed 90-minute Sushi interval starting 18:15,
    // i.e. [18:15, 19:45): A overlaps only its first 15 minutes, B
    // overlaps only its last 30 minutes, and the two never coincide, so
    // the true max simultaneous occupancy is max(40, 40) = 40, not
    // 40+40+20=100.
    const c = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-20T18:15:00Z"), partySize: 20, servicePeriodId: "sp-c" })
    );
    expect(c.type).toBe("CREATED");

    const rows = await prisma.capacityCommitment.findMany({ orderBy: { startTime: "asc" } });
    expect(rows).toHaveLength(3);
    expect(rows.every((r) => r.status === "Committed")).toBe(true);
  });
});

describe("AvailabilityOrchestrator.createWithCapacity — real capacity exhaustion", () => {
  it("accepts a request that exactly fills remaining capacity, then rejects the next one", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);

    const first = await orchestrator.createWithCapacity(baseRequest({ partySize: 60 }));
    expect(first.type).toBe("CREATED");

    const second = await orchestrator.createWithCapacity(baseRequest({ partySize: 1 }));
    expect(second.type).toBe("CAPACITY_UNAVAILABLE");
    if (second.type === "CAPACITY_UNAVAILABLE" && second.availability.type === "CAPACITY_EXHAUSTED") {
      expect(second.availability.maxExistingOccupancy).toBe(60);
      expect(second.availability.capacity).toBe(60);
    }

    const rows = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    expect(rows).toHaveLength(1);
  });

  it("persists exactly one Committed capacity_commitments row per successful create, correctly linked to the reservation", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(baseRequest({ partySize: 6 }));
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const rows = await prisma.capacityCommitment.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.status).toBe("Committed");
    expect(rows[0]?.partySize).toBe(6);
    expect(rows[0]?.reservationId).toBe(result.outcome.reservationId);
    expect(rows[0]?.capacityPoolId).toBe("Sushi");
  });
});

describe("AvailabilityOrchestrator.createWithCapacity — booking policy is evaluated separately from capacity", () => {
  const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };

  it("routes a party of 9 to staff even when the pool is empty (never reported as a capacity failure)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity(baseRequest({ partySize: 9, actor: guestChannelActor }));
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") {
      expect(result.policy.type).toBe("ROUTE_TO_STAFF");
    }
    const rows = await prisma.capacityCommitment.findMany();
    expect(rows).toHaveLength(0);
  });

  it("rejects a same-day guest booking after the 17:00 Europe/Amsterdam cutoff, but allows staff to book the identical request", async () => {
    // now = 2026-08-20T16:00:00Z = 18:00 CEST — past the 17:00 local cutoff
    const sameDayLate = new Date("2026-08-20T16:00:00Z");
    const { orchestrator: guestOrchestrator } = buildHarness(prisma, sameDayLate);
    const guestResult = await guestOrchestrator.createWithCapacity(
      baseRequest({ actor: guestChannelActor, reservationDate: new Date("2026-08-20T18:30:00Z") })
    );
    expect(guestResult.type).toBe("BOOKING_POLICY_REJECTED");
    if (guestResult.type === "BOOKING_POLICY_REJECTED") {
      expect(guestResult.policy.type).toBe("REJECTED_CUTOFF");
    }

    const { orchestrator: staffOrchestrator } = buildHarness(prisma, sameDayLate);
    const staffResult = await staffOrchestrator.createWithCapacity(
      baseRequest({ actor: staffActor, reservationDate: new Date("2026-08-20T18:30:00Z") })
    );
    expect(staffResult.type).toBe("CREATED");
  });
});

describe("AvailabilityOrchestrator.createWithCapacity — CAP-D01.01-R51 closing days still apply, checked before any capacity write", () => {
  it("rejects a create for a marked-closed date without writing a capacity commitment", async () => {
    const { orchestrator, closingDayStore } = buildHarness(prisma, NOW);
    await closingDayStore.add({ fromDate: new Date("2026-08-20T00:00:00Z"), toDate: new Date("2026-08-20T00:00:00Z"), createdBy: "staff-1" });

    const result = await orchestrator.createWithCapacity(baseRequest());
    expect(result.type).toBe("VALIDATION_FAILED");
    const rows = await prisma.capacityCommitment.findMany();
    expect(rows).toHaveLength(0);
  });
});

describe("AvailabilityOrchestrator.createWithCapacity — database-level invariants (CAP-D02.03 §22)", () => {
  it("rejects a reservation with a non-positive party size at the database layer (defense in depth beyond application validation)", async () => {
    await expect(
      prisma.capacityCommitment.create({
        data: {
          commitmentId: "manual-1",
          capacityPoolId: "Sushi",
          startTime: new Date("2026-08-20T18:00:00Z"),
          endTime: new Date("2026-08-20T19:30:00Z"),
          partySize: 0,
          status: "Committed",
          commandId: "manual-cmd-1",
        },
      })
    ).rejects.toThrow();
  });

  it("rejects a commitment whose startTime is not before its endTime at the database layer", async () => {
    await expect(
      prisma.capacityCommitment.create({
        data: {
          commitmentId: "manual-2",
          capacityPoolId: "Sushi",
          startTime: new Date("2026-08-20T19:30:00Z"),
          endTime: new Date("2026-08-20T18:00:00Z"),
          partySize: 4,
          status: "Committed",
          commandId: "manual-cmd-2",
        },
      })
    ).rejects.toThrow();
  });
});
