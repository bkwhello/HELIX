import { ServiceSessionRepository } from "../../domain/repositories/ServiceSessionRepository.js";
import { ServiceSessionStatus } from "../../domain/availability/ServiceSession.js";
import { deriveServiceCode } from "../../domain/availability/Service.js";
import { toLocalServiceDate } from "../../domain/availability/ServiceTime.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

/**
 * R1.6-P2C-1 — the shared Tier-1.5 primitive every session-participating
 * call site uses (`SeatingOrchestrator.assignSeating`/`markSeated`/
 * `moveSeating`, `AvailabilityOrchestrator.createImmediateWalkIn`/
 * `modifyWithCapacity`'s seating-revalidation branch): derives the
 * session key SOLELY from the given `reservationDateTime` (never a
 * stored `servicePeriodId` — Chief Engineer decision #1/#2, so a
 * historical noncanonical value is gated identically to a canonical
 * one), acquires the session advisory lock (Tier 1.5 — see
 * `domain/availability/LockKey.ts`), then reads the CURRENT session row
 * under that lock.
 *
 * Deliberately returns only a status snapshot, never an allow/deny
 * decision — each caller applies its OWN policy on top (immediate
 * actions require exactly `"Opened"`; pre-assign rejects only `"Closed"`/
 * `"Cancelled"`; Move and modify-time revalidation apply no policy at
 * all and call this purely for the lock's serialization side effect).
 * This keeps the one genuinely shared piece (derive + lock + read)
 * exactly once, without forcing every caller into the same policy.
 */
export type ServiceSessionSnapshotStatus = "NotFound" | ServiceSessionStatus;

export interface ServiceSessionSnapshot {
  readonly status: ServiceSessionSnapshotStatus;
  readonly serviceCode: string;
  readonly serviceDate: string;
}

export async function lockAndReadServiceSession(input: {
  readonly serviceSessionRepository: ServiceSessionRepository;
  readonly reservationDateTime: Date;
  readonly tx: TransactionContext;
}): Promise<ServiceSessionSnapshot> {
  const serviceCode = deriveServiceCode(input.reservationDateTime);
  const serviceDate = toLocalServiceDate(input.reservationDateTime);
  await input.serviceSessionRepository.acquireSessionLock({ serviceCode, serviceDate, tx: input.tx });
  const session = await input.serviceSessionRepository.findByKey(serviceCode, serviceDate, input.tx);
  return { status: session ? session.status : "NotFound", serviceCode, serviceDate };
}

/** Immediate walk-in creation, immediate seating assignment, and mark-seated — Chief Engineer decision #7: require exactly `"Opened"`. */
export function requiresOpenedSession(snapshot: ServiceSessionSnapshot): boolean {
  return snapshot.status !== "Opened";
}

/** Pre-assignment — Chief Engineer decision #8: allowed when absent/Created/Opened, rejected only for Closed/Cancelled. */
export function rejectsPreAssignment(snapshot: ServiceSessionSnapshot): boolean {
  return snapshot.status === "Closed" || snapshot.status === "Cancelled";
}
