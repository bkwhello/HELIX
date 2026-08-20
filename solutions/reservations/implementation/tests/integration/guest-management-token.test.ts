import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { buildHarness, resetDatabase, seedTestContact, MutableClock } from "./support/testHarness.js";
import { createTestPrismaClient, truncateCommunicationDomainTables } from "./support/testDatabaseSafety.js";
import { GuestManagementTokenService } from "../../application/communications/GuestManagementTokenService.js";
import { PrismaGuestManagementCredentialRepository } from "../../infrastructure/persistence/PrismaGuestManagementCredentialRepository.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { hashSessionToken } from "../../domain/shared/hashSessionToken.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

/**
 * Chief Engineer "R1.6-B Guest Communications Engine" assignment §25/§26
 * — permanent token-guessing/storage regression tests for the guest-
 * management credential foundation.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-1", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const NOW = new Date("2026-08-10T10:00:00Z");
let cmdCounter = 0;
function cmd(): string {
  cmdCounter += 1;
  return `token-cmd-${cmdCounter}`;
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
  await seedTestContact(prisma);
});

describe("Token entropy and storage — only the hash is ever persisted", () => {
  it("the raw token has at least 256 bits of entropy (32+ raw bytes, base64url-encoded)", async () => {
    const generator = new RandomSessionTokenGenerator();
    const raw = generator.generate();
    // base64url with no padding: ceil(32 bytes * 8 / 6) = 43 characters for 256 bits.
    expect(raw.length).toBeGreaterThanOrEqual(43);
    expect(raw).toMatch(/^[A-Za-z0-9_-]+$/); // URL-safe alphabet only
  });

  it("issuing a token stores ONLY its SHA-256 hash — the raw value is never written to the database", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, new MutableClock(NOW));

    const { rawToken } = await service.issue("res-1", new Date("2026-08-20T18:00:00Z"));

    const row = await prisma.guestManagementCredential.findFirstOrThrow({ where: { reservationId: "res-1" } });
    expect(row.tokenHash).not.toBe(rawToken); // never the raw value
    expect(row.tokenHash).toBe(hashSessionToken(rawToken)); // exactly the documented hash function
    expect(row.tokenHash).toMatch(/^[0-9a-f]{64}$/); // SHA-256 hex digest shape
  });
});

describe("verify() — lookup by hash, undifferentiated failure", () => {
  it("a correct raw token resolves to the correct reservationId", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, new MutableClock(NOW));
    const { rawToken } = await service.issue("res-1", new Date("2026-08-20T18:00:00Z"));

    const result = await service.verify(rawToken);
    expect(result).toEqual({ reservationId: "res-1" });
  });

  it("a random, never-issued token resolves to null — never guessable", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, new MutableClock(NOW));
    await service.issue("res-1", new Date("2026-08-20T18:00:00Z"));

    const generator = new RandomSessionTokenGenerator();
    const result = await service.verify(generator.generate()); // a fresh, unrelated, equally-high-entropy value
    expect(result).toBeNull();
  });

  it("an expired token resolves to null (same undifferentiated outcome as a wrong token)", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const clock = new MutableClock(NOW);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, clock);
    const reservationStart = new Date("2026-08-20T18:00:00Z");
    const { rawToken } = await service.issue("res-1", reservationStart);

    // Past the safety-net expiry (7 days past the reservation date — GuestManagementTokenService's own documented constant).
    clock.set(new Date(reservationStart.getTime() + 8 * 24 * 60 * 60 * 1000));
    const result = await service.verify(rawToken);
    expect(result).toBeNull();
  });

  it("a revoked token resolves to null", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, new MutableClock(NOW));
    const { rawToken } = await service.issue("res-1", new Date("2026-08-20T18:00:00Z"));

    const [record] = await credentialRepository.findByReservationId("res-1");
    await credentialRepository.revoke(record!.id);

    const result = await service.verify(rawToken);
    expect(result).toBeNull();
  });
});

describe("Scope — exactly one reservation per token", () => {
  it("a token issued for reservation A never resolves to reservation B", async () => {
    const credentialRepository = new PrismaGuestManagementCredentialRepository(prisma);
    const service = new GuestManagementTokenService(new RandomSessionTokenGenerator(), credentialRepository, new MutableClock(NOW));
    const a = await service.issue("res-a", new Date("2026-08-20T18:00:00Z"));
    const b = await service.issue("res-b", new Date("2026-08-20T18:00:00Z"));

    expect(await service.verify(a.rawToken)).toEqual({ reservationId: "res-a" });
    expect(await service.verify(b.rawToken)).toEqual({ reservationId: "res-b" });
    expect(a.rawToken).not.toBe(b.rawToken);
  });
});

describe("End-to-end — a real reservation creation issues a real credential atomically alongside it", () => {
  it("creating a reservation with a usable email also issues a verifiable guest-management token", async () => {
    const { orchestrator, credentialRepository } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "Token E2E Guest", email: "token-e2e@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");

    const credentials = await credentialRepository.findByReservationId(result.outcome.reservationId);
    expect(credentials).toHaveLength(1);
    expect(credentials[0]?.revokedAt).toBeUndefined();
  });

  it("never appears in the reservation's own outward-facing outcome — the raw token is not part of the CreateReservationOutcome DTO", async () => {
    const { orchestrator } = buildHarness(prisma, NOW);
    const result = await orchestrator.createWithCapacity({
      commandId: cmd(),
      servicePeriodId: "sp-dinner",
      contactSelection: { type: "CreateNewContact", displayName: "No Leak Guest", email: "no-leak@example.com" },
      reservationDate: new Date("2026-08-20T18:00:00Z"),
      partySize: 2,
      source: { category: ReservationSourceCategory.Telephone },
      preferredArea: "Sushi",
      actor: staffActor,
    });
    expect(result.type).toBe("CREATED");
    if (result.type !== "CREATED") throw new Error("unreachable");
    // The outcome DTO returned to the (staff) HTTP caller has a fixed, known field set — no token-shaped field anywhere in it.
    expect(Object.keys(result.outcome).sort()).toEqual(["contactName", "notes", "preferredArea", "reservationId", "status", "warnings"]);
  });
});
