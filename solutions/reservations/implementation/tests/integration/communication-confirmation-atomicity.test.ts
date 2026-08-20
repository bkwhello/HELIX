import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §6/§39
 * (F1-F4) — real PostgreSQL evidence that confirmation-intent creation is
 * genuinely atomic with the Reservation transaction, in both directions:
 * an upstream failure prevents the confirmation intent from ever being
 * written, AND a downstream failure (including the confirmation-intent
 * write itself) rolls back an already-written Reservation.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `atomicity-cmd-${cmdCounter}`;
}

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetDatabase(prisma);
  await truncateCommunicationDomainTables(prisma);
  await seedTestContact(prisma); // no email on "contact-1" — the email-bearing tests below use CreateNewContact instead
});

describe("§6 — successful creation atomically produces exactly one confirmation intent", () => {
  it("a reservation created with a usable email produces exactly one Pending CommunicationMessage row, committed together", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "Emma de Vries", email: "emma@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 4,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: result.outcome.reservationId } });
    expect(messages).toHaveLength(1);
    expect(messages[0]?.communicationType).toBe("RESERVATION_CONFIRMATION");
    expect(messages[0]?.status).toBe("Pending");
    expect(messages[0]?.recipientEmail).toBe("emma@example.com");
    expect(messages[0]?.idempotencyKey).toBe(`${result.outcome.reservationId}:confirmation`);
  });

  it("§4 — an omitted communicationLanguage defaults to nl (documented default, never inferred), never silently English", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "Default Language Guest", email: "default-lang@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
      // communicationLanguage deliberately omitted
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: result.outcome.reservationId } });
    expect(reservation.communicationLanguage).toBe("nl");
    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: result.outcome.reservationId } });
    expect(messages[0]?.language).toBe("nl");
  });

  it("§4 — staff may explicitly specify en, and it flows through to the confirmation message", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "English Guest", email: "explicit-en@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
      communicationLanguage: "en",
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: result.outcome.reservationId } });
    expect(reservation.communicationLanguage).toBe("en");
    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: result.outcome.reservationId } });
    expect(messages[0]?.language).toBe("en");
  });

  it("F/§7 — a phone-only reservation (INV-C12) produces zero CommunicationMessage rows — not an error", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "Piet Bakker", phone: "0611111111" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const messages = await prisma.communicationMessage.findMany({ where: { reservationId: result.outcome.reservationId } });
    expect(messages).toHaveLength(0);

    const reservation = await prisma.reservation.findUniqueOrThrow({ where: { id: result.outcome.reservationId } });
    expect(reservation.status).toBe("Proposed"); // fully valid, unaffected by the absent email
  });
});

describe("F1 — Reservation write fails (domain validation) -> no confirmation intent", () => {
  it("an invalid reservation date rejects (CreateReservationHandler's own step 2 check) before any write, including the outbox", async () => {
    // Direct createHandler.handle() (bypassing the capacity-aware
    // orchestrator entirely) — CreateReservationHandler.handle() checks
    // Number.isNaN(reservationDate) as its own step 2, before touching
    // ReservationAggregate/ServiceTime.ts at all, so this is a clean,
    // early validation rejection with no other moving parts.
    const { createHandler } = buildHarness(prisma, NOW);
    const result = await createHandler.handle({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "Invalid Date Guest", email: "invalid-date@example.com" },
      reservationDate: new Date(NaN),
      partySize: 4,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.ok).toBe(false);

    const messages = await prisma.communicationMessage.findMany({ where: { recipientEmail: "invalid-date@example.com" } });
    expect(messages).toHaveLength(0);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
  });
});

describe("F2 — Contact write fails -> no Reservation and no confirmation intent", () => {
  it("an invalid new-Contact request (no name) rejects before any write", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "", email: "no-name@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 4,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.type).toBe("VALIDATION_FAILED");

    const messages = await prisma.communicationMessage.findMany({ where: { recipientEmail: "no-name@example.com" } });
    expect(messages).toHaveLength(0);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
    const contacts = await prisma.contact.findMany({ where: { emailRaw: "no-name@example.com" } });
    expect(contacts).toHaveLength(0);
  });
});

describe("F3 — Capacity write fails -> no Reservation and no confirmation intent (even though both were already written earlier in the SAME transaction)", () => {
  // A real (deliberately non-production) temporary CHECK constraint that
  // forbids one specific party_size value — chosen well within both the
  // Sushi physical capacity (51) and the party-size routing threshold, so
  // the request passes every earlier CAP-D02.03 check and reaches the
  // capacityRepository.create() call — which runs AFTER
  // createHandler.handle() (and therefore after this test's
  // confirmation-intent insert already succeeded inside the same
  // transaction) — before hitting this genuine Postgres constraint
  // violation.
  const POISON_CONSTRAINT = "test_only_forbid_party_size_6";

  it("rolls back the Reservation write AND the confirmation intent that was already inserted earlier in the same transaction", async () => {
    await prisma.$executeRawUnsafe(`ALTER TABLE "capacity_commitments" ADD CONSTRAINT "${POISON_CONSTRAINT}" CHECK ("party_size" <> 6)`);
    try {
      const { orchestrator } = buildHarness(prisma, NOW);
      await expect(
        orchestrator.createWithCapacity({
          commandId: cmd(),
          servicePeriodId: "sp-dinner",
          contactSelection: { type: "CreateNewContact", displayName: "Capacity Poison Guest", email: "capacity-poison@example.com" },
          reservationDate: new Date("2026-08-20T18:00:00Z"),
          partySize: 6,
          source: { category: ReservationSourceCategory.Telephone },
          preferredArea: "Sushi",
          actor: staffActor,
        })
      ).rejects.toThrow();

      const messages = await prisma.communicationMessage.findMany({ where: { recipientEmail: "capacity-poison@example.com" } });
      expect(messages).toHaveLength(0); // written earlier in the same transaction, must still roll back
      const reservations = await prisma.reservation.findMany({ where: { partySize: 6 } });
      expect(reservations).toHaveLength(0);
      const contacts = await prisma.contact.findMany({ where: { emailRaw: "capacity-poison@example.com" } });
      expect(contacts).toHaveLength(0); // the new Contact write, also earlier in the same transaction, rolls back too
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "capacity_commitments" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});

describe("F4 — the communication-intent write itself fails -> the ENTIRE Reservation transaction rolls back", () => {
  // A real, temporary CHECK constraint directly on communication_messages
  // — the write CreateReservationHandler.finalize() performs inside the
  // same transaction as the Reservation save. Forcing exactly this write
  // to fail is the most direct possible proof of §6's core requirement:
  // "failure to DURABLY QUEUE required communication may abort the
  // transaction" — i.e. this is NOT the same as a post-commit delivery
  // failure (§39's own explicit distinction), which must NEVER roll back
  // a Reservation (see communication-worker.test.ts's P1/P2 for that
  // opposite, equally-required guarantee).
  const POISON_CONSTRAINT = "test_only_forbid_poison_recipient";

  it("a forced failure on the CommunicationMessage insert prevents the Reservation from being created at all", async () => {
    await prisma.$executeRawUnsafe(`ALTER TABLE "communication_messages" ADD CONSTRAINT "${POISON_CONSTRAINT}" CHECK ("recipient_email" <> 'poison@example.com')`);
    try {
      const { orchestrator } = buildHarness(prisma, NOW);
      await expect(
        orchestrator.createWithCapacity({
          commandId: cmd(),
          servicePeriodId: "sp-dinner",
          contactSelection: { type: "CreateNewContact", displayName: "Outbox Poison Guest", email: "poison@example.com" },
          reservationDate: new Date("2026-08-20T18:00:00Z"),
          partySize: 3,
          source: { category: ReservationSourceCategory.Telephone },
          preferredArea: "Sushi",
          actor: staffActor,
        })
      ).rejects.toThrow();

      const reservations = await prisma.reservation.findMany();
      expect(reservations).toHaveLength(0); // the reservation write that preceded the poisoned outbox insert must not survive
      const commitments = await prisma.capacityCommitment.findMany();
      expect(commitments).toHaveLength(0);
      const contacts = await prisma.contact.findMany({ where: { emailRaw: "poison@example.com" } });
      expect(contacts).toHaveLength(0);
      const messages = await prisma.communicationMessage.findMany({ where: { recipientEmail: "poison@example.com" } });
      expect(messages).toHaveLength(0);
    } finally {
      await prisma.$executeRawUnsafe(`ALTER TABLE "communication_messages" DROP CONSTRAINT IF EXISTS "${POISON_CONSTRAINT}"`);
    }
  });
});
