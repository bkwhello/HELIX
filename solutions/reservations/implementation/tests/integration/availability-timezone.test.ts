import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { Actor, ActorKind } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";

/**
 * CAP-D02.03 §timezone — real PostgreSQL evidence for both 2026
 * Europe/Amsterdam DST transitions (verified independently in
 * tests/domain/service-time.test.ts: 2026-03-29 spring-forward,
 * 2026-10-25 fall-back — see that file's header for the day-of-week
 * derivation). These tests exercise the REAL storage layer
 * (timestamptz round-trip) and the full orchestrator + booking-policy
 * path at each transition, using proper IANA timezone conversion
 * (domain/availability/ServiceTime.ts) rather than a fixed UTC offset —
 * a fixed +01:00/+02:00 offset would silently produce the WRONG
 * same-day cutoff decision on exactly these dates, which is what the
 * discriminating tests below are built to catch.
 */
const prisma = createTestPrismaClient();
const guestChannelActor: Actor = { id: "guest-channel-1", kind: ActorKind.ApprovedGuestChannel };
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `tz-cmd-${cmdCounter}`;
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

describe("PostgreSQL timestamptz round-trip across DST transitions", () => {
  it("preserves the exact instant across the 2026-03-29 spring-forward transition (01:00 UTC)", async () => {
    const instant = new Date("2026-03-29T01:00:00.000Z");
    const row = await prisma.capacityCommitment.create({
      data: {
        commitmentId: "dst-spring-1",
        capacityPoolId: "Sushi",
        startTime: instant,
        endTime: new Date(instant.getTime() + 90 * 60_000),
        partySize: 2,
        status: "Committed",
        commandId: cmd(),
      },
    });
    expect(row.startTime.getTime()).toBe(instant.getTime());

    const reread = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId: "dst-spring-1" } });
    expect(reread.startTime.getTime()).toBe(instant.getTime());
  });

  it("preserves the exact instant across the 2026-10-25 fall-back transition (01:00 UTC), including the ambiguous local hour", async () => {
    // 01:30 UTC on this date is the SECOND occurrence of 02:xx local time
    // (Europe/Amsterdam repeats 02:00-02:59 that day) — ambiguous only in
    // local wall-clock terms, never in the stored UTC instant.
    const instant = new Date("2026-10-25T01:30:00.000Z");
    await prisma.capacityCommitment.create({
      data: {
        commitmentId: "dst-fall-1",
        capacityPoolId: "Sushi",
        startTime: instant,
        endTime: new Date(instant.getTime() + 90 * 60_000),
        partySize: 2,
        status: "Committed",
        commandId: cmd(),
      },
    });
    const reread = await prisma.capacityCommitment.findUniqueOrThrow({ where: { commitmentId: "dst-fall-1" } });
    expect(reread.startTime.getTime()).toBe(instant.getTime());
  });
});

describe("Same-day cutoff through the full orchestrator, real PostgreSQL — 2026-03-29 spring-forward (CET -> CEST)", () => {
  it("allows a same-day guest booking at 16:55 local (CEST, UTC+2) and persists it", async () => {
    const now = new Date("2026-03-29T14:55:00Z"); // 16:55 CEST
    const { orchestrator } = buildHarness(prisma, now);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-03-29T16:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: guestChannelActor,
    });
    expect(result.type).toBe("CREATED");
  });

  it("rejects a same-day guest booking at 17:05 local (CEST, UTC+2) — a fixed +01:00 (CET) offset would wrongly compute this as 16:05 and allow it", async () => {
    const now = new Date("2026-03-29T15:05:00Z"); // 17:05 CEST; would be 16:05 under the WRONG fixed CET offset
    const { orchestrator } = buildHarness(prisma, now);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-03-29T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: guestChannelActor,
    });
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") {
      expect(result.policy.type).toBe("REJECTED_CUTOFF");
    }
  });
});

describe("Same-day cutoff through the full orchestrator, real PostgreSQL — 2026-10-25 fall-back (CEST -> CET)", () => {
  it("allows a same-day guest booking at 16:55 local (CET, UTC+1) — a stale +02:00 (CEST) offset would wrongly compute this as 17:55 and reject it", async () => {
    const now = new Date("2026-10-25T15:55:00Z"); // 16:55 CET; would be 17:55 under the WRONG stale CEST offset
    const { orchestrator } = buildHarness(prisma, now);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-10-25T17:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: guestChannelActor,
    });
    expect(result.type).toBe("CREATED");
  });

  it("rejects a same-day guest booking at 17:05 local (CET, UTC+1)", async () => {
    const now = new Date("2026-10-25T16:05:00Z"); // 17:05 CET
    const { orchestrator } = buildHarness(prisma, now);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-10-25T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: guestChannelActor,
    });
    expect(result.type).toBe("BOOKING_POLICY_REJECTED");
    if (result.type === "BOOKING_POLICY_REJECTED") {
      expect(result.policy.type).toBe("REJECTED_CUTOFF");
    }
  });
});

describe("Local-date grouping near midnight, real PostgreSQL — UTC calendar date differs from Amsterdam calendar date", () => {
  it("evaluates capacity correctly for a booking whose local Amsterdam date is already the next day while its UTC instant is still the previous day", async () => {
    // 2026-03-28T23:15:00Z is CET (+1, transition hasn't happened yet) ->
    // local 2026-03-29T00:15 — local date is the 29th even though the UTC
    // instant reads the 28th. This only proves the create path does not
    // crash or misbehave at this boundary; exact local-date attribution is
    // covered directly in tests/domain/service-time.test.ts.
    const { orchestrator } = buildHarness(prisma, new Date("2026-03-20T10:00:00Z"));
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "ExistingContact", contactId: "contact-1" },
      reservationDate: new Date("2026-03-28T23:15:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: guestChannelActor,
    });
    expect(result.type).toBe("CREATED");

    const rows = await prisma.capacityCommitment.findMany();
    expect(rows).toHaveLength(1);
    expect(rows[0]?.startTime.toISOString()).toBe("2026-03-28T23:15:00.000Z");
  });
});
