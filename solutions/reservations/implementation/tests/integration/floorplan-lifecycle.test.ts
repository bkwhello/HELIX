import { describe, it, expect, afterAll } from "vitest";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { PrismaFloorRepository } from "../../infrastructure/persistence/PrismaFloorRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { FloorplanService } from "../../application/floor/FloorplanService.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { Actor, ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.5-P2B (corrected) — CAP-D03.02 Floorplan Management authoring/
 * default-version foundation: uniqueness, version-transition idempotency,
 * the atomic membership-replace contract (PUT semantics, not incremental
 * add), the required genuine-concurrency proofs (duplicate-revision race;
 * publish-vs-full-replacement race; set-default-vs-archive race; the
 * real, DB-level composite-FK proof that a default can never point at a
 * version of a different Floorplan), and the archive-default rejection.
 * Every test creates its own, uniquely-named Floorplan (RandomIdGenerator
 * ids, no shared fixture) — nothing here needs truncation.
 */
const prisma = createTestPrismaClient();
const prismaB = createTestPrismaClient();

const staffActor: Actor = { id: "staff-floorplan-lifecycle", kind: ActorKind.AuthorizedUser, role: ActorRole.Owner };

function service(client: typeof prisma) {
  return new FloorplanService(
    new PrismaFloorplanRepository(client),
    new PrismaFloorRepository(client),
    new PrismaTransactionManager(client),
    new RandomIdGenerator(),
    { now: () => new Date() }
  );
}

afterAll(async () => {
  await prisma.$disconnect();
  await prismaB.$disconnect();
});

async function createPublishedFloorplan(svc: FloorplanService, tableIds: readonly string[] = ["sushi-table-1"]) {
  const created = await svc.createFloorplan({ name: `Main Floor ${Date.now()}-${Math.random().toString(36).slice(2, 8)}`, actor: staffActor });
  const floorplan = created.floorplan;
  const draft = await svc.createDraftVersion({ floorplanId: floorplan.id, actor: staffActor });
  if (draft.type !== "CREATED") throw new Error("unreachable");
  const replaced = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds, actor: staffActor });
  if (replaced.type !== "REPLACED") throw new Error("unreachable");
  const published = await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
  if (published.type !== "PUBLISHED") throw new Error("unreachable");
  return { floorplan, version: published.version };
}

describe("FloorplanService — create Floorplan and Draft versions", () => {
  it("creates a Floorplan and a first Draft version at revision 1", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor A", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    expect(draft.type).toBe("CREATED");
    if (draft.type !== "CREATED") throw new Error("unreachable");
    expect(draft.version.revision).toBe(1);
    expect(draft.version.status).toBe("Draft");
  });

  it("a second Draft version gets revision 2, never colliding with revision 1", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor B", actor: staffActor });
    const first = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    const second = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (first.type !== "CREATED" || second.type !== "CREATED") throw new Error("unreachable");
    expect(first.version.revision).toBe(1);
    expect(second.version.revision).toBe(2);
  });

  it("createDraftVersion for an unknown floorplanId is FLOORPLAN_NOT_FOUND", async () => {
    const svc = service(prisma);
    const result = await svc.createDraftVersion({ floorplanId: "does-not-exist", actor: staffActor });
    expect(result).toEqual({ type: "FLOORPLAN_NOT_FOUND" });
  });
});

describe("FloorplanService — duplicate-revision race (genuine concurrency)", () => {
  it("N repetitions of two genuinely concurrent createDraftVersion() calls for the SAME floorplan: always exactly revisions {1,2}, never a collision", async () => {
    const svcA = service(prisma);
    const svcB = service(prismaB);
    const iterations = 10;
    for (let i = 0; i < iterations; i += 1) {
      const created = await svcA.createFloorplan({ name: `Race Floor ${i}-${Date.now()}`, actor: staffActor });
      const [r1, r2] = await Promise.all([
        svcA.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor }),
        svcB.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor }),
      ]);
      if (r1.type !== "CREATED" || r2.type !== "CREATED") throw new Error("unreachable");
      const revisions = [r1.version.revision, r2.version.revision].sort();
      expect(revisions).toEqual([1, 2]);

      const all = await prisma.floorplanVersion.findMany({ where: { floorplanId: created.floorplan.id } });
      expect(all).toHaveLength(2);
    }
  });
});

describe("FloorplanService.replaceMembers — atomic full-set replace (Table-level only)", () => {
  it("replacing an empty Draft with two Tables sets exactly those two", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace 1", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-2", "sushi-table-3"], actor: staffActor });
    expect(result).toEqual({ type: "REPLACED", tableIds: ["sushi-table-2", "sushi-table-3"] });
  });

  it("add two, then replace with one — the removed membership is gone", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace 2", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-4", "sushi-table-5"], actor: staffActor });
    expect(first.type).toBe("REPLACED");

    const second = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-4"], actor: staffActor });
    expect(second).toEqual({ type: "REPLACED", tableIds: ["sushi-table-4"] });

    const rows = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: draft.version.id } });
    expect(rows.map((r) => r.tableId).sort()).toEqual(["sushi-table-4"]);
    // sushi-table-5 is genuinely gone, not merely unlisted.
    const removedRow = await prisma.floorplanVersionResource.findFirst({ where: { floorplanVersionId: draft.version.id, tableId: "sushi-table-5" } });
    expect(removedRow).toBeNull();
  });

  it("replacing with an empty array is valid for a Draft and clears all membership", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace 3", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-6"], actor: staffActor });
    const cleared = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: [], actor: staffActor });
    expect(cleared).toEqual({ type: "REPLACED", tableIds: [] });
    const rows = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: draft.version.id } });
    expect(rows).toHaveLength(0);
  });

  it("duplicate IDs in the request are normalized to exactly one membership row", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace 4", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-7", "sushi-table-7", "sushi-table-7"], actor: staffActor });
    expect(result).toEqual({ type: "REPLACED", tableIds: ["sushi-table-7"] });
    const rows = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: draft.version.id } });
    expect(rows).toHaveLength(1);
  });

  it("an unknown Table rolls back the WHOLE replacement — zero membership change, the prior set is preserved exactly", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace 5", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-8"], actor: staffActor });
    expect(first.type).toBe("REPLACED");

    const attempt = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-9", "does-not-exist"], actor: staffActor });
    expect(attempt).toEqual({ type: "UNKNOWN_TABLE_IDS", tableIds: ["does-not-exist"] });

    // The prior set (just sushi-table-8) is untouched — never partially replaced.
    const rows = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: draft.version.id } });
    expect(rows.map((r) => r.tableId)).toEqual(["sushi-table-8"]);
  });

  it("replacing membership on a Published version is refused — VERSION_NOT_DRAFT", async () => {
    const svc = service(prisma);
    const { version } = await createPublishedFloorplan(svc, ["sushi-table-10"]);
    const result = await svc.replaceMembers({ floorplanVersionId: version.id, tableIds: ["sushi-table-11"], actor: staffActor });
    expect(result).toEqual({ type: "VERSION_NOT_DRAFT", currentStatus: "Published" });
    // Original membership untouched.
    const rows = await prisma.floorplanVersionResource.findMany({ where: { floorplanVersionId: version.id } });
    expect(rows.map((r) => r.tableId)).toEqual(["sushi-table-10"]);
  });

  it("replacing membership on an Archived version is refused — VERSION_NOT_DRAFT", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace Archived", actor: staffActor });
    const draft1 = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft1.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft1.version.id, tableIds: ["sushi-table-12"], actor: staffActor });
    await svc.publishVersion({ versionId: draft1.version.id, actor: staffActor });
    await svc.setDefaultVersion({ floorplanId: created.floorplan.id, versionId: draft1.version.id, actor: staffActor });

    const draft2 = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft2.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft2.version.id, tableIds: ["sushi-table-13"], actor: staffActor });
    await svc.publishVersion({ versionId: draft2.version.id, actor: staffActor });
    const archived = await svc.archiveVersion({ versionId: draft2.version.id, actor: staffActor });
    expect(archived.type).toBe("ARCHIVED");

    const result = await svc.replaceMembers({ floorplanVersionId: draft2.version.id, tableIds: ["sushi-table-14"], actor: staffActor });
    expect(result).toEqual({ type: "VERSION_NOT_DRAFT", currentStatus: "Archived" });
  });

  it("repeating the SAME normalized set is idempotent — no write, same result", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace Idempotent", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const first = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-16", "sushi-table-15"], actor: staffActor });
    const second = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-15", "sushi-table-16"], actor: staffActor });
    expect(first).toEqual({ type: "REPLACED", tableIds: ["sushi-table-15", "sushi-table-16"] });
    expect(second).toEqual({ type: "REPLACED", tableIds: ["sushi-table-15", "sushi-table-16"] });
  });

  it("response returns the membership set in deterministic Table-ID order regardless of request order", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Replace Order", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-9", "sushi-table-1", "sushi-table-5"], actor: staffActor });
    expect(result).toEqual({ type: "REPLACED", tableIds: ["sushi-table-1", "sushi-table-5", "sushi-table-9"] });
  });
});

describe("FloorplanService.publishVersion — requires non-empty membership, idempotency, invalid transitions", () => {
  it("publishing a Draft with zero members is refused — NO_MEMBERS", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Publish Empty", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
    expect(result).toEqual({ type: "NO_MEMBERS" });
  });

  it("a version explicitly emptied via replaceMembers([]) also fails to publish", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Publish Emptied", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-2"], actor: staffActor });
    await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: [], actor: staffActor });
    const result = await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
    expect(result).toEqual({ type: "NO_MEMBERS" });
  });

  it("publishing twice is idempotent — same publishedAt, no restamp", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Publish", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-table-7"], actor: staffActor });
    const first = await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
    const second = await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
    if (first.type !== "PUBLISHED" || second.type !== "PUBLISHED") throw new Error("unreachable");
    expect(second.version.publishedAt?.toISOString()).toBe(first.version.publishedAt?.toISOString());
  });

  it("publishing an Archived version is INVALID_TRANSITION — no way back", async () => {
    const svc = service(prisma);
    const otherFloorplan = await createPublishedFloorplan(svc, ["sushi-table-8"]);
    const created2 = await svc.createFloorplan({ name: "Test Floor Publish 2", actor: staffActor });
    const draft2 = await svc.createDraftVersion({ floorplanId: created2.floorplan.id, actor: staffActor });
    if (draft2.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft2.version.id, tableIds: ["sushi-table-9"], actor: staffActor });
    await svc.publishVersion({ versionId: draft2.version.id, actor: staffActor });
    await svc.setDefaultVersion({ floorplanId: created2.floorplan.id, versionId: draft2.version.id, actor: staffActor });

    const draft3 = await svc.createDraftVersion({ floorplanId: created2.floorplan.id, actor: staffActor });
    if (draft3.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft3.version.id, tableIds: ["sushi-table-10"], actor: staffActor });
    await svc.publishVersion({ versionId: draft3.version.id, actor: staffActor });
    const archived = await svc.archiveVersion({ versionId: draft3.version.id, actor: staffActor });
    expect(archived.type).toBe("ARCHIVED");

    const republish = await svc.publishVersion({ versionId: draft3.version.id, actor: staffActor });
    expect(republish).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Archived" });
    expect(otherFloorplan.version.status).toBe("Published"); // unaffected by the above
  });
});

describe("FloorplanService — setDefaultVersion requires Published, and cross-floorplan protection", () => {
  it("requires Published — a Draft version is VERSION_NOT_PUBLISHED", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Default 1", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.setDefaultVersion({ floorplanId: created.floorplan.id, versionId: draft.version.id, actor: staffActor });
    expect(result).toEqual({ type: "VERSION_NOT_PUBLISHED", currentStatus: "Draft" });
  });

  it("succeeds for a Published version of the SAME floorplan", async () => {
    const svc = service(prisma);
    const { floorplan, version } = await createPublishedFloorplan(svc, ["sushi-table-11"]);
    const result = await svc.setDefaultVersion({ floorplanId: floorplan.id, versionId: version.id, actor: staffActor });
    expect(result.type).toBe("DEFAULT_SET");
    if (result.type !== "DEFAULT_SET") throw new Error("unreachable");
    expect(result.floorplan.defaultVersionId).toBe(version.id);
  });

  it("the application layer rejects a version belonging to a DIFFERENT floorplan", async () => {
    const svc = service(prisma);
    const floorplanA = await svc.createFloorplan({ name: "Test Floor Cross A", actor: staffActor });
    const { version: versionB } = await createPublishedFloorplan(svc, ["sushi-table-12"]);
    const result = await svc.setDefaultVersion({ floorplanId: floorplanA.floorplan.id, versionId: versionB.id, actor: staffActor });
    expect(result).toEqual({ type: "VERSION_BELONGS_TO_DIFFERENT_FLOORPLAN" });
  });

  it("the DATABASE's own composite FK rejects a cross-floorplan default even bypassing the service's own check", async () => {
    const svc = service(prisma);
    const floorplanA = await svc.createFloorplan({ name: "Test Floor Cross DB A", actor: staffActor });
    const { version: versionB } = await createPublishedFloorplan(svc, ["sushi-table-13"]);
    const repo = new PrismaFloorplanRepository(prisma);
    const tm = new PrismaTransactionManager(prisma);
    await expect(
      tm.runInTransaction((tx) => repo.setDefaultVersion({ floorplanId: floorplanA.floorplan.id, versionId: versionB.id, tx }))
    ).rejects.toThrow();
  });
});

describe("FloorplanService — a default version may not be archived", () => {
  it("archiving the current default is refused", async () => {
    const svc = service(prisma);
    const { floorplan, version } = await createPublishedFloorplan(svc, ["sushi-table-15"]);
    await svc.setDefaultVersion({ floorplanId: floorplan.id, versionId: version.id, actor: staffActor });
    const result = await svc.archiveVersion({ versionId: version.id, actor: staffActor });
    expect(result).toEqual({ type: "CANNOT_ARCHIVE_DEFAULT_VERSION" });
  });

  it("archiving a Published, NON-default version succeeds", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Archive Non-Default", actor: staffActor });
    const draft1 = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft1.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft1.version.id, tableIds: ["sushi-table-16"], actor: staffActor });
    await svc.publishVersion({ versionId: draft1.version.id, actor: staffActor });
    await svc.setDefaultVersion({ floorplanId: created.floorplan.id, versionId: draft1.version.id, actor: staffActor });

    const draft2 = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft2.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft2.version.id, tableIds: ["sushi-bar-17"], actor: staffActor });
    const published2 = await svc.publishVersion({ versionId: draft2.version.id, actor: staffActor });
    if (published2.type !== "PUBLISHED") throw new Error("unreachable");

    const result = await svc.archiveVersion({ versionId: published2.version.id, actor: staffActor });
    expect(result.type).toBe("ARCHIVED");

    const stillDefault = await svc.findFloorplanById(created.floorplan.id);
    expect(stillDefault?.defaultVersionId).toBe(draft1.version.id);
  });

  it("archiving an already-Archived version is idempotent", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Archive Idempotent", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    await svc.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: ["sushi-bar-18"], actor: staffActor });
    await svc.publishVersion({ versionId: draft.version.id, actor: staffActor });
    const first = await svc.archiveVersion({ versionId: draft.version.id, actor: staffActor });
    const second = await svc.archiveVersion({ versionId: draft.version.id, actor: staffActor });
    expect(first.type).toBe("ARCHIVED");
    expect(second.type).toBe("ARCHIVED");
  });

  it("archiving a Draft directly is INVALID_TRANSITION", async () => {
    const svc = service(prisma);
    const created = await svc.createFloorplan({ name: "Test Floor Archive Draft", actor: staffActor });
    const draft = await svc.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
    if (draft.type !== "CREATED") throw new Error("unreachable");
    const result = await svc.archiveVersion({ versionId: draft.version.id, actor: staffActor });
    expect(result).toEqual({ type: "INVALID_TRANSITION", currentStatus: "Draft" });
  });
});

describe("FloorplanService — publish vs full-replacement race: genuinely concurrent, deterministic on either winner (both serialize on the SAME floorplan lock)", () => {
  it("N iterations: whichever wins, the final state is always self-consistent — publish never succeeds over a replacement that just emptied membership, and a replacement never silently mutates an already-Published version", async () => {
    const svcA = service(prisma);
    const svcB = service(prismaB);
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const created = await svcA.createFloorplan({ name: `Race PublishVsReplace ${i}-${Date.now()}`, actor: staffActor });
      const draft = await svcA.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
      if (draft.type !== "CREATED") throw new Error("unreachable");
      const tableId = i % 2 === 0 ? "sushi-table-1" : "sushi-table-2";
      // Seed one member so publish is EVER a plausible winner — the race
      // is over a REPLACEMENT that changes the set, not the initial add.
      const seeded = await svcA.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: [tableId], actor: staffActor });
      if (seeded.type !== "REPLACED") throw new Error("unreachable");

      const [publishResult, replaceResult] = await Promise.all([
        svcA.publishVersion({ versionId: draft.version.id, actor: staffActor }),
        svcB.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: [], actor: staffActor }), // attempts to empty the set concurrently
      ]);

      const finalVersion = await svcA.findVersionById(draft.version.id);
      const finalMembers = await svcA.listMembers(draft.version.id);

      if (replaceResult.type === "REPLACED") {
        // replaceMembers won the lock first -> membership was already
        // empty by the time publish's own re-read (under the SAME lock)
        // happened -> publish must have seen zero members and refused.
        expect(publishResult).toEqual({ type: "NO_MEMBERS" });
        expect(finalVersion?.status).toBe("Draft");
        expect(finalMembers).toHaveLength(0);
      } else {
        // publish won the lock first -> it published with the seeded
        // member still present; replaceMembers (running after) then
        // observes a Published (not Draft) version and is refused,
        // never silently mutating an already-Published version's set.
        expect(publishResult.type).toBe("PUBLISHED");
        expect(replaceResult).toEqual({ type: "VERSION_NOT_DRAFT", currentStatus: "Published" });
        expect(finalVersion?.status).toBe("Published");
        expect(finalMembers.map((m) => m.tableId)).toEqual([tableId]);
      }
    }
  });
});

describe("FloorplanService — setDefaultVersion vs archiveVersion: genuinely concurrent, deterministic on either winner (both serialize on the SAME floorplan lock)", () => {
  it("N iterations: exactly one of {DEFAULT_SET, ARCHIVED} succeeds for its own action, the other is correctly refused — a version is never simultaneously the default AND archived", async () => {
    const svcA = service(prisma);
    const svcB = service(prismaB);
    const iterations = 8;
    for (let i = 0; i < iterations; i += 1) {
      const created = await svcA.createFloorplan({ name: `Race DefaultVsArchive ${i}-${Date.now()}`, actor: staffActor });
      const draft = await svcA.createDraftVersion({ floorplanId: created.floorplan.id, actor: staffActor });
      if (draft.type !== "CREATED") throw new Error("unreachable");
      const tableId = i % 2 === 0 ? "sushi-table-3" : "sushi-table-4";
      await svcA.replaceMembers({ floorplanVersionId: draft.version.id, tableIds: [tableId], actor: staffActor });
      const published = await svcA.publishVersion({ versionId: draft.version.id, actor: staffActor });
      if (published.type !== "PUBLISHED") throw new Error("unreachable");

      const [defaultResult, archiveResult] = await Promise.all([
        svcA.setDefaultVersion({ floorplanId: created.floorplan.id, versionId: draft.version.id, actor: staffActor }),
        svcB.archiveVersion({ versionId: draft.version.id, actor: staffActor }),
      ]);

      const finalFloorplan = await svcA.findFloorplanById(created.floorplan.id);
      const finalVersion = await svcA.findVersionById(draft.version.id);

      if (defaultResult.type === "DEFAULT_SET") {
        expect(archiveResult).toEqual({ type: "CANNOT_ARCHIVE_DEFAULT_VERSION" });
        expect(finalFloorplan?.defaultVersionId).toBe(draft.version.id);
        expect(finalVersion?.status).toBe("Published");
      } else {
        expect(defaultResult).toEqual({ type: "VERSION_NOT_PUBLISHED", currentStatus: "Archived" });
        expect(archiveResult.type).toBe("ARCHIVED");
        expect(finalFloorplan?.defaultVersionId).toBeNull();
        expect(finalVersion?.status).toBe("Archived");
      }
      expect(finalVersion?.status === "Archived" && finalFloorplan?.defaultVersionId === draft.version.id).toBe(false);
    }
  });
});
