import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase } from "./support/testHarness.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";
import { CreateReservationRequest } from "../../application/command-handlers/CreateReservationHandler.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";

/**
 * CAP-D05.01 — R1.3-I1 final gate (§9 Transaction Integrity, §10
 * Idempotency, §8 Reservation Snapshot Invariant, §4 Contact Reuse
 * Policy, §14 Matching). Real PostgreSQL throughout — no mocked
 * persistence, matching this codebase's existing convention for
 * capability-boundary evidence.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
const FUTURE_DATE = new Date("2026-08-20T18:00:00Z");
const PAST_DATE = new Date("2026-01-01T18:00:00Z");

function baseRequest(overrides: Partial<CreateReservationRequest> = {}): CreateReservationRequest {
  return {
    commandId: `cm-cmd-${Math.random().toString(36).slice(2)}`,
    servicePeriodId: "sp-dinner",
    contactSelection: { type: "CreateNewContact", displayName: "Contact Mgmt Guest", phone: "0611112222" },
    reservationDate: FUTURE_DATE,
    partySize: 2,
    source: { category: ReservationSourceCategory.Telephone },
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
});

describe("CAP-D05.01 — possible-match discovery against real PostgreSQL", () => {
  it("finds an existing Contact by exact normalized phone match, regardless of the raw formatting used at query time", async () => {
    const { createHandler } = buildHarness(prisma, NOW);
    const created = await createHandler.handle(
      baseRequest({ contactSelection: { type: "CreateNewContact", displayName: "Phone Match Guest", phone: "06-11-22-33-44" } })
    );
    expect(created.ok).toBe(true);

    const contactRepo = new PrismaContactRepository(prisma);
    const matches = await contactRepo.findPossibleMatches({ phoneNormalized: "+31611223344" });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.displayName).toBe("Phone Match Guest");
  });

  it("finds an existing Contact by exact normalized email match (case/whitespace-insensitive)", async () => {
    const { createHandler } = buildHarness(prisma, NOW);
    await createHandler.handle(
      baseRequest({
        commandId: "cm-email-match-1",
        contactSelection: { type: "CreateNewContact", displayName: "Email Match Guest", email: "  Guest@Example.com  " },
      })
    );

    const contactRepo = new PrismaContactRepository(prisma);
    const matches = await contactRepo.findPossibleMatches({ emailNormalized: "guest@example.com" });
    expect(matches).toHaveLength(1);
    expect(matches[0]?.displayName).toBe("Email Match Guest");
  });
});

describe("CAP-D05.01 §9 — Transaction Integrity: a Contact created inline must not survive a failed reservation command", () => {
  it("rolls back the new Contact write when reservation creation fails validation afterward (past-date without historical-correction override), plain (non-capacity) path", async () => {
    const { createHandler } = buildHarness(prisma, NOW);

    const result = await createHandler.handle(
      baseRequest({
        commandId: "cm-rollback-cmd-1",
        contactSelection: { type: "CreateNewContact", displayName: "Rollback Guest", phone: "0699998888" },
        reservationDate: PAST_DATE, // CAP-D01.01-R11 — rejected without isHistoricalCorrection
      })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R11")).toBe(true);
    }

    // The Contact write happened BEFORE the aggregate-validation failure
    // (see CreateReservationHandler's ordering) — it must not survive.
    const contacts = await prisma.contact.findMany({ where: { displayName: "Rollback Guest" } });
    expect(contacts).toHaveLength(0);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
    const appliedCommands = await prisma.appliedCommand.findMany({ where: { commandId: "cm-rollback-cmd-1" } });
    expect(appliedCommands).toHaveLength(0);
  });

  it("rolls back the new Contact write AND the capacity commitment together when reservation creation fails, capacity-aware path", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);

    const result = await orchestrator.createWithCapacity(
      baseRequest({
        commandId: "cm-rollback-cmd-2",
        contactSelection: { type: "CreateNewContact", displayName: "Rollback Capacity Guest", phone: "0699997777" },
        reservationDate: PAST_DATE,
        preferredArea: "Sushi",
      })
    );

    expect(result.type).toBe("VALIDATION_FAILED");
    const contacts = await prisma.contact.findMany({ where: { displayName: "Rollback Capacity Guest" } });
    expect(contacts).toHaveLength(0);
    const commitments = await prisma.capacityCommitment.findMany();
    expect(commitments).toHaveLength(0);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0);
  });
});

describe("CAP-D05.01 §10 — Idempotency: retrying a CreateNewContact command must not duplicate the Contact", () => {
  it("creates exactly one Contact and one Reservation when the same commandId is submitted twice", async () => {
    const { createHandler } = buildHarness(prisma, NOW);
    const request = baseRequest({
      commandId: "cm-idempotent-1",
      contactSelection: { type: "CreateNewContact", displayName: "Idempotent Guest", phone: "0655554444" },
    });

    const first = await createHandler.handle(request);
    expect(first.ok).toBe(true);
    const second = await createHandler.handle(request); // exact retry, same commandId
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    expect(second.value.reservationId).toBe(first.value.reservationId);

    const contacts = await prisma.contact.findMany({ where: { displayName: "Idempotent Guest" } });
    expect(contacts).toHaveLength(1); // not two
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(1);
  });

  it("creates exactly one Contact, one Reservation, and one CapacityCommitment on a retried capacity-aware CreateNewContact command", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const request = baseRequest({
      commandId: "cm-idempotent-cap-1",
      contactSelection: { type: "CreateNewContact", displayName: "Idempotent Capacity Guest", phone: "0655553333" },
      preferredArea: "Sushi",
    });

    const first = await orchestrator.createWithCapacity(request);
    expect(first.type).toBe("CREATED");
    const second = await orchestrator.createWithCapacity(request);
    expect(second.type).toBe("CREATED");

    const contacts = await prisma.contact.findMany({ where: { displayName: "Idempotent Capacity Guest" } });
    expect(contacts).toHaveLength(1);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(1);
    const commitments = await prisma.capacityCommitment.findMany({ where: { status: "Committed" } });
    expect(commitments).toHaveLength(1);
  });
});

describe("CAP-D05.01 §8 — Reservation Snapshot Invariant: editing a Contact later must not alter an existing Reservation's snapshot", () => {
  it("leaves a previously-created Reservation's contact snapshot unchanged after the Contact's name/phone/email are updated", async () => {
    const { createHandler } = buildHarness(prisma, NOW);
    const created = await createHandler.handle(
      baseRequest({
        commandId: "cm-snapshot-1",
        contactSelection: { type: "CreateNewContact", displayName: "Original Name", phone: "0611110000", email: "original@example.com" },
      })
    );
    expect(created.ok).toBe(true);
    if (!created.ok) return;

    const beforeEdit = await prisma.reservation.findUniqueOrThrow({ where: { id: created.value.reservationId } });
    const contactId = beforeEdit.contactId;

    // Simulate a later Contact edit — no application-level UpdateContact
    // operation exists yet (out of R1.3-I1 scope), so this exercises the
    // invariant directly at the persistence layer, exactly as a future
    // UpdateContact handler's write would.
    await prisma.contact.update({
      where: { id: contactId },
      data: { displayName: "Changed Name", phoneRaw: "0699990000", phoneNormalized: "+31699990000", emailRaw: "changed@example.com", emailNormalized: "changed@example.com" },
    });

    const afterEdit = await prisma.reservation.findUniqueOrThrow({ where: { id: created.value.reservationId } });
    expect(afterEdit.contactName).toBe("Original Name");
    expect(afterEdit.contactPhoneSnapshot).toBe("0611110000");
    expect(afterEdit.contactEmailSnapshot).toBe("original@example.com");

    // The Contact record itself DID change — proving this is a real edit,
    // not a no-op.
    const contactNow = await prisma.contact.findUniqueOrThrow({ where: { id: contactId } });
    expect(contactNow.displayName).toBe("Changed Name");
  });
});
