/**
 * Chief Engineer R1.6-A assignment §9/§10 — the application-layer
 * operation that answers "which reservation start times are bookable" and
 * "is this exact start time bookable", by composing:
 *
 *   1. ClosingDayStore.isClosed        (real, DB-backed, pre-existing — R1.1)
 *   2. ServicePeriodOverrideStore      (real, DB-backed, new — R1.6-A)
 *   3. ServicePeriod.ts's pure resolveDaySchedule (weekly fallback + precedence)
 *
 * This is the ONLY place these three are composed — mirrors
 * AvailabilityOrchestrator's own "one place composes I/O + pure domain
 * logic" shape (CAP-D02.03), applied here to a narrower, capacity-free
 * concern. Not wired into CreateReservationHandler / AvailabilityOrchestrator
 * — see the implementation report's Known Limitations for why this is a
 * deliberate, bounded scope decision, not an oversight.
 */
import { CapacityPoolId } from "../../domain/availability/CapacityPool.js";
import { toLocalServiceDate, dayOfWeekFromLocalDate, toLocalMinuteOfDay } from "../../domain/availability/ServiceTime.js";
import {
  BookableStartTimesResult,
  DateOverride,
  isMinuteBookable,
  resolveDaySchedule,
  toBookableStartTimesResult,
} from "../../domain/availability/ServicePeriod.js";
import { ClosingDayStore } from "../ports/ClosingDayStore.js";
import { ServicePeriodOverrideStore } from "../ports/ServicePeriodOverrideStore.js";

// Local calendar dates (YYYY-MM-DD) carry no time-of-day/timezone meaning
// of their own — same convention ClosingDayStore/PrismaServicePeriodOverrideStore
// already use for their own date-only columns (see PrismaClosingDayStore.ts's
// startOfDay comment). This is NOT a local-time conversion (that already
// happened, correctly, via toLocalServiceDate/toLocalDayOfWeek before this
// is ever called) — it only reconstructs a UTC-midnight instant FROM an
// already-correct local calendar-date string, for ClosingDayStore's Date-typed interface.
function localDateToUtcMidnight(localDate: string): Date {
  return new Date(`${localDate}T00:00:00.000Z`);
}

export class ServicePeriodService {
  constructor(
    private readonly closingDayStore: ClosingDayStore,
    private readonly overrideStore: ServicePeriodOverrideStore
  ) {}

  private async resolveForLocalDate(area: CapacityPoolId, localDate: string) {
    const closingDayClosed = await this.closingDayStore.isClosed(localDateToUtcMidnight(localDate));
    const overrideRecord = await this.overrideStore.findForDate(area, localDate);
    const dayOfWeek = dayOfWeekFromLocalDate(localDate);
    const override: DateOverride | undefined = overrideRecord
      ? { status: overrideRecord.status, windows: overrideRecord.windows }
      : undefined;
    return resolveDaySchedule({ area, dayOfWeek, closingDayClosed, override });
  }

  /** Assignment §9 — GetBookableStartTimes(area, localDate). `localDate` is an already-local YYYY-MM-DD (e.g. toLocalServiceDate's own output). */
  async getBookableStartTimes(area: CapacityPoolId, localDate: string): Promise<BookableStartTimesResult> {
    const resolved = await this.resolveForLocalDate(area, localDate);
    return toBookableStartTimesResult(resolved);
  }

  /** Assignment §10 — IsStartTimeWithinServicePeriod(area, requestedStart). `requestedStart` is a real instant; converted to Europe/Amsterdam local terms internally (never UTC-sliced — ServiceTime.ts). */
  async isStartTimeWithinServicePeriod(area: CapacityPoolId, requestedStart: Date): Promise<boolean> {
    const localDate = toLocalServiceDate(requestedStart);
    const resolved = await this.resolveForLocalDate(area, localDate);
    return isMinuteBookable(toLocalMinuteOfDay(requestedStart), resolved);
  }
}
