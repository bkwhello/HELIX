/**
 * CAP-D02.01 — minimum, code-level-only slice (Chief Engineer R1.6-P2B
 * decision #3): the canonical, server-authoritative Service axis is
 * purely meal-based — `"lunch"` or `"dinner"` — matching the boundary
 * already shipped client-side in `public/pilot.html` exactly (its own
 * "Dienst is derived from the chosen time" comment). This is NOT an
 * area/capacity-pool axis — Sushi/Teppanyaki remain `CapacityPoolId`
 * (see `CapacityPool.ts`), a completely separate concern (R1.6-P2A
 * decision #1/#2: a capacity pool is not a Service and must not
 * substitute for one). No persisted `Service` table and no
 * administration UI exist in this increment — mirrors `CapacityPool.ts`'s
 * own established precedent of staying a small, static, code-level
 * definition until a concrete need to change it without a code change
 * actually exists (`product-principles.md` PRP-014/PRP-020).
 *
 * Stored/compared values are lowercase (`"lunch"`/`"dinner"`) to match
 * the existing pilot convention (decision #4) — never re-cased or
 * compared case-insensitively anywhere in this module.
 */
import { toLocalMinuteOfDay } from "./ServiceTime.js";

export type ServiceCode = "lunch" | "dinner";

/** [12:00, 16:00) local — the exact boundary already shipped in public/pilot.html. */
const LUNCH_START_MINUTE = 12 * 60;
const LUNCH_END_MINUTE = 16 * 60;

export function isServiceCode(value: string): value is ServiceCode {
  return value === "lunch" || value === "dinner";
}

/**
 * The single, canonical, server-authoritative derivation. Uses
 * `ServiceTime.ts`'s `toLocalMinuteOfDay` — `Intl.DateTimeFormat` against
 * the fixed `Europe/Amsterdam` IANA zone, DST-correct by construction —
 * never the machine's local timezone and never a fixed UTC offset.
 * Mirrors `public/pilot.html`'s own client-side boundary exactly:
 * `[12:00, 16:00)` local minutes -> `"lunch"`, otherwise -> `"dinner"`.
 */
export function deriveServiceCode(instant: Date): ServiceCode {
  const minute = toLocalMinuteOfDay(instant);
  return minute >= LUNCH_START_MINUTE && minute < LUNCH_END_MINUTE ? "lunch" : "dinner";
}
