import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import request from "supertest";
import { createApp } from "../../api/app.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { UnvalidatedContactReader } from "../../infrastructure/UnvalidatedContactReader.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { bootstrapOwner } from "../../infrastructure/bootstrap/bootstrapOwner.js";
import { LoginHandler } from "../../application/auth/LoginHandler.js";
import { LogoutHandler } from "../../application/auth/LogoutHandler.js";
import { CreateStaffUserHandler } from "../../application/auth/CreateStaffUserHandler.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { hashSessionToken } from "../../domain/shared/hashSessionToken.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

const prisma = new PrismaClient();
const NOW = new Date("2026-08-01T10:00:00Z");
class FixedClock {
  now(): Date {
    return NOW;
  }
}

async function resetAll(): Promise<void> {
  await prisma.$executeRawUnsafe(
    'TRUNCATE TABLE "capacity_commitments", "applied_commands", "reservation_events", "reservations", "closing_days" RESTART IDENTITY CASCADE'
  );
  await prisma.$executeRawUnsafe('TRUNCATE TABLE "staff_sessions", "staff_users", "security_events" RESTART IDENTITY CASCADE');
}

function buildAuthDeps() {
  return {
    staffUserRepository: new PrismaStaffUserRepository(prisma),
    sessionRepository: new PrismaSessionRepository(prisma),
    passwordHasher: new ScryptPasswordHasher(),
    sessionTokenGenerator: new RandomSessionTokenGenerator(),
    idGenerator: new RandomIdGenerator(),
  };
}

beforeAll(async () => {
  await resetAll();
});
afterAll(async () => {
  await prisma.$disconnect();
});
beforeEach(async () => {
  await resetAll();
});

describe("PrismaStaffUserRepository", () => {
  it("creates, finds by id, and finds by username", async () => {
    const repo = new PrismaStaffUserRepository(prisma);
    const passwordHasher = new ScryptPasswordHasher();
    const created = await repo.create({
      id: "su-1",
      username: "reception1",
      displayName: "Reception One",
      email: "reception1@example.com",
      passwordHash: await passwordHasher.hash("password123"),
      role: ActorRole.Reception,
    });
    expect(created.status).toBe("Active");

    const byId = await repo.findById("su-1");
    expect(byId?.username).toBe("reception1");

    const byUsername = await repo.findByUsername("reception1");
    expect(byUsername?.id).toBe("su-1");

    expect(await repo.findByUsername("does-not-exist")).toBeNull();
  });

  it("ownerExists() reflects the database, not application state", async () => {
    const repo = new PrismaStaffUserRepository(prisma);
    expect(await repo.ownerExists()).toBe(false);

    const passwordHasher = new ScryptPasswordHasher();
    await repo.create({
      id: "su-owner",
      username: "owner1",
      displayName: "Owner One",
      email: null,
      passwordHash: await passwordHasher.hash("password123"),
      role: ActorRole.Owner,
    });
    expect(await repo.ownerExists()).toBe(true);
  });

  it("rejects a second username collision (real unique constraint)", async () => {
    const repo = new PrismaStaffUserRepository(prisma);
    const passwordHasher = new ScryptPasswordHasher();
    const hash = await passwordHasher.hash("password123");
    await repo.create({ id: "su-a", username: "dup", displayName: "A", email: null, passwordHash: hash, role: ActorRole.Reception });
    await expect(
      repo.create({ id: "su-b", username: "dup", displayName: "B", email: null, passwordHash: hash, role: ActorRole.Reception })
    ).rejects.toThrow();
  });
});

describe("PrismaSessionRepository", () => {
  it("creates a session, finds it by hashed token, and revokes it", async () => {
    const staffUserRepo = new PrismaStaffUserRepository(prisma);
    const passwordHasher = new ScryptPasswordHasher();
    await staffUserRepo.create({
      id: "su-sess",
      username: "sessuser",
      displayName: "Sess User",
      email: null,
      passwordHash: await passwordHasher.hash("password123"),
      role: ActorRole.Reception,
    });

    const sessionRepo = new PrismaSessionRepository(prisma);
    const hashedToken = hashSessionToken("raw-token-value");
    const created = await sessionRepo.create({ hashedToken, staffUserId: "su-sess", expiresAt: new Date(Date.now() + 60_000) });
    expect(created.revokedAt).toBeNull();

    const found = await sessionRepo.findByHashedToken(hashedToken);
    expect(found?.staffUserId).toBe("su-sess");

    await sessionRepo.revoke(hashedToken);
    const afterRevoke = await sessionRepo.findByHashedToken(hashedToken);
    expect(afterRevoke?.revokedAt).not.toBeNull();
  });

  it("revokeAllForUser revokes every active session for that user, and only that user", async () => {
    const staffUserRepo = new PrismaStaffUserRepository(prisma);
    const passwordHasher = new ScryptPasswordHasher();
    await staffUserRepo.create({ id: "su-1", username: "user1", displayName: "U1", email: null, passwordHash: await passwordHasher.hash("x12345678"), role: ActorRole.Reception });
    await staffUserRepo.create({ id: "su-2", username: "user2", displayName: "U2", email: null, passwordHash: await passwordHasher.hash("x12345678"), role: ActorRole.Reception });

    const sessionRepo = new PrismaSessionRepository(prisma);
    const expiresAt = new Date(Date.now() + 60_000);
    await sessionRepo.create({ hashedToken: hashSessionToken("t1a"), staffUserId: "su-1", expiresAt });
    await sessionRepo.create({ hashedToken: hashSessionToken("t1b"), staffUserId: "su-1", expiresAt });
    await sessionRepo.create({ hashedToken: hashSessionToken("t2a"), staffUserId: "su-2", expiresAt });

    await sessionRepo.revokeAllForUser("su-1");

    expect((await sessionRepo.findByHashedToken(hashSessionToken("t1a")))?.revokedAt).not.toBeNull();
    expect((await sessionRepo.findByHashedToken(hashSessionToken("t1b")))?.revokedAt).not.toBeNull();
    expect((await sessionRepo.findByHashedToken(hashSessionToken("t2a")))?.revokedAt).toBeNull();
  });
});

describe("LoginHandler — real database, real password hashing", () => {
  it("succeeds with correct credentials and issues a session", async () => {
    const deps = buildAuthDeps();
    await deps.staffUserRepository.create({
      id: "su-login",
      username: "loginuser",
      displayName: "Login User",
      email: null,
      passwordHash: await deps.passwordHasher.hash("correct-password"),
      role: ActorRole.Manager,
    });
    const handler = new LoginHandler(deps.staffUserRepository, deps.sessionRepository, deps.passwordHasher, deps.sessionTokenGenerator, new FixedClock(), 60_000);

    const result = await handler.handle({ username: "loginuser", password: "correct-password" });
    expect(result.type).toBe("SUCCESS");
    if (result.type !== "SUCCESS") throw new Error("unreachable");
    expect(result.staffUser.role).toBe(ActorRole.Manager);

    const session = await deps.sessionRepository.findByHashedToken(hashSessionToken(result.sessionToken));
    expect(session?.staffUserId).toBe("su-login");
  });

  it("returns the IDENTICAL outcome type for an unknown username and a wrong password (account enumeration protection)", async () => {
    const deps = buildAuthDeps();
    await deps.staffUserRepository.create({
      id: "su-login2",
      username: "realuser",
      displayName: "Real User",
      email: null,
      passwordHash: await deps.passwordHasher.hash("correct-password"),
      role: ActorRole.Reception,
    });
    const handler = new LoginHandler(deps.staffUserRepository, deps.sessionRepository, deps.passwordHasher, deps.sessionTokenGenerator, new FixedClock(), 60_000);

    const unknownUser = await handler.handle({ username: "nosuchuser", password: "anything" });
    const wrongPassword = await handler.handle({ username: "realuser", password: "wrong-password" });

    expect(unknownUser.type).toBe("INVALID_CREDENTIALS");
    expect(wrongPassword.type).toBe("INVALID_CREDENTIALS");
    // Response TYPE is identical (what a caller sees); `reason` is
    // internal-only telemetry, never serialized to the HTTP response —
    // see api/app.ts's /auth/login handler, which only ever returns a
    // single generic message regardless of `reason`.
  });

  it("rejects a Disabled account even with the correct password, with the same outcome type as any other failure", async () => {
    const deps = buildAuthDeps();
    await deps.staffUserRepository.create({
      id: "su-disabled",
      username: "disableduser",
      displayName: "Disabled User",
      email: null,
      passwordHash: await deps.passwordHasher.hash("correct-password"),
      role: ActorRole.Reception,
    });
    await prisma.staffUser.update({ where: { id: "su-disabled" }, data: { status: "Disabled" } });

    const handler = new LoginHandler(deps.staffUserRepository, deps.sessionRepository, deps.passwordHasher, deps.sessionTokenGenerator, new FixedClock(), 60_000);
    const result = await handler.handle({ username: "disableduser", password: "correct-password" });
    expect(result.type).toBe("INVALID_CREDENTIALS");

    const sessions = await prisma.staffSession.findMany({ where: { staffUserId: "su-disabled" } });
    expect(sessions).toHaveLength(0); // no session issued
  });
});

describe("LogoutHandler", () => {
  it("revokes the session so it can no longer authorize requests", async () => {
    const deps = buildAuthDeps();
    await deps.staffUserRepository.create({
      id: "su-logout",
      username: "logoutuser",
      displayName: "Logout User",
      email: null,
      passwordHash: await deps.passwordHasher.hash("correct-password"),
      role: ActorRole.Reception,
    });
    const loginHandler = new LoginHandler(deps.staffUserRepository, deps.sessionRepository, deps.passwordHasher, deps.sessionTokenGenerator, new FixedClock(), 60_000);
    const login = await loginHandler.handle({ username: "logoutuser", password: "correct-password" });
    if (login.type !== "SUCCESS") throw new Error("unreachable");

    const logoutHandler = new LogoutHandler(deps.sessionRepository);
    await logoutHandler.handle({ sessionToken: login.sessionToken });

    const session = await deps.sessionRepository.findByHashedToken(hashSessionToken(login.sessionToken));
    expect(session?.revokedAt).not.toBeNull();
  });
});

describe("CreateStaffUserHandler", () => {
  it("creates a non-Owner staff user", async () => {
    const deps = buildAuthDeps();
    const handler = new CreateStaffUserHandler(deps.staffUserRepository, deps.passwordHasher, deps.idGenerator);
    const result = await handler.handle({ username: "newstaff", displayName: "New Staff", password: "password123", role: ActorRole.Supervisor });
    expect(result.ok).toBe(true);
  });

  it("rejects creating a second Owner via this handler, independent of the route-level permission check", async () => {
    const deps = buildAuthDeps();
    const handler = new CreateStaffUserHandler(deps.staffUserRepository, deps.passwordHasher, deps.idGenerator);
    const result = await handler.handle({ username: "wouldbeowner", displayName: "X", password: "password123", role: ActorRole.Owner });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "R1.2-IA-04")).toBe(true);
    }
    const persisted = await deps.staffUserRepository.findByUsername("wouldbeowner");
    expect(persisted).toBeNull();
  });

  it("rejects a duplicate username with a clear violation, not a raw database error", async () => {
    const deps = buildAuthDeps();
    const handler = new CreateStaffUserHandler(deps.staffUserRepository, deps.passwordHasher, deps.idGenerator);
    await handler.handle({ username: "taken", displayName: "First", password: "password123", role: ActorRole.Reception });
    const second = await handler.handle({ username: "taken", displayName: "Second", password: "password123", role: ActorRole.Reception });
    expect(second.ok).toBe(false);
    if (!second.ok) {
      expect(second.violations.some((v) => v.ruleId === "R1.2-IA-06")).toBe(true);
    }
  });
});

describe("bootstrapOwner", () => {
  it("creates the first Owner", async () => {
    const deps = buildAuthDeps();
    const result = await bootstrapOwner({
      staffUserRepository: deps.staffUserRepository,
      passwordHasher: deps.passwordHasher,
      idGenerator: deps.idGenerator,
      recordSecurityEvent: async (targetStaffUserId) => {
        await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } });
      },
      username: "bootstrap-owner-1",
      password: "BootstrapPass123!",
      displayName: undefined,
      email: undefined,
    });
    expect(result.status).toBe("CREATED");

    const events = await prisma.securityEvent.findMany({ where: { type: "OwnerBootstrapped" } });
    expect(events).toHaveLength(1);
  });

  it("refuses a second bootstrap once an Owner exists — the database invariant is authoritative, not just a pre-check", async () => {
    const deps = buildAuthDeps();
    const recordSecurityEvent = async (targetStaffUserId: string) => {
      await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } });
    };

    const first = await bootstrapOwner({
      staffUserRepository: deps.staffUserRepository,
      passwordHasher: deps.passwordHasher,
      idGenerator: deps.idGenerator,
      recordSecurityEvent,
      username: "bootstrap-owner-2",
      password: "BootstrapPass123!",
      displayName: undefined,
      email: undefined,
    });
    expect(first.status).toBe("CREATED");

    const second = await bootstrapOwner({
      staffUserRepository: deps.staffUserRepository,
      passwordHasher: deps.passwordHasher,
      idGenerator: deps.idGenerator,
      recordSecurityEvent,
      username: "someone-else",
      password: "AnotherPass123!",
      displayName: undefined,
      email: undefined,
    });
    expect(second.status).toBe("ALREADY_EXISTS");

    const owners = await prisma.staffUser.findMany({ where: { role: "Owner" } });
    expect(owners).toHaveLength(1);
  });

  it("rejects a password under 8 characters and a missing username without writing anything", async () => {
    const deps = buildAuthDeps();
    const recordSecurityEvent = async () => {
      throw new Error("must not be called");
    };
    const shortPassword = await bootstrapOwner({
      staffUserRepository: deps.staffUserRepository,
      passwordHasher: deps.passwordHasher,
      idGenerator: deps.idGenerator,
      recordSecurityEvent,
      username: "validuser",
      password: "short",
      displayName: undefined,
      email: undefined,
    });
    expect(shortPassword.status).toBe("INVALID_INPUT");

    const missingUsername = await bootstrapOwner({
      staffUserRepository: deps.staffUserRepository,
      passwordHasher: deps.passwordHasher,
      idGenerator: deps.idGenerator,
      recordSecurityEvent,
      username: undefined,
      password: "ValidPass123!",
      displayName: undefined,
      email: undefined,
    });
    expect(missingUsername.status).toBe("INVALID_INPUT");

    expect(await deps.staffUserRepository.ownerExists()).toBe(false);
  });
});

/**
 * R1.2 §18 — MANDATORY, PERMANENT regression. Proves the specific,
 * originally-identified P0 (self-asserted x-actor-* headers granting
 * staff authority) is closed. Run against a fully real stack (real
 * PostgreSQL, real app.ts, real middleware) — this is the one test in
 * the whole suite that must never be weakened or removed.
 */
describe("MANDATORY SPOOFING REGRESSION — x-actor-* headers must grant zero staff authority", () => {
  function buildRealApp() {
    return createApp({
      repository: new PrismaReservationRepository(prisma),
      duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
      contactReader: new UnvalidatedContactReader(),
      servicePeriodReader: new UnvalidatedServicePeriodReader(),
      closingDayStore: new PrismaClosingDayStore(prisma),
      idGenerator: new RandomIdGenerator(),
      eventIdGenerator: new RandomIdGenerator(),
      clock: new FixedClock(),
      auth: {
        staffUserRepository: new PrismaStaffUserRepository(prisma),
        sessionRepository: new PrismaSessionRepository(prisma),
        passwordHasher: new ScryptPasswordHasher(),
        sessionTokenGenerator: new RandomSessionTokenGenerator(),
        cookieSecure: false,
        expectedOrigin: null,
      },
    });
  }

  it("a request claiming Owner via x-actor-* headers, with no valid session, is rejected — on a real mutation endpoint (POST /reservations)", async () => {
    const app = buildRealApp();
    const res = await request(app)
      .post("/reservations")
      .set(CSRF_HEADER_NAME, "1")
      .set("x-actor-id", "owner")
      .set("x-actor-kind", "AuthorizedUser")
      .set("x-actor-role", "Owner")
      .send({
        commandId: "spoof-cmd-1",
        servicePeriodId: "sp-1",
        contactId: "contact-1",
        reservationDate: new Date("2026-08-20T18:00:00Z").toISOString(),
        partySize: 2,
        source: { category: "Telephone" },
      });

    expect(res.status).toBe(401);
    const reservations = await prisma.reservation.findMany();
    expect(reservations).toHaveLength(0); // nothing was created — the spoofed headers granted NO authority
  });

  it("the same spoofed-Owner headers are equally powerless against the Owner-only users.manage endpoint (POST /staff-users)", async () => {
    const app = buildRealApp();
    const res = await request(app)
      .post("/staff-users")
      .set(CSRF_HEADER_NAME, "1")
      .set("x-actor-id", "owner")
      .set("x-actor-kind", "AuthorizedUser")
      .set("x-actor-role", "Owner")
      .send({ username: "spoofed-created", displayName: "Should Not Exist", password: "password123", role: "Reception" });

    expect(res.status).toBe(401);
    const created = await prisma.staffUser.findUnique({ where: { username: "spoofed-created" } });
    expect(created).toBeNull();
  });

  it("adding a real, valid session cookie alongside the spoofed headers is what actually grants authority — proving the headers themselves contribute nothing", async () => {
    const app = buildRealApp();
    const passwordHasher = new ScryptPasswordHasher();
    const staffUserRepository = new PrismaStaffUserRepository(prisma);
    await staffUserRepository.create({
      id: "su-real-reception",
      username: "realreception",
      displayName: "Real Reception",
      email: null,
      passwordHash: await passwordHasher.hash("realpassword123"),
      role: ActorRole.Reception,
    });

    const agent = request.agent(app);
    const login = await agent.post("/auth/login").set(CSRF_HEADER_NAME, "1").send({ username: "realreception", password: "realpassword123" });
    expect(login.status).toBe(200);

    // Same spoofed headers as above, claiming Owner — but now WITH a
    // real session for a Reception-role account. The outcome must be
    // governed by the REAL session's REAL role (Reception, which lacks
    // users.manage), not by the spoofed x-actor-role: Owner header.
    const res = await agent
      .post("/staff-users")
      .set(CSRF_HEADER_NAME, "1")
      .set("x-actor-id", "owner")
      .set("x-actor-kind", "AuthorizedUser")
      .set("x-actor-role", "Owner")
      .send({ username: "should-still-not-exist", displayName: "X", password: "password123", role: "Reception" });

    expect(res.status).toBe(403); // authenticated (real session), but forbidden (real role lacks users.manage) — NOT 201
    const created = await prisma.staffUser.findUnique({ where: { username: "should-still-not-exist" } });
    expect(created).toBeNull();
  });
});
