import { describe, it, expect, beforeAll, beforeEach, afterAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createTestPrismaClient, truncateReservationDomainTables } from "./support/testDatabaseSafety.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { seedFloor } from "../../ops/floor/seedFloor.js";
import { createPublishedFloorplanFixture } from "./support/floorplanFixture.js";
import { CanonicalServicePeriodReader } from "../../infrastructure/CanonicalServicePeriodReader.js";
import { FakeServiceDefinitionRepository } from "../support/FakePorts.js";

function migrationSqlPath(): string {
  return path.join(
    path.dirname(fileURLToPath(import.meta.url)),
    "..",
    "..",
    "prisma",
    "migrations",
    "20260922145528_add_service_catalog",
    "migration.sql"
  );
}

/**
 * R1.6-P3A — CAP-D02.01 persisted-catalog migration content, seed data,
 * and its integration with ServiceSession's new `service_code` FK. The
 * two canonical `lunch`/`dinner` rows are shared, never-truncated
 * reference data every other integration test file also depends on (see
 * testDatabaseSafety.ts's own "tables/seats are seeded, authoritative
 * config" precedent, which `services` now follows) — no test in this
 * file ever updates, deletes, or renames either row, not even
 * temporarily, since a concurrently running test file could observe the
 * mutation while `fileParallelism: false` still lets other suites run
 * against this same shared database within the run. Where a real,
 * non-canonical row is needed (the migration-guard failure proof), it is
 * inserted and rolled back inside a single dedicated transaction that
 * never commits.
 */
const prisma = createTestPrismaClient();
const staffActor: Actor = { id: "staff-catalog", kind: ActorKind.AuthorizedUser, role: ActorRole.Reception };
const RUN_ID = `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
const CATALOG_FLOORPLAN_ID = `svs-catalog-floorplan-fixture-${RUN_ID}`;

function sessionService() {
  return new ServiceSessionService(
    new PrismaServiceSessionRepository(prisma),
    new PrismaTransactionManager(prisma),
    new RandomIdGenerator(),
    { now: () => new Date() },
    new PrismaFloorplanRepository(prisma),
    CATALOG_FLOORPLAN_ID
  );
}

// This file's own exact, narrow ServiceSession dates — deleted (never a
// broad month/year range) before every test, so a re-run of this file
// alone is idempotent regardless of what any OTHER test file's own
// date-range cleanup does or doesn't touch.
const CATALOG_SESSION_DATES = ["2028-01-10", "2028-01-11", "2028-01-12"].map((d) => new Date(`${d}T00:00:00.000Z`));

beforeAll(async () => {
  await truncateReservationDomainTables(prisma);
  await seedFloor(process.env["TEST_DATABASE_URL"]!);
  const anyTable = await prisma.table.findFirstOrThrow({ where: { status: "Active" } });
  await createPublishedFloorplanFixture(prisma, { floorplanId: CATALOG_FLOORPLAN_ID, tableIds: [anyTable.id] });
});
beforeEach(async () => {
  await prisma.serviceSession.deleteMany({ where: { serviceDate: { in: CATALOG_SESSION_DATES } } });
});
afterAll(async () => {
  await prisma.$disconnect();
});

describe("Migration content — only authorized statements", () => {
  it("the add_service_catalog migration contains exactly: CREATE TABLE services, the two-row seed, the safety guard, and the ServiceSession FK — nothing else", () => {
    const sql = readFileSync(migrationSqlPath(), "utf-8");

    expect(sql).toContain('CREATE TABLE "services"');
    expect(sql).toContain("INSERT INTO \"services\"");
    expect(sql).toContain("VALUES");
    expect(sql).toMatch(/'lunch',\s*'Lunch',\s*true/);
    expect(sql).toMatch(/'dinner',\s*'Dinner',\s*true/);
    expect(sql).toContain('ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_code_fkey"');
    expect(sql).toContain('FOREIGN KEY ("service_code") REFERENCES "services"("code")');
    expect(sql).toContain("ON DELETE RESTRICT");
    // Both actions RESTRICT: the two canonical codes are an immutable
    // natural key — neither deleting nor renaming "lunch"/"dinner" is
    // ever silently propagated into referencing ServiceSession rows.
    expect(sql).toContain("ON UPDATE RESTRICT");
    expect(sql).not.toMatch(/ON UPDATE CASCADE/);

    // No unrelated/destructive statement — specifically, none of the
    // unrelated DropForeignKey statements Prisma originally generated
    // for this migration (against pre-existing seating constraints) were
    // left in. Checked as an active SQL statement, not a bare substring —
    // this migration's own explanatory header comment legitimately
    // mentions "seating_assignment" by name to document that removal.
    expect(sql).not.toMatch(/DROP CONSTRAINT/);
    expect(sql).not.toMatch(/ALTER TABLE "seating_assignment/);
    expect(sql).not.toMatch(/DROP TABLE/);
    expect(sql).not.toMatch(/ALTER TABLE "reservations"/);
    expect(sql).not.toMatch(/ALTER TABLE "capacity_commitments"/);
  });

  it("the migration includes a safety guard that aborts if service_sessions already contains a non-canonical service_code, before the FK is added", () => {
    const sql = readFileSync(migrationSqlPath(), "utf-8");

    const guardIndex = sql.indexOf("RAISE EXCEPTION");
    const fkIndex = sql.indexOf('ADD CONSTRAINT "service_sessions_service_code_fkey"');
    expect(guardIndex).toBeGreaterThan(-1);
    expect(fkIndex).toBeGreaterThan(guardIndex);
    expect(sql).toMatch(/WHERE\s+"service_code"\s+NOT IN \('lunch',\s*'dinner'\)/);
  });
});

describe("Migration seed — exactly two canonical rows", () => {
  it("services contains exactly lunch and dinner, both enabled", async () => {
    const rows = await prisma.service.findMany({ orderBy: { code: "asc" } });
    expect(rows).toHaveLength(2);
    expect(rows.map((r) => r.code)).toEqual(["dinner", "lunch"]);
    expect(rows.every((r) => r.enabled)).toBe(true);
  });
});

describe("ServiceSession service_code FK", () => {
  it("a canonical code (lunch/dinner) is accepted by the database", async () => {
    const service = sessionService();
    const result = await service.create({ serviceCode: "lunch", serviceDate: "2028-01-10", actor: staffActor });
    expect(result.type).toBe("CREATED");
    const row = await prisma.serviceSession.findFirst({ where: { serviceCode: "lunch", serviceDate: new Date("2028-01-10T00:00:00.000Z") } });
    expect(row).not.toBeNull();
  });

  it("an unknown service_code is rejected by the database FK, bypassing the application-layer isServiceCode check entirely", async () => {
    await expect(
      prisma.serviceSession.create({
        data: {
          id: "fk-test-unknown-code",
          serviceCode: "brunch",
          serviceDate: new Date("2028-01-11T00:00:00.000Z"),
          status: "Created",
          createdBy: staffActor.id,
        },
      })
    ).rejects.toThrow();

    const row = await prisma.serviceSession.findUnique({ where: { id: "fk-test-unknown-code" } });
    expect(row).toBeNull();
  });
});

describe("ServiceSession→Service FK — canonical codes are immutable (ON UPDATE RESTRICT)", () => {
  it("the live FK's update action is RESTRICT (never CASCADE)", async () => {
    const rows = await prisma.$queryRawUnsafe<{ confupdtype: string }[]>(
      `SELECT confupdtype FROM pg_constraint WHERE conname = 'service_sessions_service_code_fkey'`
    );
    expect(rows).toHaveLength(1);
    // Postgres pg_constraint.confupdtype: 'r' = RESTRICT, 'a' = NO ACTION,
    // 'c' = CASCADE. Either of the first two satisfies "immutable"; the
    // committed migration specifically uses RESTRICT.
    expect(["r", "a"]).toContain(rows[0]!.confupdtype);
    expect(rows[0]!.confupdtype).not.toBe("c");
  });

  it('a raw attempt to rename the canonical code "lunch" while a referencing ServiceSession exists is rejected by the database — fully rolled back, no persistent state changed', async () => {
    try {
      await expect(
        // Same one-dedicated-connection pattern as the migration-guard
        // proof above: any error thrown inside this callback (here, the
        // FK's own ON UPDATE RESTRICT refusal) propagates out and causes
        // Prisma's automatic ROLLBACK — no separate manual rollback call.
        prisma.$transaction(async (tx) => {
          // A validly shaped ServiceSession referencing "lunch", so the
          // rename attempt below has a real referencing row to be
          // blocked by — without this row, an update to "lunch" would
          // simply succeed (nothing references it yet). Uses one of this
          // file's own CATALOG_SESSION_DATES (cleared by beforeEach
          // immediately before this test runs), not a new date — this
          // file does not own any date outside that set, and another
          // file's own generated range could otherwise collide.
          await tx.$executeRawUnsafe(
            `INSERT INTO "service_sessions" (id, service_code, service_date, status, created_by)
             VALUES ('rename-guard-proof-row', 'lunch', '2028-01-11', 'Created', 'staff-catalog')`
          );
          // No application update method for Service.code exists (by
          // design) — this raw SQL is the only way to even attempt a
          // rename, and it must be the database's own FK action, not
          // application code, that refuses it.
          await tx.$executeRawUnsafe(`UPDATE "services" SET code = 'lunch-renamed' WHERE code = 'lunch'`);
        })
      ).rejects.toThrow(/service_sessions_service_code_fkey|violates foreign key constraint/);
    } finally {
      // Safety net only, mirroring the migration-guard proof's own
      // convention above: under the current, correct FK this transaction
      // always rolls back on its own and there is nothing to clean up.
      await prisma.serviceSession.deleteMany({ where: { id: "rename-guard-proof-row" } });
    }

    // Verify afterward — lunch/dinner retain their original codes and
    // fields, no test ServiceSession remains, the FK remains present.
    const lunch = await prisma.service.findUnique({ where: { code: "lunch" } });
    expect(lunch).toMatchObject({ code: "lunch", displayName: "Lunch", enabled: true });
    const dinner = await prisma.service.findUnique({ where: { code: "dinner" } });
    expect(dinner).toMatchObject({ code: "dinner", displayName: "Dinner", enabled: true });

    const testRow = await prisma.serviceSession.findUnique({ where: { id: "rename-guard-proof-row" } });
    expect(testRow).toBeNull();

    const fkPresent = await prisma.$queryRawUnsafe<{ conname: string }[]>(
      `SELECT conname FROM pg_constraint WHERE conname = 'service_sessions_service_code_fkey'`
    );
    expect(fkPresent).toHaveLength(1);
  });
});

describe("Disabling a Service does not block ServiceSession lifecycle", () => {
  it("ServiceSessionService, its Prisma repository, and its production construction path have no ServiceDefinitionRepository or enabled dependency (structural proof, by construction)", () => {
    expect(ServiceSessionService.length).toBe(5); // repository, transactionManager, idGenerator, clock, floorplanRepository(+optional floorplanId)
    const servicePath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "application",
      "availability",
      "ServiceSessionService.ts"
    );
    const source = readFileSync(servicePath, "utf-8");
    expect(source).not.toMatch(/ServiceDefinitionRepository/);
    expect(source).not.toMatch(/\.enabled\b/);

    // Same absence at the repository layer that actually issues SQL for
    // ServiceSession — the FK is the only place `services` is ever
    // consulted on the session-lifecycle path.
    const repositoryPath = path.join(
      path.dirname(fileURLToPath(import.meta.url)),
      "..",
      "..",
      "infrastructure",
      "persistence",
      "PrismaServiceSessionRepository.ts"
    );
    const repositorySource = readFileSync(repositoryPath, "utf-8");
    expect(repositorySource).not.toMatch(/ServiceDefinitionRepository/);
    expect(repositorySource).not.toMatch(/\.enabled\b/);

    // The production construction path (api/app.ts, where the real
    // request-handling wiring lives) never gives ServiceSessionService a
    // ServiceDefinitionRepository — only CanonicalServicePeriodReader
    // receives one (wired in api/server.ts).
    const appPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "app.ts");
    const appSource = readFileSync(appPath, "utf-8");
    const construction = appSource.match(/new ServiceSessionService\(([\s\S]*?)\);/);
    expect(construction).not.toBeNull();
    expect(construction![1]).not.toMatch(/ServiceDefinitionRepository/);
  });

  it("create, open, and close all succeed end-to-end against the real, unmodified canonical FK (dinner — never disabled by this file)", async () => {
    const service = sessionService();
    const created = await service.create({ serviceCode: "dinner", serviceDate: "2028-01-12", actor: staffActor });
    expect(created.type).toBe("CREATED");
    if (created.type !== "CREATED") throw new Error("unreachable");

    const opened = await service.open(created.session.id);
    expect(opened.type).toBe("OPENED");

    const closed = await service.close(created.session.id);
    expect(closed.type).toBe("CLOSED");
  });

  it("a disabled Service (via an isolated fake repository) blocks canonical Reservation validation for the same code whose ServiceSession lifecycle just succeeded above, unaffected, on the real enabled row", async () => {
    // This does not mutate any real row — it constructs a second,
    // independent CanonicalServicePeriodReader over an in-memory fake
    // where "dinner" is disabled, purely to place the contrast next to
    // the real lifecycle proof above. Exhaustive coverage of this
    // fake-repository rejection path (missing rows, mismatch precedence,
    // message content) lives in canonical-service-period-reader.test.ts
    // and canonical-service-period.test.ts.
    const fake = new FakeServiceDefinitionRepository();
    fake.setEnabled("dinner", false);
    const reader = new CanonicalServicePeriodReader(fake);
    const result = await reader.validateReservation({
      servicePeriodId: "dinner",
      reservationDate: new Date("2028-01-12T19:00:00.000Z"), // 20:00 Europe/Amsterdam (CET) -> dinner
      partySize: 2,
    });
    expect(result.isValid).toBe(false);
    expect(result.ruleId).toBe("CAP-D02.01-R01");
  });
});

describe("Migration guard — real PostgreSQL failure proof (rollback-contained)", () => {
  function extractGuardSql(): string {
    const sql = readFileSync(migrationSqlPath(), "utf-8");
    const match = sql.match(/DO \$\$[\s\S]*?END \$\$;/);
    if (!match) {
      throw new Error("could not find the committed DO $$ ... END $$; guard block in migration.sql");
    }
    return match[0];
  }

  it("the committed guard, executed verbatim, rejects a pre-existing non-canonical service_code before the FK can be re-added — fully rolled back, no persistent state changed", async () => {
    const guardSql = extractGuardSql();

    try {
      await expect(
        // A Prisma interactive transaction pins the whole callback to one
        // dedicated connection and issues a single BEGIN; any error
        // thrown from inside it (here, the guard's own RAISE EXCEPTION)
        // propagates out and causes Prisma to automatically ROLLBACK —
        // there is no separate, manual rollback call, so this promise can
        // only resolve if the guard truly failed to raise.
        prisma.$transaction(async (tx) => {
          // 1-2: drop the FK inside this transaction only, reproducing
          // exactly the pre-FK condition the guard exists to protect.
          await tx.$executeRawUnsafe(
            'ALTER TABLE "service_sessions" DROP CONSTRAINT "service_sessions_service_code_fkey"'
          );

          // 3: a validly shaped ServiceSession row with a non-canonical
          // service_code — only possible with the FK dropped above.
          await tx.$executeRawUnsafe(
            `INSERT INTO "service_sessions" (id, service_code, service_date, status, created_by)
             VALUES ('guard-proof-row', 'brunch', '2028-01-13', 'Created', 'staff-catalog')`
          );

          // 4: the exact committed guard statement, extracted verbatim
          // from migration.sql above — not a rewritten approximation. If
          // the guard were removed, the extraction throws first. If it
          // were rewritten to silently rewrite/delete the incompatible
          // row instead of raising, or to check the wrong table/column,
          // this call would not throw and the assertion below would fail.
          await tx.$executeRawUnsafe(guardSql);
        })
      ).rejects.toThrow(/add_service_catalog migration aborted/);
    } finally {
      // Safety net only: under the current, correct guard the transaction
      // above always rolls back on its own and there is nothing here to
      // clean up. This exists so that a future regression which breaks
      // the guard (letting the transaction commit) cannot leave the
      // shared test database with a dropped FK or an incompatible row —
      // the assertion above still fails and flags the regression either way.
      await prisma.serviceSession.deleteMany({ where: { id: "guard-proof-row" } });
      const fkPresent = await prisma.$queryRawUnsafe<{ conname: string }[]>(
        `SELECT conname FROM pg_constraint WHERE conname = 'service_sessions_service_code_fkey'`
      );
      if (fkPresent.length === 0) {
        await prisma.$executeRawUnsafe(
          'ALTER TABLE "service_sessions" ADD CONSTRAINT "service_sessions_service_code_fkey" FOREIGN KEY ("service_code") REFERENCES "services"("code") ON DELETE RESTRICT ON UPDATE RESTRICT'
        );
      }
    }

    // 7: verify afterward — no persistent state changed.
    const incompatibleRow = await prisma.serviceSession.findUnique({ where: { id: "guard-proof-row" } });
    expect(incompatibleRow).toBeNull();

    const fkRows = await prisma.$queryRawUnsafe<{ conname: string }[]>(
      `SELECT conname FROM pg_constraint WHERE conname = 'service_sessions_service_code_fkey'`
    );
    expect(fkRows).toHaveLength(1);

    const canonicalRows = await prisma.service.findMany({ orderBy: { code: "asc" } });
    expect(canonicalRows.map((r) => ({ code: r.code, displayName: r.displayName, enabled: r.enabled }))).toEqual([
      { code: "dinner", displayName: "Dinner", enabled: true },
      { code: "lunch", displayName: "Lunch", enabled: true },
    ]);

    // The FK is provably still enforced post-rollback — an independent,
    // real-insert confirmation beyond the catalog/pg_constraint queries above.
    await expect(
      prisma.serviceSession.create({
        data: {
          id: "guard-proof-fk-still-enforced",
          serviceCode: "brunch",
          serviceDate: new Date("2028-01-13T00:00:00.000Z"),
          status: "Created",
          createdBy: staffActor.id,
        },
      })
    ).rejects.toThrow();
    const stillRejected = await prisma.serviceSession.findUnique({ where: { id: "guard-proof-fk-still-enforced" } });
    expect(stillRejected).toBeNull();
  });
});
