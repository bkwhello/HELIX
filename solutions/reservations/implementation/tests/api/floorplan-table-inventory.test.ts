import { describe, it, expect, beforeAll, afterAll } from "vitest";
import request from "supertest";
import { Express } from "express";
import { createApp } from "../../api/app.js";
import { createTestPrismaClient, truncateStaffDomainTables } from "../integration/support/testDatabaseSafety.js";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { PrismaDuplicateReservationChecker } from "../../infrastructure/persistence/PrismaDuplicateReservationChecker.js";
import { PrismaClosingDayStore } from "../../infrastructure/persistence/PrismaClosingDayStore.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaSessionRepository } from "../../infrastructure/persistence/PrismaSessionRepository.js";
import { PrismaLoginAttemptTracker } from "../../infrastructure/persistence/PrismaLoginAttemptTracker.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomSessionTokenGenerator } from "../../infrastructure/RandomSessionTokenGenerator.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { PrismaContactRepository } from "../../infrastructure/persistence/PrismaContactRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { UnvalidatedServicePeriodReader } from "../../infrastructure/UnvalidatedServicePeriodReader.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { CSRF_HEADER_NAME } from "../../api/authMiddleware.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { Table } from "../../domain/floor/Table.js";
import { Seat } from "../../domain/floor/Seat.js";
import { ResourceBlock } from "../../domain/floor/ResourceBlock.js";
import { SeatingAssignment, SeatingAssignmentResource } from "../../domain/floor/SeatingAssignment.js";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

/**
 * R1.5-P2E-1 — HTTP-level coverage for the new, single
 * `GET /floorplan-resources/tables` read-only inventory route. Mirrors
 * tests/api/floorplans.test.ts's own isolation conventions (RUN_ID-suffixed
 * usernames, real Prisma-backed app for auth/permission/real-inventory
 * coverage) plus a dedicated fake FloorRepository (matching
 * tests/support/InMemoryReservationRepository.ts's own "real class, not a
 * partial cast" convention) for the defensive/ordering behaviors that
 * cannot be observed against the real, shared, non-per-test-isolated
 * Table catalog.
 */
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const PASSWORD = "SuperSecret123!";
const prisma = createTestPrismaClient();

function buildRealApp(): Express {
  return createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock: { now: () => new Date() },
    floor: {
      floorRepository: new PrismaFloorRepository(prisma),
      prisma,
    },
    floorplans: {
      floorplanRepository: new PrismaFloorplanRepository(prisma),
      transactionManager: new PrismaTransactionManager(prisma),
    },
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
}

/**
 * Implements every FloorRepository method for real type-safety (matching
 * this codebase's own tests/support/InMemoryReservationRepository.ts
 * convention — a genuine class, never a partial object force-cast). Only
 * findTablesByArea is ever exercised by the route under test; every other
 * method throws immediately if accidentally called, so a test that
 * reaches one fails loudly rather than silently returning nonsense.
 */
class FakeInventoryFloorRepository implements FloorRepository {
  constructor(private readonly byArea: ReadonlyMap<string, readonly Table[]>) {}

  async findTablesByArea(areaId: string): Promise<readonly Table[]> {
    return this.byArea.get(areaId) ?? [];
  }

  private notImplemented(): never {
    throw new Error("FakeInventoryFloorRepository supports findTablesByArea only — R1.5-P2E-1 inventory-route tests.");
  }
  findTableById(): Promise<Table | null> {
    return this.notImplemented();
  }
  findTableByLabel(): Promise<Table | null> {
    return this.notImplemented();
  }
  findSeatById(): Promise<Seat | null> {
    return this.notImplemented();
  }
  findSeatsByTableId(): Promise<readonly Seat[]> {
    return this.notImplemented();
  }
  findOverlappingResourceBlocks(): Promise<readonly ResourceBlock[]> {
    return this.notImplemented();
  }
  createResourceBlock(): Promise<ResourceBlock> {
    return this.notImplemented();
  }
  listResourceBlocks(): Promise<readonly ResourceBlock[]> {
    return this.notImplemented();
  }
  findResourceBlockById(): Promise<ResourceBlock | null> {
    return this.notImplemented();
  }
  deleteResourceBlock(): Promise<void> {
    return this.notImplemented();
  }
  findOverlappingResourceClaims(): Promise<{ readonly tableIds: ReadonlySet<string>; readonly seatIds: ReadonlySet<string> }> {
    return this.notImplemented();
  }
  findAssignmentByCommandId(): Promise<SeatingAssignment | null> {
    return this.notImplemented();
  }
  findActiveAssignmentByReservationId(): Promise<SeatingAssignment | null> {
    return this.notImplemented();
  }
  findAssignmentResources(): Promise<readonly SeatingAssignmentResource[]> {
    return this.notImplemented();
  }
  createAssignment(): Promise<SeatingAssignment> {
    return this.notImplemented();
  }
  updateAssignmentStatus(): Promise<void> {
    return this.notImplemented();
  }
  acquireSeatingResourceLock(): Promise<void> {
    return this.notImplemented();
  }
}

function fakeTable(overrides: Partial<Table> & { readonly id: string; readonly areaId: string; readonly operationalLabel: string }): Table {
  return {
    nominalCapacity: 4,
    supportsSharedSeating: false,
    status: "Active",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function buildFakeApp(byArea: ReadonlyMap<string, readonly Table[]>): Express {
  return createApp({
    repository: new PrismaReservationRepository(prisma),
    duplicateChecker: new PrismaDuplicateReservationChecker(prisma),
    contactRepository: new PrismaContactRepository(prisma),
    transactionManager: new PrismaTransactionManager(prisma),
    servicePeriodReader: new UnvalidatedServicePeriodReader(),
    closingDayStore: new PrismaClosingDayStore(prisma),
    idGenerator: new RandomIdGenerator(),
    eventIdGenerator: new RandomIdGenerator(),
    clock: { now: () => new Date() },
    floor: {
      floorRepository: new FakeInventoryFloorRepository(byArea),
      prisma,
    },
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
}

function post(agent: ReturnType<typeof request.agent>, url: string) {
  return agent.post(url).set(CSRF_HEADER_NAME, "1");
}

let realApp: Express;
let staffUserRepository: PrismaStaffUserRepository;
const agentsByRole = new Map<ActorRole, ReturnType<typeof request.agent>>();

async function createStaffUser(usernameSuffix: string, role: ActorRole): Promise<{ id: string; username: string }> {
  const username = `fpt-${usernameSuffix}-${RUN_ID}`.slice(0, 32);
  const passwordHasher = new ScryptPasswordHasher();
  const created = await staffUserRepository.create({
    id: `fpt-id-${usernameSuffix}-${RUN_ID}`,
    username,
    displayName: username,
    email: null,
    passwordHash: await passwordHasher.hash(PASSWORD),
    role,
  });
  return { id: created.id, username: created.username };
}

async function loginAgent(app: Express, username: string): Promise<ReturnType<typeof request.agent>> {
  const agent = request.agent(app);
  const res = await post(agent, "/auth/login").send({ username, password: PASSWORD });
  if (res.status !== 200) throw new Error(`test setup failed to log in as ${username}: ${res.status} ${JSON.stringify(res.body)}`);
  return agent;
}

/**
 * `staff_users_one_owner` (migration 20260818105411) is a real, partial
 * unique index — at most one StaffUser may ever hold role="Owner". Every
 * fake-repository test below therefore reuses one of THESE already-created
 * per-role users for a fresh login against its own app instance, rather
 * than creating a new StaffUser — sessions are looked up server-side by
 * token regardless of which app instance issued the login, so a fresh
 * login against the fake app works identically to one against realApp.
 */
const usernamesByRole = new Map<ActorRole, string>();

beforeAll(async () => {
  realApp = buildRealApp();
  await truncateStaffDomainTables(prisma);
  staffUserRepository = new PrismaStaffUserRepository(prisma);
  let i = 0;
  for (const role of Object.values(ActorRole)) {
    i += 1;
    const user = await createStaffUser(`role${i}`, role);
    usernamesByRole.set(role, user.username);
    agentsByRole.set(role, await loginAgent(realApp, user.username));
  }
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("GET /floorplan-resources/tables — authentication", () => {
  it("no session -> 401", async () => {
    const res = await request(realApp).get("/floorplan-resources/tables");
    expect(res.status).toBe(401);
    expect(res.body).toEqual({ message: "Authentication required." });
  });
});

describe("GET /floorplan-resources/tables — every real staff role can read, no CapacitySettingsManage required", () => {
  it.each(Object.values(ActorRole))("role %s -> 200 with a tables array", async (role) => {
    const agent = agentsByRole.get(role)!;
    const res = await agent.get("/floorplan-resources/tables");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.tables)).toBe(true);
  });
});

describe("GET /floorplan-resources/tables — real inventory (against the real, shared Table catalog)", () => {
  it("both Sushi and Teppanyaki Tables are returned", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    expect(res.status).toBe(200);
    const areas = new Set(res.body.tables.map((t: { areaId: string }) => t.areaId));
    expect(areas.has("Sushi")).toBe(true);
    expect(areas.has("Teppanyaki")).toBe(true);
  });

  it("Teppanyaki is represented by its parent grill Table only — no Seat id appears, and Teppanyaki rows have supportsSharedSeating true", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    const teppanyaki = res.body.tables.filter((t: { areaId: string }) => t.areaId === "Teppanyaki");
    expect(teppanyaki.length).toBeGreaterThan(0);
    for (const t of teppanyaki) {
      expect(t.supportsSharedSeating).toBe(true);
      // A Seat id in this codebase's own seed convention is always
      // `${tableId}-seat-${suffix}` — assert no returned id has that shape.
      expect(t.id).not.toMatch(/-seat-/);
    }
  });

  it("every row contains exactly the six allowlisted keys, in real data", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    expect(res.body.tables.length).toBeGreaterThan(0);
    for (const t of res.body.tables) {
      expect(Object.keys(t).sort()).toEqual(["areaId", "id", "nominalCapacity", "operationalLabel", "status", "supportsSharedSeating"]);
    }
  });

  it("no createdAt, membership, assignment, block, or availability field appears anywhere in the response", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    const raw = JSON.stringify(res.body);
    expect(raw).not.toMatch(/createdAt/);
    expect(raw).not.toMatch(/floorplanVersionId/);
    expect(raw).not.toMatch(/assignment/i);
    expect(raw).not.toMatch(/block/i);
    expect(raw).not.toMatch(/availab/i);
  });

  it("Sushi Tables are not returned in raw database row order (Table 2 must sort before Table 10, unlike a plain lexicographic ORDER BY)", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    const sushiLabels: string[] = res.body.tables.filter((t: { areaId: string }) => t.areaId === "Sushi").map((t: { operationalLabel: string }) => t.operationalLabel);
    const index2 = sushiLabels.indexOf("Table 2");
    const index10 = sushiLabels.indexOf("Table 10");
    expect(index2).toBeGreaterThanOrEqual(0);
    expect(index10).toBeGreaterThanOrEqual(0);
    expect(index2).toBeLessThan(index10);
  });

  it("area grouping: every Sushi row precedes every Teppanyaki row", async () => {
    const res = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    const areas: string[] = res.body.tables.map((t: { areaId: string }) => t.areaId);
    const lastSushi = areas.lastIndexOf("Sushi");
    const firstTeppanyaki = areas.indexOf("Teppanyaki");
    expect(lastSushi).toBeLessThan(firstTeppanyaki);
  });

  it("repeated calls return the same order", async () => {
    const first = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    const second = await agentsByRole.get(ActorRole.Owner)!.get("/floorplan-resources/tables");
    expect(second.body.tables.map((t: { id: string }) => t.id)).toEqual(first.body.tables.map((t: { id: string }) => t.id));
  });
});

describe("GET /floorplan-resources/tables — existing nine Floorplan routes remain unaffected", () => {
  it("GET /floorplans still works and does not include this route's shape", async () => {
    const res = await agentsByRole.get(ActorRole.Reception)!.get("/floorplans");
    expect(res.status).toBe(200);
    expect(Array.isArray(res.body.floorplans)).toBe(true);
    expect(res.body.tables).toBeUndefined();
  });

  it("POST /floorplans still requires CapacitySettingsManage (unlike the new inventory route)", async () => {
    const res = await post(agentsByRole.get(ActorRole.Reception)!, "/floorplans").send({ name: `Unaffected-${RUN_ID}` });
    expect(res.status).toBe(403);
  });
});

describe("GET /floorplan-resources/tables — production code never hardcodes a canonical Table id", () => {
  it("api/app.ts's floorplan-resources route contains no literal seeded Table id", () => {
    const appTsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "app.ts");
    const source = readFileSync(appTsPath, "utf8");
    const routeStart = source.indexOf('"/floorplan-resources/tables"');
    expect(routeStart).toBeGreaterThan(-1);
    const routeEnd = source.indexOf("\n  }", routeStart);
    const routeSource = source.slice(routeStart, routeEnd === -1 ? undefined : routeEnd);
    for (const forbidden of ["sushi-table-", "sushi-bar-", "teppanyaki-c", "teppanyaki-d", "teppanyaki-e", "teppanyaki-f"]) {
      expect(routeSource.toLowerCase()).not.toContain(forbidden);
    }
  });
});

describe("GET /floorplan-resources/tables — defensive/behavioral coverage via a fake FloorRepository", () => {
  it("an empty inventory returns 200 with an empty array", async () => {
    const app = buildFakeApp(new Map());
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.status).toBe(200);
    expect(res.body).toEqual({ tables: [] });
  });

  it("inactive Tables are included, not filtered out", async () => {
    const inactiveTable = fakeTable({ id: "fake-inactive-1", areaId: "Sushi", operationalLabel: "Table 1", status: "Inactive" });
    const app = buildFakeApp(new Map([["Sushi", [inactiveTable]], ["Teppanyaki", []]]));
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.status).toBe(200);
    expect(res.body.tables).toEqual([{ id: "fake-inactive-1", areaId: "Sushi", operationalLabel: "Table 1", nominalCapacity: 4, supportsSharedSeating: false, status: "Inactive" }]);
  });

  it("duplicate Table ids from the repository are emitted exactly once, deterministically", async () => {
    const dup1 = fakeTable({ id: "fake-dup-1", areaId: "Sushi", operationalLabel: "Table 5" });
    const dup2 = fakeTable({ id: "fake-dup-1", areaId: "Sushi", operationalLabel: "Table 5", nominalCapacity: 999 }); // same id, would-be conflicting data
    const app = buildFakeApp(new Map([["Sushi", [dup1, dup2]], ["Teppanyaki", []]]));
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.status).toBe(200);
    expect(res.body.tables).toHaveLength(1);
    expect(res.body.tables[0].id).toBe("fake-dup-1");
    expect(res.body.tables[0].nominalCapacity).toBe(4); // first-seen wins, deterministically
  });

  it("ordering is Sushi before Teppanyaki, then operationalLabel numeric-ascending, then id as the tie-breaker", async () => {
    const sushi = [
      fakeTable({ id: "z-sushi", areaId: "Sushi", operationalLabel: "Table 10" }),
      fakeTable({ id: "a-sushi", areaId: "Sushi", operationalLabel: "Table 2" }),
      fakeTable({ id: "b-sushi", areaId: "Sushi", operationalLabel: "Table 1" }),
    ];
    const teppanyaki = [
      fakeTable({ id: "fake-f", areaId: "Teppanyaki", operationalLabel: "F", supportsSharedSeating: true }),
      fakeTable({ id: "fake-c", areaId: "Teppanyaki", operationalLabel: "C", supportsSharedSeating: true }),
    ];
    const app = buildFakeApp(new Map([["Sushi", sushi], ["Teppanyaki", teppanyaki]]));
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.body.tables.map((t: { id: string }) => t.id)).toEqual(["b-sushi", "a-sushi", "z-sushi", "fake-c", "fake-f"]);
  });

  it("two Table ids that tie on operationalLabel break the tie by id ascending", async () => {
    const sushi = [
      fakeTable({ id: "id-b", areaId: "Sushi", operationalLabel: "Table 1" }),
      fakeTable({ id: "id-a", areaId: "Sushi", operationalLabel: "Table 1" }),
    ];
    const app = buildFakeApp(new Map([["Sushi", sushi], ["Teppanyaki", []]]));
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.body.tables.map((t: { id: string }) => t.id)).toEqual(["id-a", "id-b"]);
  });

  it("case/accent-equivalent labels (base-sensitivity ties) still produce deterministic id ordering", async () => {
    // sensitivity: "base" (the same option the production comparator is
    // configured with) treats case AND accent differences as equal — a
    // real-world case this route could plausibly see (e.g. staff-entered
    // label casing drift) must still resolve deterministically via the id
    // tie-breaker, never via engine-dependent/arbitrary relative order.
    const sushi = [
      fakeTable({ id: "id-z", areaId: "Sushi", operationalLabel: "CAFÉ 1" }),
      fakeTable({ id: "id-m", areaId: "Sushi", operationalLabel: "café 1" }),
      fakeTable({ id: "id-a", areaId: "Sushi", operationalLabel: "Cafe 1" }),
    ];
    const app = buildFakeApp(new Map([["Sushi", sushi], ["Teppanyaki", []]]));
    const fakeAgent = await loginAgent(app, usernamesByRole.get(ActorRole.Owner)!);
    const res = await fakeAgent.get("/floorplan-resources/tables");
    expect(res.body.tables.map((t: { id: string }) => t.id)).toEqual(["id-a", "id-m", "id-z"]);
  });
});

describe("GET /floorplan-resources/tables — ordering comparator is explicitly locale-pinned in production code", () => {
  it("uses an explicit, non-default-locale Intl.Collator, constructed once at module scope, never String.prototype.localeCompare", () => {
    const appTsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "app.ts");
    const source = readFileSync(appTsPath, "utf8");

    // Constructed once, at module scope (before createApp's own
    // declaration) — not inside the request handler or any per-request
    // scope, and not rebuilt per comparison.
    const collatorDeclIndex = source.indexOf("const OPERATIONAL_LABEL_COLLATOR = new Intl.Collator(");
    const createAppIndex = source.indexOf("export function createApp(");
    expect(collatorDeclIndex).toBeGreaterThan(-1);
    expect(createAppIndex).toBeGreaterThan(-1);
    expect(collatorDeclIndex).toBeLessThan(createAppIndex);

    // An explicit locale argument — never Intl.Collator() / Intl.Collator(undefined, ...),
    // which would silently follow the host's current default locale.
    const collatorCallEnd = source.indexOf(")", collatorDeclIndex);
    const collatorCall = source.slice(collatorDeclIndex, collatorCallEnd + 1);
    expect(collatorCall).toMatch(/new Intl\.Collator\(\s*"[a-zA-Z-]+"/);
    expect(collatorCall).not.toMatch(/new Intl\.Collator\(\s*undefined/);

    // The route itself reuses the module-level collator and never falls
    // back to localeCompare (which — with no explicit locale argument —
    // is exactly the locale-dependent behavior this correction removes).
    const routeStart = source.indexOf('"/floorplan-resources/tables"');
    const routeEnd = source.indexOf("\n  }", routeStart);
    const routeSource = source.slice(routeStart, routeEnd === -1 ? undefined : routeEnd);
    expect(routeSource).toContain("OPERATIONAL_LABEL_COLLATOR.compare(");
    expect(routeSource).not.toMatch(/\.localeCompare\(/);
  });
});
