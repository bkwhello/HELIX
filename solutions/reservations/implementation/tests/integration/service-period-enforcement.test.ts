import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient, truncateServicePeriodDomainTables, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaServicePeriodOverrideStore } from "../../infrastructure/persistence/PrismaServicePeriodOverrideStore.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * Chief Engineer "R1.6-C0 ServicePeriod Enforcement" assignment §26 (T1-T18)
 * — real PostgreSQL evidence that CAP-D02 ServicePeriod authority is
 * genuinely enforced through the full AvailabilityOrchestrator.createWithCapacity
 * path, not merely at the ServicePeriod unit layer (already proven by
 * R1.6-A's own tests/integration/service-period.test.ts, untouched here).
 *
 * 2026-08-17 is a Monday, 2026-08-21 is a Friday (2026-08-20 is a
 * Thursday — established independently in R1.6-A's own tests). All times
 * below are Europe/Amsterdam CEST (UTC+2) in August.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };
const overrideStore = new PrismaServicePeriodOverrideStore(prisma);
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `sp-enforce-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateServicePeriodDomainTables(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateServicePeriodDomainTables(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedTestContact(prisma);
});

const NOW = new Date("2026-08-10T10:00:00Z"); // well before any test date, so the same-day cutoff never spuriously applies

function baseRequest(overrides: Record<string, unknown> = {}) {
  return {
    commandId: cmd(),
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "ExistingContact" as const, contactId: "contact-1" },
    reservationDate: new Date("2026-08-17T15:00:00Z"), // Monday 17:00 CEST — overridden per test
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
    preferredArea: "Sushi" as const,
    actor: staffActor,
    ...overrides,
  };
}

describe("T1/T2 — Monday grid boundary at the OPENING edge", () => {
  it("T1 — Monday 16:45 -> SERVICE_PERIOD_REJECTED (OUTSIDE_SERVICE_PERIOD)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T14:45:00Z") }));
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
    if (result.type === "SERVICE_PERIOD_REJECTED") expect(result.eligibility.type).toBe("OUTSIDE_SERVICE_PERIOD");
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
  });

  it("T2 — Monday 17:00 -> allowed, subject to capacity (CREATED)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z") }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T3/T4 — Monday grid boundary at the CLOSING edge", () => {
  it("T3 — Monday 21:00 -> allowed (the inclusive final start)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T19:00:00Z") }));
    expect(result.type).toBe("CREATED");
  });

  it("T4 — Monday 21:15 -> SERVICE_PERIOD_REJECTED", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T19:15:00Z") }));
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
    if (result.type === "SERVICE_PERIOD_REJECTED") expect(result.eligibility.type).toBe("OUTSIDE_SERVICE_PERIOD");
  });
});

describe("T5/T6 — Friday grid boundary at the OPENING edge", () => {
  it("T5 — Friday 11:45 -> SERVICE_PERIOD_REJECTED", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-21T09:45:00Z") }));
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });

  it("T6 — Friday 12:00 -> allowed", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-21T10:00:00Z") }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T7 — 15-minute grid enforced through the full Create path", () => {
  it("Monday 18:07 (non-grid) -> SERVICE_PERIOD_REJECTED even though it is well within the window's hour range", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T16:07:00Z") })); // 18:07 CEST
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
    if (result.type === "SERVICE_PERIOD_REJECTED") expect(result.eligibility.type).toBe("OUTSIDE_SERVICE_PERIOD");
  });
});

describe("T8 — ClosingDay blocks live creation even on a normally-open date/time", () => {
  it("Monday 18:00, with the whole date marked closed -> SERVICE_PERIOD_REJECTED (CLOSED), even though capacity/tables exist", async () => {
    const { orchestrator, closingDayStore } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const mondayUtcMidnight = new Date("2026-08-17T00:00:00.000Z");
    await closingDayStore.add({ fromDate: mondayUtcMidnight, toDate: mondayUtcMidnight, reason: "Test closure", createdBy: "staff-1" });

    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T16:00:00Z") }));
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
    if (result.type === "SERVICE_PERIOD_REJECTED") expect(result.eligibility.type).toBe("CLOSED");
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
  });
});

describe("T9 — date-specific override replaces (never unions with) the weekly schedule", () => {
  it("a special Friday 17:00-20:00 override rejects the normal-Friday 13:00 start and accepts 17:00", async () => {
    await overrideStore.upsert({
      area: "Sushi",
      date: "2026-08-21",
      status: "Open",
      windows: [{ firstStartMinute: 17 * 60, lastStartMinute: 20 * 60 }],
      createdBy: "staff-1",
    });
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });

    const rejected = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-21T11:00:00Z") })); // 13:00 CEST — normally valid, not under the override
    expect(rejected.type).toBe("SERVICE_PERIOD_REJECTED");

    const allowed = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-21T15:00:00Z"), commandId: cmd() })); // 17:00 CEST — valid under the override
    expect(allowed.type).toBe("CREATED");
  });
});

describe("T10/T11 — area-specific overrides remain independent", () => {
  it("T10 — a Sushi-only override closing Monday does not affect Teppanyaki", async () => {
    await overrideStore.upsert({ area: "Sushi", date: "2026-08-17", status: "Closed", windows: [], createdBy: "staff-1" });
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });

    const sushiResult = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), preferredArea: "Sushi" }));
    expect(sushiResult.type).toBe("SERVICE_PERIOD_REJECTED");

    const teppanyakiResult = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), preferredArea: "Teppanyaki", commandId: cmd() })
    );
    expect(teppanyakiResult.type).toBe("CREATED");
  });

  it("T11 — a Teppanyaki-only override closing Monday does not affect Sushi", async () => {
    await overrideStore.upsert({ area: "Teppanyaki", date: "2026-08-17", status: "Closed", windows: [], createdBy: "staff-1" });
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });

    const teppanyakiResult = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), preferredArea: "Teppanyaki" }));
    expect(teppanyakiResult.type).toBe("SERVICE_PERIOD_REJECTED");

    const sushiResult = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), preferredArea: "Sushi", commandId: cmd() }));
    expect(sushiResult.type).toBe("CREATED");
  });
});

describe("T12/T13 — ServicePeriod vs BookingPolicy: distinct concerns, correct precedence", () => {
  it("T12 — a same-day self-service request at 17:01 for a valid 20:00 start is ROUTE_TO_STAFF, NEVER SERVICE_PERIOD_REJECTED", async () => {
    // Saturday 2026-08-22, service period 12:00-21:00 — 20:00 is a valid, offered start.
    const sameDayLate = new Date("2026-08-22T15:01:00Z"); // 17:01 CEST
    const { orchestrator } = buildHarness(prisma, sameDayLate, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({ actor: guestChannelActor, reservationDate: new Date("2026-08-22T18:00:00Z") }) // 20:00 CEST same day
    );
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") expect(result.policy.type).toBe("ROUTE_TO_STAFF");
  });

  it("T13 — staff at 17:01 may still create the identical valid same-day 20:00 reservation", async () => {
    const sameDayLate = new Date("2026-08-22T15:01:00Z");
    const { orchestrator } = buildHarness(prisma, sameDayLate, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ actor: staffActor, reservationDate: new Date("2026-08-22T18:00:00Z") }));
    expect(result.type).toBe("CREATED");
  });
});

describe("T14 — staff is NOT exempt from ServicePeriod itself", () => {
  it("staff requesting Monday 15:00 (outside the window) is rejected, even though staff are exempt from BookingPolicy", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ actor: staffActor, reservationDate: new Date("2026-08-17T13:00:00Z") })); // 15:00 CEST
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });
});

describe("T15/AC-C0-09/10/11 — invalid ServicePeriod + CreateNewContact leaves zero orphan state (real PostgreSQL)", () => {
  it("no Contact, no Reservation, no CapacityCommitment, no CommunicationMessage survive a ServicePeriod rejection", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({
        reservationDate: new Date("2026-08-17T14:45:00Z"), // Monday 16:45 — outside
        contactSelection: { type: "CreateNewContact", displayName: "Orphan Test Guest", email: "orphan-sp@example.com" },
      })
    );
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");

    const contacts = await prisma.contact.findMany({ where: { emailRaw: "orphan-sp@example.com" } });
    expect(contacts).toHaveLength(0);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
    const commitments = await prisma.capacityCommitment.findMany();
    expect(commitments).toHaveLength(0);
    const messages = await prisma.communicationMessage.findMany({ where: { recipientEmail: "orphan-sp@example.com" } });
    expect(messages).toHaveLength(0);
  });

  it("a retried commandId for the same rejected request remains safely rejected — no partial state on retry either", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const request = baseRequest({
      reservationDate: new Date("2026-08-17T14:45:00Z"),
      contactSelection: { type: "CreateNewContact", displayName: "Retry Guest", email: "retry-sp@example.com" },
    });
    const first = await orchestrator.createWithCapacity(request);
    expect(first.type).toBe("SERVICE_PERIOD_REJECTED");
    const second = await orchestrator.createWithCapacity(request); // identical commandId
    expect(second.type).toBe("SERVICE_PERIOD_REJECTED");

    const contacts = await prisma.contact.findMany({ where: { emailRaw: "retry-sp@example.com" } });
    expect(contacts).toHaveLength(0);
  });
});

describe("T16 — duration may extend past the final booking start", () => {
  it("a Teppanyaki reservation starting exactly at 21:00 (150-minute duration, ending 23:30) is not rejected by ServicePeriod", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T19:00:00Z"), preferredArea: "Teppanyaki", partySize: 4 }) // Monday 21:00 CEST
    );
    expect(result.type).toBe("CREATED");
  });
});

describe("T17 — Europe/Amsterdam DST, full application-flow integration", () => {
  it("2026-03-29 spring-forward: a Sunday 12:00 CEST start (after the 01:00 UTC transition) is valid", async () => {
    const { orchestrator } = buildHarness(prisma, new Date("2026-03-20T10:00:00Z"), { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-03-29T10:00:00Z") })); // 12:00 CEST
    expect(result.type).toBe("CREATED");
  });

  it("2026-03-29 spring-forward: 11:45 CEST (before the Sunday window opens) is rejected — proves no fixed-offset miscalculation", async () => {
    const { orchestrator } = buildHarness(prisma, new Date("2026-03-20T10:00:00Z"), { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-03-29T09:45:00Z") })); // 11:45 CEST
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });

  it("2026-10-25 fall-back: a Sunday 12:00 CET start (after the 01:00 UTC transition) is valid", async () => {
    const { orchestrator } = buildHarness(prisma, new Date("2026-10-20T10:00:00Z"), { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-10-25T11:00:00Z") })); // 12:00 CET
    expect(result.type).toBe("CREATED");
  });

  it("2026-10-25 fall-back: 11:45 CET (before the Sunday window opens) is rejected — proves no stale-offset miscalculation", async () => {
    const { orchestrator } = buildHarness(prisma, new Date("2026-10-20T10:00:00Z"), { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-10-25T10:45:00Z") })); // 11:45 CET
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });
});

describe("T18 — existing capacity/pacing rules remain unchanged once ServicePeriod passes", () => {
  it("a ServicePeriod-valid request that exceeds physical capacity still correctly returns CAPACITY_UNAVAILABLE, not a ServicePeriod outcome", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const first = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), partySize: 51 })); // fills exact Sushi capacity
    expect(first.type).toBe("CREATED");
    const second = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), partySize: 1, commandId: cmd() }));
    expect(second.type).toBe("CAPACITY_UNAVAILABLE");
  });

  it("Teppanyaki self-service pacing (>32, <=40 -> ROUTE_TO_STAFF) still applies unchanged for a ServicePeriod-valid start", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const seed = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), preferredArea: "Teppanyaki", partySize: 32 })
    );
    expect(seed.type).toBe("CREATED");
    const overPacing = await orchestrator.createWithCapacity(
      baseRequest({
        actor: guestChannelActor,
        reservationDate: new Date("2026-08-17T15:00:00Z"),
        preferredArea: "Teppanyaki",
        partySize: 1,
        commandId: cmd(),
      })
    );
    expect(overPacing.type).toBe("BOOKING_POLICY_REJECTED");
    if (overPacing.type === "BOOKING_POLICY_REJECTED") expect(overPacing.policy.type).toBe("ROUTE_TO_STAFF");
  });
});

describe("Source-Category Matrix — every ReservationSourceCategory is ServicePeriod-enforced identically (no source-based bypass)", () => {
  it.each(Object.values(ReservationSourceCategory))("source=%s is rejected for an outside-window start, exactly like any other source", async (category) => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T14:45:00Z"), source: { category }, commandId: cmd() })
    );
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });
});

describe("WalkIn — no evidence-based bypass; a WalkIn during real ServicePeriod-open hours succeeds normally", () => {
  it("a WalkIn source reservation for a valid, in-window start is created normally", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T15:00:00Z"), source: { category: ReservationSourceCategory.WalkIn } })
    );
    expect(result.type).toBe("CREATED");
  });

  it("a WalkIn source reservation for an outside-window start is rejected exactly like any other source (no bypass invented)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({ reservationDate: new Date("2026-08-17T14:45:00Z"), source: { category: ReservationSourceCategory.WalkIn } })
    );
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });
});

describe("Historical correction — the one explicit, narrowly-scoped, evidence-based bypass (assignment §8)", () => {
  it("isHistoricalCorrection=true bypasses ServicePeriod entirely, for any source", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(
      baseRequest({
        reservationDate: new Date("2026-08-17T14:45:00Z"), // outside the window
        isHistoricalCorrection: true,
        historicalCorrectionReason: "Migrated from Guestplan export, original booking predates ServicePeriod enforcement.",
      })
    );
    expect(result.type).toBe("CREATED");
  });

  it("without isHistoricalCorrection, the identical outside-window request is rejected — the bypass is opt-in, never a default", async () => {
    const { orchestrator } = buildHarness(prisma, NOW, { enforceServicePeriod: true });
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T14:45:00Z") }));
    expect(result.type).toBe("SERVICE_PERIOD_REJECTED");
  });
});

describe("Backward compatibility — omitting servicePeriodService entirely preserves pre-R1.6-C0 behavior exactly", () => {
  it("without enforceServicePeriod, an otherwise-outside-window request is created normally (the pre-existing, unenforced default)", async () => {
    const { orchestrator } = buildHarness(prisma, NOW); // enforceServicePeriod omitted
    const result = await orchestrator.createWithCapacity(baseRequest({ reservationDate: new Date("2026-08-17T14:45:00Z") }));
    expect(result.type).toBe("CREATED");
  });
});
