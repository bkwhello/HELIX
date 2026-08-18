/**
 * CAP-D02.03 — deterministic advisory-lock key derivation.
 *
 * `pg_advisory_xact_lock` accepts either one bigint key or two int4 keys.
 * We use the two-int4 form: a fixed namespace constant (this feature's
 * "channel", so its locks can never collide with an advisory lock some
 * other part of the system might one day take) plus a 32-bit hash of
 * `"${capacityPoolId}|${localServiceDate}"` as the second key.
 *
 * The hash MUST be deterministic and stable across processes and runs —
 * no runtime randomness, no `Math.random`, no per-process salt — because
 * two different application instances handling concurrent requests for
 * the same (pool, date) must compute the identical key to actually
 * contend on the same lock. FNV-1a is used because it is simple enough to
 * hand-verify and needs no dependency.
 */

/** "HALX" (Helix AvaiLability), fixed forever. Changing this constant silently changes every lock key already in flight — never change it in a running system. */
export const CAPACITY_LOCK_NAMESPACE = 0x48414c58 | 0;

const FNV_OFFSET_BASIS = 0x811c9dc5;
const FNV_PRIME = 0x01000193;

/** FNV-1a, 32-bit, forced to a signed int (pg_advisory_xact_lock(int4, int4) keys are signed). */
function fnv1a32(input: string): number {
  let hash = FNV_OFFSET_BASIS;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    // Math.imul keeps the multiply in 32-bit integer arithmetic — a plain
    // `*` would silently promote to a float and lose precision/determinism.
    hash = Math.imul(hash, FNV_PRIME);
  }
  return hash | 0;
}

export interface LockKey {
  readonly namespace: number;
  readonly key: number;
}

export function deriveLockKey(capacityPoolId: string, localServiceDate: string): LockKey {
  if (!capacityPoolId || !localServiceDate) {
    throw new Error("deriveLockKey: capacityPoolId and localServiceDate are both required.");
  }
  return { namespace: CAPACITY_LOCK_NAMESPACE, key: fnv1a32(`${capacityPoolId}|${localServiceDate}`) };
}

/**
 * "HALR" (Helix AvaiLability Reservation-lock) — deliberately a DIFFERENT
 * namespace from CAPACITY_LOCK_NAMESPACE, so a reservation-scoped lock key
 * and a (pool, date) lock key can never collide on the same
 * (namespace, key) pair even if their hashes happened to coincide.
 *
 * R1.1 P0 fix (Concurrent Modify vs Modify): serializes ALL Modify/Cancel
 * operations on the same reservation ahead of any capacity-resource lock
 * they take, so the "which commitment is currently active" question has
 * exactly one answer at a time per reservation — see
 * AvailabilityOrchestrator.modifyWithCapacity / cancelWithCapacity. Global
 * lock order (proven deadlock-free in R1_1_CONCURRENT_MODIFY_FIX_REPORT):
 * reservation-scoped lock (if any) FIRST, then capacity (pool, date)
 * locks in the sortLockResources order — every caller that takes both
 * follows this same order, so no cycle is possible.
 */
export const RESERVATION_LOCK_NAMESPACE = 0x48414c52 | 0;

export function deriveReservationLockKey(reservationId: string): LockKey {
  if (!reservationId) {
    throw new Error("deriveReservationLockKey: reservationId is required.");
  }
  return { namespace: RESERVATION_LOCK_NAMESPACE, key: fnv1a32(reservationId) };
}

export interface LockResource {
  readonly capacityPoolId: string;
  readonly localServiceDate: string;
}

/**
 * Deterministic global lock-acquisition order for multi-resource
 * operations — e.g. a Modify that moves a reservation from one
 * (pool, date) to another and must hold both locks at once. Sorting by
 * capacityPoolId then localServiceDate ascending, applied identically by
 * every caller, prevents the classic deadlock where operation A locks
 * resource 1 and waits for resource 2 while operation B locks resource 2
 * and waits for resource 1: with a fixed global order, every caller
 * always requests them in the same sequence, so at most one operation is
 * ever waiting at a time. Duplicate resources collapse to one entry —
 * locking the same (pool, date) twice in one transaction is redundant,
 * not incorrect, but callers should not rely on that; this function does
 * the deduplication so they don't have to.
 */
export function sortLockResources<T extends LockResource>(resources: readonly T[]): readonly T[] {
  const seen = new Set<string>();
  const deduped: T[] = [];
  for (const r of resources) {
    const dedupeKey = `${r.capacityPoolId}|${r.localServiceDate}`;
    if (seen.has(dedupeKey)) continue;
    seen.add(dedupeKey);
    deduped.push(r);
  }
  return deduped.sort((a, b) => {
    if (a.capacityPoolId !== b.capacityPoolId) return a.capacityPoolId < b.capacityPoolId ? -1 : 1;
    if (a.localServiceDate !== b.localServiceDate) return a.localServiceDate < b.localServiceDate ? -1 : 1;
    return 0;
  });
}
