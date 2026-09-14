import { FloorplanRepository } from "../../domain/repositories/FloorplanRepository.js";
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { Floorplan, FloorplanVersion, FloorplanVersionResource, isValidFloorplanVersionTransition } from "../../domain/floor/Floorplan.js";
import { TransactionManager } from "../ports/TransactionManager.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { Actor } from "../../domain/value-objects/Actor.js";

export type CreateFloorplanOutcome = { readonly type: "CREATED"; readonly floorplan: Floorplan };

export type CreateDraftVersionOutcome =
  | { readonly type: "CREATED"; readonly version: FloorplanVersion }
  | { readonly type: "FLOORPLAN_NOT_FOUND" };

/** tableIds is the authoritative, normalized (deduplicated, sorted) membership set AFTER the replace — deterministic Table-ID order, per the Chief Engineer's exact contract. */
export type ReplaceMembersOutcome =
  | { readonly type: "REPLACED"; readonly tableIds: readonly string[] }
  | { readonly type: "VERSION_NOT_FOUND" }
  | { readonly type: "VERSION_NOT_DRAFT"; readonly currentStatus: string }
  | { readonly type: "UNKNOWN_TABLE_IDS"; readonly tableIds: readonly string[] };

export type PublishVersionOutcome =
  | { readonly type: "PUBLISHED"; readonly version: FloorplanVersion }
  | { readonly type: "VERSION_NOT_FOUND" }
  | { readonly type: "INVALID_TRANSITION"; readonly currentStatus: string }
  | { readonly type: "NO_MEMBERS" };

export type SetDefaultVersionOutcome =
  | { readonly type: "DEFAULT_SET"; readonly floorplan: Floorplan }
  | { readonly type: "FLOORPLAN_NOT_FOUND" }
  | { readonly type: "VERSION_NOT_FOUND" }
  | { readonly type: "VERSION_NOT_PUBLISHED"; readonly currentStatus: string }
  | { readonly type: "VERSION_BELONGS_TO_DIFFERENT_FLOORPLAN" };

export type ArchiveVersionOutcome =
  | { readonly type: "ARCHIVED"; readonly version: FloorplanVersion }
  | { readonly type: "VERSION_NOT_FOUND" }
  | { readonly type: "INVALID_TRANSITION"; readonly currentStatus: string }
  | { readonly type: "CANNOT_ARCHIVE_DEFAULT_VERSION" };

/**
 * R1.5-P2B — CAP-D03.02 Floorplan Management, authoring/default-version
 * foundation only (R1.5-P2/P2A design gates). Every mutating method
 * acquires the Tier-1.4 floorplan advisory lock BEFORE any read or write
 * — see FloorplanRepository.acquireFloorplanLock's own doc comment for
 * why this makes a separate optimistic-concurrency `version` column
 * unnecessary here (full serialization per floorplan, not per-row CAS).
 *
 * Deliberately inert outside this file: no ServiceSession, seatability,
 * floor-read, or pilot code reads or writes anything here yet — that
 * wiring is out of scope for this increment (R1.5-P2A stages 3/4).
 */
export class FloorplanService {
  constructor(
    private readonly repository: FloorplanRepository,
    private readonly floorRepository: FloorRepository,
    private readonly transactionManager: TransactionManager,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async findFloorplanById(id: string): Promise<Floorplan | null> {
    return this.repository.findFloorplanById(id);
  }

  async listFloorplans(): Promise<readonly Floorplan[]> {
    return this.repository.listFloorplans();
  }

  async findVersionById(id: string): Promise<FloorplanVersion | null> {
    return this.repository.findVersionById(id);
  }

  async listVersionsByFloorplanId(floorplanId: string): Promise<readonly FloorplanVersion[]> {
    return this.repository.listVersionsByFloorplanId(floorplanId);
  }

  async listMembers(floorplanVersionId: string): Promise<readonly FloorplanVersionResource[]> {
    return this.repository.listMembers(floorplanVersionId);
  }

  /** No floorplan lock needed — this creates a brand-new Floorplan row, nothing pre-existing to serialize against. */
  async createFloorplan(input: { readonly name: string; readonly actor: Actor }): Promise<CreateFloorplanOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      const floorplan = await this.repository.createFloorplan({
        id: this.idGenerator.generate(),
        name: input.name,
        createdAt: this.clock.now(),
        tx,
      });
      return { type: "CREATED", floorplan };
    });
  }

  /**
   * Duplicate-revision race (mirrors ServiceSessionService.create's own
   * "lock BEFORE the existence/derivation check" posture): the floorplan
   * lock is acquired before computing the next revision number, so two
   * concurrent calls always observe each other's already-committed
   * revision and never collide — the `(floorplanId, revision)` unique
   * constraint remains the authoritative backstop regardless.
   */
  async createDraftVersion(input: { readonly floorplanId: string; readonly actor: Actor }): Promise<CreateDraftVersionOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireFloorplanLock({ floorplanId: input.floorplanId, tx });
      const floorplan = await this.repository.findFloorplanById(input.floorplanId, tx);
      if (!floorplan) return { type: "FLOORPLAN_NOT_FOUND" };

      const existing = await this.repository.listVersionsByFloorplanId(input.floorplanId, tx);
      const nextRevision = existing.reduce((max, v) => Math.max(max, v.revision), 0) + 1;

      const version = await this.repository.createVersion({
        id: this.idGenerator.generate(),
        floorplanId: input.floorplanId,
        revision: nextRevision,
        createdBy: input.actor.id,
        createdAt: this.clock.now(),
        tx,
      });
      return { type: "CREATED", version };
    });
  }

  /**
   * R1.5-P2B correction — replaces the removed incremental addMember with
   * a full, atomic set-replace. `tableIds` is deduplicated here (the
   * caller's raw request may contain duplicates — "normalized to one
   * membership row"); every id is validated to reference a real Table
   * BEFORE any write, under the floorplan lock — an unknown id rejects
   * the WHOLE call with zero membership change, never a partial replace.
   * An empty array is a valid replace (Draft only) — it simply clears
   * membership; publishVersion below is what refuses to publish an
   * empty-membership version, not this method.
   */
  async replaceMembers(input: { readonly floorplanVersionId: string; readonly tableIds: readonly string[]; readonly actor: Actor }): Promise<ReplaceMembersOutcome> {
    const preLookup = await this.repository.findVersionById(input.floorplanVersionId);
    if (!preLookup) return { type: "VERSION_NOT_FOUND" };

    const normalizedTableIds = [...new Set(input.tableIds)].sort();

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireFloorplanLock({ floorplanId: preLookup.floorplanId, tx });
      // Re-read under the lock — the pre-lock read above is only used to
      // discover which floorplan to lock, never authoritative (same
      // non-authoritative-pre-lookup pattern ServiceSessionService.transition
      // already uses).
      const current = await this.repository.findVersionById(input.floorplanVersionId, tx);
      if (!current) return { type: "VERSION_NOT_FOUND" };
      if (current.status !== "Draft") return { type: "VERSION_NOT_DRAFT", currentStatus: current.status };

      // Idempotent repeat: the requested normalized set already matches
      // the current membership exactly -> no write, same posture as
      // every other status-transition idempotency check in this file.
      const existingMembers = await this.repository.listMembers(input.floorplanVersionId, tx);
      const existingTableIds = existingMembers.map((m) => m.tableId).sort();
      if (existingTableIds.length === normalizedTableIds.length && existingTableIds.every((id, i) => id === normalizedTableIds[i])) {
        return { type: "REPLACED", tableIds: normalizedTableIds };
      }

      // Validate ALL requested Tables exist BEFORE writing anything —
      // "Any unknown Table causes a typed rejection and zero membership
      // change." Looping individual reads (no new FloorRepository method)
      // is fine at this scale (at most 23 Tables exist today).
      const unknown: string[] = [];
      for (const tableId of normalizedTableIds) {
        const table = await this.floorRepository.findTableById(tableId, tx);
        if (!table) unknown.push(tableId);
      }
      if (unknown.length > 0) return { type: "UNKNOWN_TABLE_IDS", tableIds: unknown };

      const newRowIds = normalizedTableIds.map(() => this.idGenerator.generate());
      const replaced = await this.repository.replaceMembers({ floorplanVersionId: input.floorplanVersionId, tableIds: normalizedTableIds, newRowIds, tx });
      return { type: "REPLACED", tableIds: replaced.map((m) => m.tableId).sort() };
    });
  }

  /** Idempotent repeat on an already-Published version (same status-transition idempotency posture as ServiceSessionService.transition): returns the SAME publishedAt, no restamp. Publishing an Archived version is INVALID_TRANSITION — there is no way back. */
  async publishVersion(input: { readonly versionId: string; readonly actor: Actor }): Promise<PublishVersionOutcome> {
    const preLookup = await this.repository.findVersionById(input.versionId);
    if (!preLookup) return { type: "VERSION_NOT_FOUND" };

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireFloorplanLock({ floorplanId: preLookup.floorplanId, tx });
      const current = await this.repository.findVersionById(input.versionId, tx);
      if (!current) return { type: "VERSION_NOT_FOUND" };

      if (current.status === "Published") return { type: "PUBLISHED", version: current };
      if (!isValidFloorplanVersionTransition(current.status, "Published")) {
        return { type: "INVALID_TRANSITION", currentStatus: current.status };
      }

      // An empty-membership Draft (never populated, or explicitly
      // replaced with an empty set via replaceMembers) may not be
      // published — checked under the SAME floorplan lock, so a
      // concurrent replaceMembers race is deterministically serialized
      // against this check (see the publish-vs-replace race proof).
      const members = await this.repository.listMembers(current.id, tx);
      if (members.length === 0) return { type: "NO_MEMBERS" };

      const version = await this.repository.updateVersionStatus({
        id: current.id,
        newStatus: "Published",
        publishedAt: this.clock.now(),
        tx,
      });
      return { type: "PUBLISHED", version };
    });
  }

  /**
   * Requires: the target version is Published, and belongs to the SAME
   * floorplanId the caller supplied — this application-layer check is
   * defense in depth alongside the real, DB-level composite FK
   * (Floorplan (id, defaultVersionId) -> FloorplanVersion (floorplanId, id))
   * that makes the same guarantee structurally impossible to violate even
   * if this check were ever bypassed.
   */
  async setDefaultVersion(input: { readonly floorplanId: string; readonly versionId: string; readonly actor: Actor }): Promise<SetDefaultVersionOutcome> {
    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireFloorplanLock({ floorplanId: input.floorplanId, tx });
      const floorplan = await this.repository.findFloorplanById(input.floorplanId, tx);
      if (!floorplan) return { type: "FLOORPLAN_NOT_FOUND" };

      const version = await this.repository.findVersionById(input.versionId, tx);
      if (!version) return { type: "VERSION_NOT_FOUND" };
      if (version.floorplanId !== input.floorplanId) return { type: "VERSION_BELONGS_TO_DIFFERENT_FLOORPLAN" };
      if (version.status !== "Published") return { type: "VERSION_NOT_PUBLISHED", currentStatus: version.status };

      const updated = await this.repository.setDefaultVersion({ floorplanId: input.floorplanId, versionId: input.versionId, tx });
      return { type: "DEFAULT_SET", floorplan: updated };
    });
  }

  /** A default version may not be archived (R1.5-P2A) — until a different Published version has already been made the default first. Archiving a non-default version, even one still referenced by an open ServiceSession's snapshot in a future increment, is safe and allowed (the snapshot's validity never depends on the source version's later status). */
  async archiveVersion(input: { readonly versionId: string; readonly actor: Actor }): Promise<ArchiveVersionOutcome> {
    const preLookup = await this.repository.findVersionById(input.versionId);
    if (!preLookup) return { type: "VERSION_NOT_FOUND" };

    return this.transactionManager.runInTransaction(async (tx) => {
      await this.repository.acquireFloorplanLock({ floorplanId: preLookup.floorplanId, tx });
      const current = await this.repository.findVersionById(input.versionId, tx);
      if (!current) return { type: "VERSION_NOT_FOUND" };

      if (current.status === "Archived") return { type: "ARCHIVED", version: current };
      if (!isValidFloorplanVersionTransition(current.status, "Archived")) {
        return { type: "INVALID_TRANSITION", currentStatus: current.status };
      }

      const floorplan = await this.repository.findFloorplanById(current.floorplanId, tx);
      if (floorplan?.defaultVersionId === current.id) {
        return { type: "CANNOT_ARCHIVE_DEFAULT_VERSION" };
      }

      // publishedAt intentionally omitted — Published -> Archived never re-stamps it (see updateVersionStatus's own doc comment).
      const version = await this.repository.updateVersionStatus({
        id: current.id,
        newStatus: "Archived",
        tx,
      });
      return { type: "ARCHIVED", version };
    });
  }
}
