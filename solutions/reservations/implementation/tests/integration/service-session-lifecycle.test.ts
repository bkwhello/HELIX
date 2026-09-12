import { describe, it, expect, beforeAll, afterAll, beforeEach } from "vitest";
import { createTestPrismaClient, truncateReservationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";

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

function repo(client: typeof prisma) {
  return new PrismaServiceSessionRepository(client);
}
function service(client: typeof prisma) {
  return new ServiceSessionService(repo(client), new PrismaTransactionManager(client), new RandomIdGenerator(), { now: () => new Date() });
}

beforeAll(async () => {
  await truncateReservationDomainTables(prisma);
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
