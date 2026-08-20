/**
 * Persistence port for date-specific Service Period exceptions (Chief
 * Engineer R1.6-A assignment §4/§5/§20). The weekly recurring schedule
 * itself (domain/availability/ServicePeriod.ts's DEFAULT_WEEKLY_SCHEDULE)
 * is static config, not persisted — only the per-date override layer
 * needs real storage, since special dates (Christmas, New Year's Eve,
 * etc.) accumulate over time and their hours are not owner-confirmed in
 * advance (assignment §5: "do not hardcode special holiday hours").
 *
 * Unlike ClosingDayStore, an override is always area-scoped (never a
 * nullable/global "applies to every area" row) — the simplest correct
 * representation per assignment §8: a single `WHERE areaId = X AND date =
 * Y` lookup, no two-step area-then-global fallback branching. A special
 * date that applies to both areas is written as two rows (one per area,
 * same date/windows) by the caller — a convenience for the caller to
 * provide later (e.g. a management script or route), not a model concern.
 */
import { CapacityPoolId } from "../../domain/availability/CapacityPool.js";
import { BookingWindow } from "../../domain/availability/ServicePeriod.js";

export interface ServicePeriodOverrideRecord {
  readonly id: string;
  readonly areaId: CapacityPoolId;
  readonly date: string; // YYYY-MM-DD, local Europe/Amsterdam calendar date
  readonly status: "Open" | "Closed";
  readonly windows: readonly BookingWindow[]; // always empty when status is "Closed"
  readonly reason?: string;
}

export interface ServicePeriodOverrideStore {
  /** The single override for this exact area/date, or null if none exists (weekly schedule then applies — see ServicePeriod.ts's resolveDaySchedule). */
  findForDate(area: CapacityPoolId, date: string): Promise<ServicePeriodOverrideRecord | null>;

  /** Idempotent create-or-replace for one area/date. `windows` is ignored (stored empty) when status is "Closed". */
  upsert(input: {
    readonly area: CapacityPoolId;
    readonly date: string;
    readonly status: "Open" | "Closed";
    readonly windows: readonly BookingWindow[];
    readonly reason?: string;
    readonly createdBy: string;
  }): Promise<ServicePeriodOverrideRecord>;

  remove(id: string): Promise<void>;

  list(area?: CapacityPoolId): Promise<readonly ServicePeriodOverrideRecord[]>;
}
