import { FloorplanRepository } from "../../domain/repositories/FloorplanRepository.js";
import { FloorplanVersion } from "../../domain/floor/Floorplan.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

/**
 * R1.5-P2D — shared primitives for resolving "which FloorplanVersion's
 * membership governs this resource-selection decision, right now."
 *
 * Two symmetric call shapes:
 *  - Write paths (assignSeating/moveSeating/modifyWithCapacity) use the
 *    LOCKED resolver (`acquireFloorplanLockAndResolveProvisionalDefault`):
 *    Tier-1.4 lock first, always, before any Tier-1.5 work — see each
 *    call site's own comment for why this is unconditional even when the
 *    session turns out to already be Opened (Chief Engineer directive:
 *    "may acquire the main-floor Floorplan lock unconditionally... do not
 *    claim the lock is skipped unless a different ordering-safe mechanism
 *    is proven" — none is claimed here).
 *  - The advisory read (SeatingAvailabilityService) uses the UNLOCKED
 *    sibling (`resolveProvisionalDefaultAdvisory`) — consistent with that
 *    service's own established "never a lock of any kind" posture.
 *
 * Both share exactly one eligibility rule (`isEligibleDefault`) so
 * "what counts as an eligible Published default" is defined once, not
 * duplicated between the locked and unlocked paths.
 */
export type MembershipResolution =
  | { readonly type: "RESOLVED"; readonly floorplanVersionId: string; readonly memberTableIds: ReadonlySet<string> }
  | { readonly type: "NO_ELIGIBLE_FLOORPLAN_VERSION" };

function isEligibleDefault(floorplanId: string, version: FloorplanVersion | null): version is FloorplanVersion {
  return !!version && version.floorplanId === floorplanId && version.status === "Published";
}

/**
 * Tier-1.4 lock + read the CURRENT Floorplan default — the "provisional"
 * version a resource-selecting write falls back to when the relevant
 * ServiceSession has no snapshot yet (absent/Created). Always call this
 * BEFORE any Tier-1.5 work, preserving Reservation -> Floorplan ->
 * ServiceSession -> Capacity/date -> Seating.
 */
export async function acquireFloorplanLockAndResolveProvisionalDefault(input: {
  readonly floorplanRepository: FloorplanRepository;
  readonly floorplanId: string;
  readonly tx: TransactionContext;
}): Promise<FloorplanVersion | null> {
  await input.floorplanRepository.acquireFloorplanLock({ floorplanId: input.floorplanId, tx: input.tx });
  const floorplan = await input.floorplanRepository.findFloorplanById(input.floorplanId, input.tx);
  const version = floorplan?.defaultVersionId ? await input.floorplanRepository.findVersionById(floorplan.defaultVersionId, input.tx) : null;
  return isEligibleDefault(input.floorplanId, version) ? version : null;
}

/** Unlocked, advisory-only sibling — same eligibility rule, no lock, for SeatingAvailabilityService only. */
export async function resolveProvisionalDefaultAdvisory(input: {
  readonly floorplanRepository: FloorplanRepository;
  readonly floorplanId: string;
}): Promise<FloorplanVersion | null> {
  const floorplan = await input.floorplanRepository.findFloorplanById(input.floorplanId);
  const version = floorplan?.defaultVersionId ? await input.floorplanRepository.findVersionById(floorplan.defaultVersionId) : null;
  return isEligibleDefault(input.floorplanId, version) ? version : null;
}

/**
 * Pure — no I/O. A non-null session snapshot ALWAYS wins over the
 * provisional default, never the reverse (Chief Engineer decision: "never
 * fall back from a non-null session snapshot to the mutable default").
 */
export function resolveEffectiveFloorplanVersionId(sessionFloorplanVersionId: string | null, provisionalVersion: FloorplanVersion | null): string | null {
  return sessionFloorplanVersionId ?? provisionalVersion?.id ?? null;
}

/** Reads the effective version's membership set (FloorplanRepository.listMembers, already existing — no new repository method). `null` floorplanVersionId means no eligible version was resolved at all. */
export async function resolveMembership(input: {
  readonly floorplanRepository: FloorplanRepository;
  readonly floorplanVersionId: string | null;
  readonly tx?: TransactionContext;
}): Promise<MembershipResolution> {
  if (!input.floorplanVersionId) return { type: "NO_ELIGIBLE_FLOORPLAN_VERSION" };
  const members = await input.floorplanRepository.listMembers(input.floorplanVersionId, input.tx);
  return { type: "RESOLVED", floorplanVersionId: input.floorplanVersionId, memberTableIds: new Set(members.map((m) => m.tableId)) };
}
