import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../api/app.js";
import { resetDatabase } from "../integration/support/testHarness.js";
import { createTestPrismaClient, truncateStaffDomainTables } from "../integration/support/testDatabaseSafety.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { hasPermission, Permission } from "../../domain/rules/StaffAuthorizationPolicy.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.5-P8-A — /auth/login and /auth/me expose UI capability flags so a
 * future Reception/Beheer split can hide management screens. They are pure
 * READ-MODEL exposure of the existing permission matrix (no new authority):
 * every flag is asserted against StaffAuthorizationPolicy.hasPermission for
 * EVERY role, and the server's own route guard is checked to agree.
 */
const prisma = createTestPrismaClient();
const PASSWORD = "SuperSecret123!";
const ROLES = Object.values(ActorRole);
let app: Express;
const agents = new Map<string, ReturnType<typeof request.agent>>();
const loginBodies = new Map<string, any>();

class FixedClock {
  now(): Date {
    return new Date("2026-08-01T10:00:00Z");
  }
}
let idCounter = 0;
const ids = { generate: () => `cap-${++idCounter}` };

const expectedFlags = (role: (typeof ROLES)[number]) => ({
  canCompleteReservation: hasPermission(role, Permission.ReservationComplete),
  canViewSecurityEvents: hasPermission(role, Permission.AuditView),
  canManageCapacitySettings: hasPermission(role, Permission.CapacitySettingsManage),
  canManageResourceBlocks: hasPermission(role, Permission.ResourceBlock),
  canManageStaff: hasPermission(role, Permission.UsersManage),
});

beforeAll(async () => {
  await resetDatabase(prisma);
  await truncateStaffDomainTables(prisma);
  app = createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: ids,
    eventIdGenerator: ids,
    clock: new FixedClock(),
    auth: {
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      sessionRepository: new PrismaSessionRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      sessionTokenGenerator: new RandomSessionTokenGenerator(),
      cookieSecure: false,
      expectedOrigin: null,
      loginAttemptTracker: new PrismaLoginAttemptTracker(prisma),
    },
  });
  const users = new PrismaStaffUserRepository(prisma);
  const hash = await new ScryptPasswordHasher().hash(PASSWORD);
  for (const role of ROLES) {
    await users.create({ id: `staff-cap-${role}`, username: `cap-${role.toLowerCase()}`, displayName: `Cap ${role}`, email: null, passwordHash: hash, role });
    const agent = request.agent(app);
    const login = await agent.post("/auth/login").set(CSRF_HEADER_NAME, "1").send({ username: `cap-${role.toLowerCase()}`, password: PASSWORD });
    if (login.status !== 200) throw new Error(`login ${role} failed: ${login.status}`);
    agents.set(role, agent);
    loginBodies.set(role, login.body);
  }
});
afterAll(async () => {
  await prisma.$disconnect();
});

/** An EMPTY management write: 403 without CapacitySettingsManage; otherwise rejected by validation (never a write). */
async function closingDayWriteStatus(role: (typeof ROLES)[number]): Promise<number> {
  const res = await agents.get(role)!.post("/closing-days").set(CSRF_HEADER_NAME, "1").send({});
  expect([400, 403, 422], `${role} unexpected ${res.status}`).toContain(res.status);
  return res.status;
}

describe("R1.5-P8-A — /auth capability flags mirror the existing permission matrix", () => {
  it("C1–C3 — Reception: no service/capacity settings, no floorplan/settings, no blocks, no staff, no security/audit", async () => {
    const me = (await agents.get(ActorRole.Reception)!.get("/auth/me")).body.staffUser;
    expect(me.permissions).toEqual({
      canCompleteReservation: false,
      canViewSecurityEvents: false,
      canManageCapacitySettings: false,
      canManageResourceBlocks: false,
      canManageStaff: false,
    });
    // The server's own guard agrees (flags are hints; routes stay the boundary). GET
    // /closing-days is readable by every session; the MANAGEMENT write is not.
    expect(await closingDayWriteStatus(ActorRole.Reception)).toBe(403);
  });

  it("C4 — Owner receives every management flag", async () => {
    const me = (await agents.get(ActorRole.Owner)!.get("/auth/me")).body.staffUser;
    expect(me.permissions).toEqual({
      canCompleteReservation: true,
      canViewSecurityEvents: true,
      canManageCapacitySettings: true,
      canManageResourceBlocks: true,
      canManageStaff: true,
    });
    expect(await closingDayWriteStatus(ActorRole.Owner)).not.toBe(403);
  });

  it("C5 — every role (Manager, AssistantManager, Supervisor, ReservationAgent, …) follows hasPermission exactly", async () => {
    for (const role of ROLES) {
      const me = (await agents.get(role)!.get("/auth/me")).body.staffUser;
      expect(me.permissions, role).toEqual(expectedFlags(role));
      expect(loginBodies.get(role).staffUser.permissions, `${role} login`).toEqual(expectedFlags(role));
      const write = await closingDayWriteStatus(role);
      expect(write !== 403, `${role} POST /closing-days ${write}`).toBe(expectedFlags(role).canManageCapacitySettings);
    }
    // Spot-check the matrix itself for the roles the brief names explicitly.
    expect(expectedFlags(ActorRole.Manager)).toEqual({ canCompleteReservation: true, canViewSecurityEvents: true, canManageCapacitySettings: true, canManageResourceBlocks: true, canManageStaff: false });
    expect(expectedFlags(ActorRole.AssistantManager)).toEqual({ canCompleteReservation: true, canViewSecurityEvents: false, canManageCapacitySettings: false, canManageResourceBlocks: false, canManageStaff: false });
  });

  it("C6 — existing login and /auth/me (reload) shape stays compatible; repeated /auth/me is stable", async () => {
    for (const role of ROLES) {
      const login = loginBodies.get(role).staffUser;
      expect(login).toMatchObject({ id: `staff-cap-${role}`, username: `cap-${role.toLowerCase()}`, displayName: `Cap ${role}`, role });
      expect(typeof login.permissions.canCompleteReservation).toBe("boolean");
      expect(typeof login.permissions.canViewSecurityEvents).toBe("boolean");
      const first = (await agents.get(role)!.get("/auth/me")).body;
      const reload = (await agents.get(role)!.get("/auth/me")).body;
      expect(reload).toEqual(first);
      expect(first.staffUser).toMatchObject({ id: `staff-cap-${role}`, displayName: `Cap ${role}`, role });
    }
  });
});
