import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { createPublishedFloorplanFixture, publishNewDefaultVersion } from "./support/floorplanFixture.js";
import { randomUUID } from "node:crypto";

/**
 * R1.6-P2C-1 — ServiceSession repository/service lifecycle: uniqueness,
 * version-checked compare-and-swap, idempotent-repeat semantics, invalid
 * transitions, and two representative genuine-concurrency proofs
 * (duplicate creation; Open vs Cancel), each run across N iterations —
 * two genuinely concurrent PostgreSQL transactions per iteration, real
 * `pg_advisory_xact_lock` contention, the outcome (never timing) is the
 * evidence. Every OTHER consumer of the same `lockAndReadServiceSession`
 * primitive (see `service-session-enforcement.test.ts`) reuses this
 * identical, already-proven lock mechanism, so this file does not
 * re-prove it once per consumer.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();

const staffActor: Actor = { id: "staff-lifecycle", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };

/**
 * R1.5-P2C — every open() call needs an eligible Floorplan default. A
 * dedicated fixture id, NOT "main-floor" (see floorplanFixture.ts's own
 * doc comment), created once in beforeAll below and used by default by
 * every test in this file that does not care about floorplan specifics
 * (idempotent-repeat, invalid-transition, concurrency races). The
 * dedicated snapshot-behavior describe block below constructs its OWN
 * per-test fixtures with distinct ids instead.
 */
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const LIFECYCLE_FLOORPLAN_ID = `svs-lifecycle-floorplan-fixture-${RUN_ID}`;

function repo(client: typeof prisma) {
  return new PrismaServiceSessionRepository(client);
}
function floorplanRepo(client: typeof prisma) {
  return new PrismaFloorplanRepository(client);
}
function service(client: typeof prisma, floorplanId: string = LIFECYCLE_FLOORPLAN_ID) {
  return new ServiceSessionService(
    repo(client),
    new PrismaTransactionManager(client),
    new RandomIdGenerator(),
    { now: () => new Date() },
    new PrismaFloorplanRepository(client),
    floorplanId
  );
}

beforeAll(async () => {
  await truncateReservationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
  const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
  await createPublishedFloorplanFixture(prisma, { floorplanId: LIFECYCLE_FLOORPLAN_ID, tableIds: [anyTable.id] });
});
afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});
beforeEach(async () => {
  // Scoped to this file's own 2026-09 through 2026-11 date range —
  // never a blanket deleteMany({}) — so a concurrently-running test
  // file using ServiceSession with a disjoint date range (see
  // service-session-enforcement.test.ts's own 2027-01 range) is never
  // affected by this file's cleanup, and vice versa.
  await prisma.serviceSession.deleteMany({ where: { serviceDate: { gte: new Date("2026-09-01T00:00:00.000Z"), lt: new Date("2026-12-01T00:00:00.000Z") } } });
});

describe("ServiceSessionRepository — uniqueness", () => {
  it("@@unique([serviceCode, serviceDate]) rejects a second row for the identical key", async () => {
    const tm = new PrismaTransactionManager(prisma);
    await tm.runInTransaction((tx) => repo(prisma).create({ id: "svs-1", serviceCode: "lunch", serviceDate: "2026-09-15", createdBy: "x", createdAt: new Date(), tx }));
    await expect(
      tm.runInTransaction((tx) => repo(prisma).create({ id: "svs-2", serviceCode: "lunch", serviceDate: "2026-09-15", createdBy: "x", createdAt: new Date(), tx }))
    ).rejects.toThrow();
  });
});

describe("ServiceSessionService.create — duplicate creation yields exactly one row", () => {
  it("N repetitions of two genuinely concurrent create() calls for the identical key: always exactly one CREATED + one ALREADY_EXISTS, exactly one row persists", async () => {
    const svcA = service(prisma);
    const svcB = service(prismaB);
    const iterations = 15;
    for (let i = 0; i < iterations; i += 1) {
      const serviceDate = `2026-10-${String(i + 1).padStart(2, "0")}`;
      const [r1, r2] = await Promise.all([
        svcA.create({ serviceCode: "dinner", serviceDate, actor: staffActor }),
        svcB.create({ serviceCode: "dinner", serviceDate, actor: staffActor }),
      ]);
      const types = [r1.type, r2.type].sort();
      expect(types).toEqual(["ALREADY_EXISTS", "CREATED"]);

      const rows = await prisma.serviceSession.findMany({ where: { serviceCode: "dinner", serviceDate: new Date(`${serviceDate}T00:00:00.000Z`) } });
      expect(rows).toHaveLength(1);
    }
  });
});

describe("ServiceSessionService — idempotent repeats: no restamp, no version bump", () => {
  it("open() twice: second call returns the SAME openedAt and version as the first, no write", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-17", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.open(created.session.id);
    if (first.type !== "OPENED") throw new Error("unreachable");
    const second = await svc.open(created.session.id);
    if (second.type !== "OPENED") throw new Error("unreachable");
    expect(second.session.openedAt?.toISOString()).toBe(first.session.openedAt?.toISOString());
    expect(second.session.version).toBe(first.session.version);
  });

  it("close() twice: second call returns the SAME closedAt and version as the first", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-18", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    await svc.open(created.session.id);
    const first = await svc.close(created.session.id);
    if (first.type !== "CLOSED") throw new Error("unreachable");
    const second = await svc.close(created.session.id);
    if (second.type !== "CLOSED") throw new Error("unreachable");
    expect(second.session.closedAt?.toISOString()).toBe(first.session.closedAt?.toISOString());
    expect(second.session.version).toBe(first.session.version);
  });

  it("cancel() twice: second call returns the SAME cancelledAt and version as the first", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-19", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.cancel(created.session.id);
    if (first.type !== "CANCELLED") throw new Error("unreachable");
    const second = await svc.cancel(created.session.id);
    if (second.type !== "CANCELLED") throw new Error("unreachable");
    expect(second.session.cancelledAt?.toISOString()).toBe(first.session.cancelledAt?.toISOString());
    expect(second.session.version).toBe(first.session.version);
  });
});

describe("ServiceSessionService — invalid transitions", () => {
  it("close() on a Created (not yet Opened) session is INVALID_TRANSITION", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-20", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.close(created.session.id);
    expect(result).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Created" });
  });

  it("open() on a Cancelled session is INVALID_TRANSITION", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-21", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    await svc.cancel(created.session.id);
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Cancelled" });
  });

  it("cancel() on an Opened session is INVALID_TRANSITION", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-22", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    await svc.open(created.session.id);
    const result = await svc.cancel(created.session.id);
    expect(result).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Opened" });
  });

  it("open()/close()/cancel() on an unknown id is NOT_FOUND", async () => {
    const svc = service(prisma);
    expect(await svc.open("does-not-exist")).toEqual({ type: "NOT_FOUND" });
    expect(await svc.close("does-not-exist")).toEqual({ type: "NOT_FOUND" });
    expect(await svc.cancel("does-not-exist")).toEqual({ type: "NOT_FOUND" });
  });
});

describe("ServiceSessionService — Open vs Cancel: exactly one valid terminal outcome", () => {
  it("N repetitions of two genuinely concurrent transitions on the SAME Created session (open, cancel): always exactly one succeeds, the other sees INVALID_TRANSITION", async () => {
    const svcA = service(prisma);
    const svcB = service(prismaB);
    const iterations = 15;
    for (let i = 0; i < iterations; i += 1) {
      const serviceDate = `2026-11-${String(i + 1).padStart(2, "0")}`;
      const created = await service(prisma).create({ serviceCode: "lunch", serviceDate, actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");

      const [openResult, cancelResult] = await Promise.all([svcA.open(created.session.id), svcB.cancel(created.session.id)]);

      const outcomes = [openResult.type, cancelResult.type].sort();
      // Exactly one succeeds (OPENED or CANCELLED); the other must be
      // INVALID_TRANSITION, having observed the winner's already-
      // committed new status under the same lock — never both
      // succeeding, never both failing.
      const succeeded = outcomes.filter((t) => t === "OPENED" || t === "CANCELLED");
      const failed = outcomes.filter((t) => t === "INVALID_TRANSITION");
      expect(succeeded).toHaveLength(1);
      expect(failed).toHaveLength(1);

      const final = await service(prisma).findById(created.session.id);
      expect(["Opened", "Cancelled"]).toContain(final?.status);
    }
  });
});

/**
 * R1.5-P2C — ServiceSession Floorplan Snapshot Wiring. Every test below
 * that cares about a SPECIFIC version identity (not just "some valid
 * default exists") constructs its OWN dedicated, uniquely-named Floorplan
 * fixture via floorplanFixture.ts — never LIFECYCLE_FLOORPLAN_ID, and
 * never "main-floor" (that literal id is tests/ops/main-floorplan-bootstrap.test.ts's
 * own exclusive fixture).
 */
describe("ServiceSessionService — R1.5-P2C Floorplan snapshot on Open", () => {
  it("Created sessions have a null floorplanVersionId snapshot", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-23", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    expect(created.session.floorplanVersionId).toBeNull();
  });

  it("Cancelled-from-Created retains a null snapshot", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-23", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const cancelled = await svc.cancel(created.session.id);
    if (cancelled.type !== "CANCELLED") throw new Error("unreachable");
    expect(cancelled.session.floorplanVersionId).toBeNull();
  });

  it("first open() stores the current Published default's version id", async () => {
    const floorplanId = `svs-lc-snap-first-open-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-24", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    expect(opened.session.floorplanVersionId).toBe(fixture.versionId);
  });

  it("close() retains the Open-time snapshot", async () => {
    const floorplanId = `svs-lc-snap-close-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-24", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    const closed = await svc.close(created.session.id);
    if (closed.type !== "CLOSED") throw new Error("unreachable");
    expect(closed.session.floorplanVersionId).toBe(fixture.versionId);
  });

  it("repeated open() retains the ORIGINAL snapshot, openedAt, and version even after the global default changes", async () => {
    const floorplanId = `svs-lc-snap-repeat-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    const fixtureA = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-25", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.open(created.session.id);
    if (first.type !== "OPENED") throw new Error("unreachable");
    expect(first.session.floorplanVersionId).toBe(fixtureA.versionId);

    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: [anyTable.id] });

    const second = await svc.open(created.session.id);
    if (second.type !== "OPENED") throw new Error("unreachable");
    expect(second.session.floorplanVersionId).toBe(first.session.floorplanVersionId);
    expect(second.session.openedAt?.toISOString()).toBe(first.session.openedAt?.toISOString());
    expect(second.session.version).toBe(first.session.version);
  });

  it("a missing Floorplan rejects with NO_DEFAULT_FLOORPLAN_VERSION and zero session mutation", async () => {
    const svc = service(prisma, `svs-lc-snap-no-floorplan-${Date.now()}`);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-25", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "NO_DEFAULT_FLOORPLAN_VERSION" });
    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created");
    expect(row.floorplanVersionId).toBeNull();
    expect(row.version).toBe(1);
  });

  it("a missing default (Floorplan exists, defaultVersionId null) rejects with zero mutation", async () => {
    const floorplanId = `svs-lc-snap-no-default-${Date.now()}`;
    const tm = new PrismaTransactionManager(prisma);
    await tm.runInTransaction((tx) => floorplanRepo(prisma).createFloorplan({ id: floorplanId, name: "No Default", createdAt: new Date(), tx }));

    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-26", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "NO_DEFAULT_FLOORPLAN_VERSION" });
    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created");
  });

  it("a Draft default (drift — default points at a non-Published version) rejects safely with zero mutation", async () => {
    const floorplanId = `svs-lc-snap-draft-default-${Date.now()}`;
    const fpRepo = floorplanRepo(prisma);
    const tm = new PrismaTransactionManager(prisma);
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    await tm.runInTransaction(async (tx) => {
      await fpRepo.createFloorplan({ id: floorplanId, name: "Draft Default", createdAt: new Date(), tx });
      const versionId = `${floorplanId}-v1`;
      await fpRepo.createVersion({ id: versionId, floorplanId, revision: 1, createdBy: "test-fixture", createdAt: new Date(), tx });
      await fpRepo.replaceMembers({ floorplanVersionId: versionId, tableIds: [anyTable.id], newRowIds: [randomUUID()], tx });
      // Deliberately left Draft (never published) — forcing it as default
      // directly via the repository (its own doc comment: "the caller
      // validates" — FloorplanService itself would never allow this;
      // this simulates externally-introduced drift).
      await fpRepo.setDefaultVersion({ floorplanId, versionId, tx });
    });

    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-26", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "NO_DEFAULT_FLOORPLAN_VERSION" });
    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created");
  });

  it("an Archived default (drift) rejects safely with zero mutation", async () => {
    const floorplanId = `svs-lc-snap-archived-default-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const fpRepo = floorplanRepo(prisma);
    const tm = new PrismaTransactionManager(prisma);
    // defaultVersionId still points at this version even after archiving it directly — drift.
    await tm.runInTransaction((tx) => fpRepo.updateVersionStatus({ id: fixture.versionId, newStatus: "Archived", tx }));

    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-27", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.open(created.session.id);
    expect(result).toEqual({ type: "NO_DEFAULT_FLOORPLAN_VERSION" });
    const row = await prisma.serviceSession.findUniqueOrThrow({ where: { id: created.session.id } });
    expect(row.status).toBe("Created");
  });
});

describe("ServiceSession — R1.5-P2C database-level backstops", () => {
  it("the FK rejects an unknown floorplan_version_id", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-27", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    await expect(
      prisma.serviceSession.update({
        where: { id: created.session.id },
        data: { status: "Opened", openedAt: new Date(), floorplanVersionId: "does-not-exist-version" },
      })
    ).rejects.toThrow();
  });

  it("the CHECK constraint rejects status=Opened with a null floorplan_version_id", async () => {
    const svc = service(prisma);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-28", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    await expect(
      prisma.serviceSession.update({ where: { id: created.session.id }, data: { status: "Opened", openedAt: new Date() } })
    ).rejects.toThrow();
  });

  it("the CHECK constraint rejects status=Closed with a null floorplan_version_id", async () => {
    const floorplanId = `svs-lc-snap-check-closed-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "dinner", serviceDate: "2026-09-28", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    await expect(
      prisma.serviceSession.update({ where: { id: created.session.id }, data: { status: "Closed", closedAt: new Date(), floorplanVersionId: null } })
    ).rejects.toThrow();
  });
});

describe("ServiceSessionService — Open vs default-change: deterministic snapshot, never torn or null", () => {
  it("N repetitions of a genuinely concurrent open() and default-change (racing on the SAME Tier-1.4 floorplan lock): the snapshot is always exactly one real version id, never null, never torn", async () => {
    const iterations = 10;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = `svs-lc-race-default-${i}-${Date.now()}`;
      const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
      const fixtureA = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
      const svcA = service(prisma, floorplanId);
      const serviceDate = `2026-10-${String(16 + i).padStart(2, "0")}`;
      const created = await svcA.create({ serviceCode: "lunch", serviceDate, actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");

      const [openResult] = await Promise.all([
        svcA.open(created.session.id),
        publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: [anyTable.id] }),
      ]);

      expect(openResult.type).toBe("OPENED");
      if (openResult.type !== "OPENED") throw new Error("unreachable");
      // Deterministic: whichever transaction won the floorplan lock first
      // completed entirely before the other started its own read — the
      // snapshot is EXACTLY the old or the new version id, never null,
      // never a partial/torn value.
      expect([fixtureA.versionId, `${floorplanId}-v2`]).toContain(openResult.session.floorplanVersionId);
    }
  });
});

describe("ServiceSessionService — two concurrent opens store one identical snapshot", () => {
  it("N repetitions of two genuinely concurrent open() calls on the SAME Created session: both report the identical snapshot, openedAt, and version", async () => {
    const iterations = 10;
    for (let i = 0; i < iterations; i += 1) {
      const floorplanId = `svs-lc-race-double-open-${i}-${Date.now()}`;
      const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
      const fixture = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
      const svcA = service(prisma, floorplanId);
      const svcB = service(prismaB, floorplanId);
      const serviceDate = `2026-11-${String(16 + i).padStart(2, "0")}`;
      const created = await svcA.create({ serviceCode: "dinner", serviceDate, actor: staffActor });
      if (created.type !== "CREATED") throw new Error("unreachable");

      const [r1, r2] = await Promise.all([svcA.open(created.session.id), svcB.open(created.session.id)]);
      expect(r1.type).toBe("OPENED");
      expect(r2.type).toBe("OPENED");
      if (r1.type !== "OPENED" || r2.type !== "OPENED") throw new Error("unreachable");
      expect(r1.session.floorplanVersionId).toBe(fixture.versionId);
      expect(r2.session.floorplanVersionId).toBe(fixture.versionId);
      expect(r1.session.openedAt?.toISOString()).toBe(r2.session.openedAt?.toISOString());
      expect(r1.session.version).toBe(r2.session.version);
    }
  });
});

describe("ServiceSessionService — archiving a non-default version referenced by a session does not break reads", () => {
  it("a session's own historical snapshot reference remains readable after its (now non-default) version is archived", async () => {
    const floorplanId = `svs-lc-archive-non-default-${Date.now()}`;
    const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
    const fixtureA = await createPublishedFloorplanFixture(prisma, { floorplanId, tableIds: [anyTable.id] });
    const svc = service(prisma, floorplanId);
    const created = await svc.create({ serviceCode: "lunch", serviceDate: "2026-09-29", actor: staffActor });
    if (created.type !== "CREATED") throw new Error("unreachable");
    const opened = await svc.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error("unreachable");
    expect(opened.session.floorplanVersionId).toBe(fixtureA.versionId);
    const closed = await svc.close(created.session.id);
    if (closed.type !== "CLOSED") throw new Error("unreachable");

    // Publish v2 and make it the new default — v1 is no longer default.
    await publishNewDefaultVersion(prisma, { floorplanId, revision: 2, tableIds: [anyTable.id] });

    // Archive v1 — the now-non-default version this session's snapshot still points at.
    const fpRepo = floorplanRepo(prisma);
    const tm = new PrismaTransactionManager(prisma);
    await tm.runInTransaction((tx) => fpRepo.updateVersionStatus({ id: fixtureA.versionId, newStatus: "Archived", tx }));

    const readBack = await svc.findById(created.session.id);
    expect(readBack?.floorplanVersionId).toBe(fixtureA.versionId);
    const version = await fpRepo.findVersionById(fixtureA.versionId);
    expect(version?.status).toBe("Archived");
  });
});
