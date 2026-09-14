import { Floorplan, FloorplanVersion, FloorplanVersionStatus, FloorplanVersionResource } from "../floor/Floorplan.js";
import { TransactionContext } from "../shared/TransactionContext.js";

/**
 * R1.5-P2B — port for CAP-D03.02's authoring/default-version foundation.
 * Mirrors ServiceSessionRepository's own port shape (findX/create/update,
 * every write requires `tx`, one advisory-lock method). Every mutating
 * FloorplanService method acquires the SAME per-floorplan lock before
 * reading or writing — see acquireFloorplanLock's own doc comment — so,
 * unlike ServiceSession/CapacityCommitment/Reservation, no optimistic
 * `version` column is needed here: full serialization through one lock
 * per floorplan is the whole concurrency guarantee (and, with exactly one
 * Floorplan in the pilot, cheap to hold).
 */
export interface FloorplanRepository {
  findFloorplanById(id: string, tx?: TransactionContext): Promise<Floorplan | null>;
  listFloorplans(tx?: TransactionContext): Promise<readonly Floorplan[]>;

  createFloorplan(input: { readonly id: string; readonly name: string; readonly createdAt: Date; readonly tx: TransactionContext }): Promise<Floorplan>;

  /** Application-enforced only (see Floorplan.ts's own header comment): the caller re-validates status/same-floorplan under the lock before calling this — this method performs the write, not the check. */
  setDefaultVersion(input: { readonly floorplanId: string; readonly versionId: string | null; readonly tx: TransactionContext }): Promise<Floorplan>;

  findVersionById(id: string, tx?: TransactionContext): Promise<FloorplanVersion | null>;
  listVersionsByFloorplanId(floorplanId: string, tx?: TransactionContext): Promise<readonly FloorplanVersion[]>;

  /** revision is caller-supplied (derived under the floorplan lock, from the current max + 1) — never database-generated, so it stays deterministic and testable. */
  createVersion(input: {
    readonly id: string;
    readonly floorplanId: string;
    readonly revision: number;
    readonly createdBy: string;
    readonly createdAt: Date;
    readonly tx: TransactionContext;
  }): Promise<FloorplanVersion>;

  /** publishedAt omitted (undefined): leave the column untouched (e.g. Published -> Archived never re-stamps it). Explicitly supplied (even null, though never used that way today): written verbatim. */
  updateVersionStatus(input: {
    readonly id: string;
    readonly newStatus: FloorplanVersionStatus;
    readonly publishedAt?: Date | null;
    readonly tx: TransactionContext;
  }): Promise<FloorplanVersion>;

  listMembers(floorplanVersionId: string, tx?: TransactionContext): Promise<readonly FloorplanVersionResource[]>;

  /**
   * R1.5-P2B correction — replaces the removed incremental `addMember`:
   * deletes every existing membership row for this version and inserts
   * one row per (already-validated, already-deduplicated) tableId, in the
   * SAME transaction — a caller-visible atomic set-replace, not a diff.
   * The caller (FloorplanService.replaceMembers) is responsible for the
   * Draft-only/idempotent-repeat/unknown-Table checks under the floorplan
   * lock BEFORE calling this — this method performs the write only, same
   * division of responsibility as setDefaultVersion's own doc comment.
   * `tableIds` must already be deduplicated by the caller.
   */
  replaceMembers(input: { readonly floorplanVersionId: string; readonly tableIds: readonly string[]; readonly newRowIds: readonly string[]; readonly tx: TransactionContext }): Promise<readonly FloorplanVersionResource[]>;

  /**
   * Tier 1.4 of the global lock order (domain/availability/LockKey.ts):
   * reservation (Tier 1) -> floorplan (Tier 1.4, this) -> service session
   * (Tier 1.5) -> capacity (Tier 2) -> seating resource (Tier 3). Acquired
   * by EVERY mutating FloorplanService method (createDraftVersion,
   * publishVersion, setDefaultVersion, archiveVersion, replaceMembers)
   * before any read or write, so mutations to one Floorplan's version set
   * are fully serialized against each other. Not yet acquired by anything
   * outside this capability's own service in this increment — no
   * ServiceSession/seating-path wiring exists yet (R1.5-P2A stage 3/4).
   */
  acquireFloorplanLock(input: { readonly floorplanId: string; readonly tx: TransactionContext }): Promise<void>;
}
