import { randomUUID } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { describe, it, expect, beforeAll, afterEach, afterAll } from "vitest";
import { createTestPrismaClient, resolveTestDatabaseUrl } from "../integration/support/testDatabaseSafety.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { bootstrapMainFloorplan, FloorplanBootstrapDriftError } from "../../ops/floor/bootstrapMainFloorplan.js";
import {
  MAIN_FLOOR_ID,
  MAIN_FLOOR_NAME,
  MAIN_FLOOR_VERSION_ID,
  MAIN_FLOOR_REVISION,
  BOOTSTRAP_SYSTEM_ACTOR_ID,
  EXPECTED_TABLE_IDS,
} from "../../ops/floor/mainFloorplanBootstrapPlan.js";

/**
 * R1.5-P2B-B — real-database proof for bootstrapMainFloorplan()'s I/O
 * shell (the transaction wiring, the actual writes, true rollback). Every
 * inventory-mismatch scenario is instead proven in
 * main-floorplan-bootstrap-plan.test.ts against fabricated in-memory data
 * — deliberately NOT here — because that would require mutating the real,
 * shared `tables`/`seats` rows this whole suite (and other concurrently-
 * running test files) depend on. This file only ever creates/deletes rows
 * scoped to the fixed "main-floor"/"main-floor-v1" ids (and one decoy
 * floorplan for the rollback proof) — ids no other test file uses — so it
 * is safe under this codebase's "different test files run concurrently
 * against the same shared test database" constraint.
 */

async function cleanupMainFloorplanFixture(prisma: PrismaClient): Promise<void> {
  // Floorplan.defaultVersionId -> FloorplanVersion is a SEPARATE FK from
  // FloorplanVersion.floorplanId -> Floorplan — the two tables reference
  // each other in opposite directions, so the default link must be
  // cleared before either row can be deleted.
  await prisma.floorplan.updateMany({ where: { id: MAIN_FLOOR_ID }, data: { defaultVersionId: null } });
  await prisma.floorplanVersionResource.deleteMany({ where: { floorplanVersionId: MAIN_FLOOR_VERSION_ID } });
  await prisma.floorplanVersion.deleteMany({ where: { id: MAIN_FLOOR_VERSION_ID } });
  await prisma.floorplan.deleteMany({ where: { id: MAIN_FLOOR_ID } });
}

async function insertValidFixture(
  prisma: PrismaClient,
  overrides: {
    readonly revision?: number;
    readonly versionStatus?: string;
    readonly defaultVersionId?: string | null;
    readonly memberTableIds?: readonly string[];
  } = {}
): Promise<void> {
  const now = new Date();
  const status = overrides.versionStatus ?? "Published";
  await prisma.floorplan.create({ data: { id: MAIN_FLOOR_ID, name: MAIN_FLOOR_NAME, createdAt: now } });
  await prisma.floorplanVersion.create({
    data: {
      id: MAIN_FLOOR_VERSION_ID,
      floorplanId: MAIN_FLOOR_ID,
      revision: overrides.revision ?? MAIN_FLOOR_REVISION,
      status,
      publishedAt: status === "Published" ? now : null,
      createdBy: BOOTSTRAP_SYSTEM_ACTOR_ID,
      createdAt: now,
    },
  });
  const memberIds = overrides.memberTableIds ?? EXPECTED_TABLE_IDS;
  if (memberIds.length > 0) {
    await prisma.floorplanVersionResource.createMany({
      data: memberIds.map((tableId) => ({ id: randomUUID(), floorplanVersionId: MAIN_FLOOR_VERSION_ID, tableId })),
    });
  }
  await prisma.floorplan.update({
    where: { id: MAIN_FLOOR_ID },
    data: { defaultVersionId: overrides.defaultVersionId === undefined ? MAIN_FLOOR_VERSION_ID : overrides.defaultVersionId },
  });
}

describe("bootstrapMainFloorplan — real database, create path", () => {
  const prisma = createTestPrismaClient();
  const url = resolveTestDatabaseUrl();

  beforeAll(async () => {
    await seedFloor(url); // idempotent — guarantees the canonical 23 Tables / 40 Seats exist
    await cleanupMainFloorplanFixture(prisma);
  });
  afterEach(async () => {
    await cleanupMainFloorplanFixture(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("empty DB (no existing main-floor) creates exactly 1 Floorplan, 1 Published version, 23 Table memberships, and the default link", async () => {
    const before = {
      reservations: await prisma.reservation.count(),
      staffUsers: await prisma.staffUser.count(),
      securityEvents: await prisma.securityEvent.count(),
      serviceSessions: await prisma.serviceSession.count(),
      tables: await prisma.table.count(),
      seats: await prisma.seat.count(),
    };

    const result = await bootstrapMainFloorplan(url);
    expect(result.outcome).toBe("CREATED");
    expect([...result.tableIds].sort()).toEqual([...EXPECTED_TABLE_IDS].sort());

    const floorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });
    expect(floorplan?.name).toBe(MAIN_FLOOR_NAME);
    expect(floorplan?.defaultVersionId).toBe(MAIN_FLOOR_VERSION_ID);

    const version = await prisma.floorplanVersion.findUnique({ where: { id: MAIN_FLOOR_VERSION_ID } });
    expect(version?.floorplanId).toBe(MAIN_FLOOR_ID);
    expect(version?.revision).toBe(MAIN_FLOOR_REVISION);
    expect(version?.status).toBe("Published");
    expect(version?.publishedAt).not.toBeNull();
    expect(version?.createdBy).toBe(BOOTSTRAP_SYSTEM_ACTOR_ID);

    const members = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: MAIN_FLOOR_VERSION_ID } });
    expect(members).toHaveLength(23);
    expect([...members.map((m) => m.tableId)].sort()).toEqual([...EXPECTED_TABLE_IDS].sort());
    // No Seat-membership concept exists structurally (no seatId column at
    // all), but assert every member's tableId really is a Table id anyway.
    for (const m of members) {
      expect(EXPECTED_TABLE_IDS).toContain(m.tableId);
    }

    const after = {
      reservations: await prisma.reservation.count(),
      staffUsers: await prisma.staffUser.count(),
      securityEvents: await prisma.securityEvent.count(),
      serviceSessions: await prisma.serviceSession.count(),
      tables: await prisma.table.count(),
      seats: await prisma.seat.count(),
    };
    expect(after).toEqual(before);
  });

  it("a second, identical run is a true no-op: stable timestamps, stable counts, no duplicate rows", async () => {
    const first = await bootstrapMainFloorplan(url);
    const firstVersion = await prisma.floorplanVersion.findUnique({ where: { id: MAIN_FLOOR_VERSION_ID } });
    const firstFloorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });

    const second = await bootstrapMainFloorplan(url);
    expect(second.outcome).toBe("ALREADY_BOOTSTRAPPED");
    expect([...second.tableIds].sort()).toEqual([...first.tableIds].sort());

    const secondVersion = await prisma.floorplanVersion.findUnique({ where: { id: MAIN_FLOOR_VERSION_ID } });
    const secondFloorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });
    expect(secondVersion?.createdAt).toEqual(firstVersion?.createdAt);
    expect(secondVersion?.publishedAt).toEqual(firstVersion?.publishedAt);
    expect(secondFloorplan?.createdAt).toEqual(firstFloorplan?.createdAt);

    expect(await prisma.floorplan.count({ where: { id: MAIN_FLOOR_ID } })).toBe(1);
    expect(await prisma.floorplanVersion.count({ where: { floorplanId: MAIN_FLOOR_ID } })).toBe(1);
    expect(await prisma.floorplanVersionResource.count({ where: { floorplanVersionId: MAIN_FLOOR_VERSION_ID } })).toBe(23);
  });
});

describe("bootstrapMainFloorplan — real database, drift rejection (zero writes on any material mismatch)", () => {
  const prisma = createTestPrismaClient();
  const url = resolveTestDatabaseUrl();

  beforeAll(async () => {
    await seedFloor(url);
  });
  afterEach(async () => {
    await cleanupMainFloorplanFixture(prisma);
  });
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("existing Floorplan name differs → rejects, existing row left untouched, no version created", async () => {
    await prisma.floorplan.create({ data: { id: MAIN_FLOOR_ID, name: "Wrong Name", createdAt: new Date() } });
    await expect(bootstrapMainFloorplan(url)).rejects.toThrow(FloorplanBootstrapDriftError);
    const floorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });
    expect(floorplan?.name).toBe("Wrong Name");
    expect(await prisma.floorplanVersion.count({ where: { floorplanId: MAIN_FLOOR_ID } })).toBe(0);
  });

  it("existing version has the wrong revision → rejects with zero additional writes", async () => {
    await insertValidFixture(prisma, { revision: 2 });
    await expect(bootstrapMainFloorplan(url)).rejects.toThrow(FloorplanBootstrapDriftError);
    expect(await prisma.floorplanVersion.count({ where: { floorplanId: MAIN_FLOOR_ID } })).toBe(1);
  });

  it("existing version status is not Published (still Draft) → rejects", async () => {
    await insertValidFixture(prisma, { versionStatus: "Draft" });
    await expect(bootstrapMainFloorplan(url)).rejects.toThrow(FloorplanBootstrapDriftError);
    const version = await prisma.floorplanVersion.findUnique({ where: { id: MAIN_FLOOR_VERSION_ID } });
    expect(version?.status).toBe("Draft");
  });

  it("existing membership set is missing a canonical Table id → rejects", async () => {
    await insertValidFixture(prisma, { memberTableIds: EXPECTED_TABLE_IDS.filter((id) => id !== "sushi-table-1") });
    await expect(bootstrapMainFloorplan(url)).rejects.toThrow(FloorplanBootstrapDriftError);
    expect(await prisma.floorplanVersionResource.count({ where: { floorplanVersionId: MAIN_FLOOR_VERSION_ID } })).toBe(22);
  });

  it("existing Floorplan.defaultVersionId does not point at main-floor-v1 → rejects", async () => {
    await insertValidFixture(prisma, { defaultVersionId: null });
    await expect(bootstrapMainFloorplan(url)).rejects.toThrow(FloorplanBootstrapDriftError);
    const floorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });
    expect(floorplan?.defaultVersionId).toBeNull();
  });
});

describe("bootstrapMainFloorplan — real database, all-or-nothing rollback", () => {
  it("a genuine mid-transaction failure (Version id collision, occurring AFTER Floorplan was already created in the same transaction) rolls back every bootstrap row", async () => {
    const prisma = createTestPrismaClient();
    const url = resolveTestDatabaseUrl();
    const decoyFloorplanId = "decoy-floorplan-for-rollback-proof";
    try {
      await seedFloor(url);
      await cleanupMainFloorplanFixture(prisma);
      await prisma.floorplan.deleteMany({ where: { id: decoyFloorplanId } });

      // Pre-insert a row that collides with the id bootstrapMainFloorplan
      // will try to use for its OWN version, but under a different
      // floorplan — createFloorplan("main-floor") succeeds first, then
      // createVersion("main-floor-v1") genuinely fails on the primary-key
      // uniqueness constraint. Real Postgres error, real rollback.
      await prisma.floorplan.create({ data: { id: decoyFloorplanId, name: "Decoy", createdAt: new Date() } });
      await prisma.floorplanVersion.create({
        data: { id: MAIN_FLOOR_VERSION_ID, floorplanId: decoyFloorplanId, revision: 1, status: "Draft", createdBy: "test-fixture", createdAt: new Date() },
      });

      await expect(bootstrapMainFloorplan(url)).rejects.toThrow();

      const floorplan = await prisma.floorplan.findUnique({ where: { id: MAIN_FLOOR_ID } });
      expect(floorplan).toBeNull(); // createFloorplan ran first in the same transaction — proves it was rolled back, not left dangling

      const memberCount = await prisma.floorplanVersionResource.count({ where: { floorplanVersionId: MAIN_FLOOR_VERSION_ID } });
      expect(memberCount).toBe(0);

      // The decoy version itself (pre-existing, untouched by the failed transaction) must still be exactly as inserted.
      const decoyVersion = await prisma.floorplanVersion.findUnique({ where: { id: MAIN_FLOOR_VERSION_ID } });
      expect(decoyVersion?.floorplanId).toBe(decoyFloorplanId);
    } finally {
      await cleanupMainFloorplanFixture(prisma);
      await prisma.floorplanVersion.deleteMany({ where: { id: MAIN_FLOOR_VERSION_ID } });
      await prisma.floorplan.deleteMany({ where: { id: decoyFloorplanId } });
      await prisma.$disconnect();
    }
  });
});
