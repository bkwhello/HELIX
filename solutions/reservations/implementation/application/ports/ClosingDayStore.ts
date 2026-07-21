/**
 * CAP-D01.01-R51 — a stopgap operational calendar (see rule-model.md §16b
 * for why this lives here rather than in Availability Management, which
 * doesn't exist yet). Unlike ContactReader/ServicePeriodReader, this one
 * is fully real, not a placeholder — "is this date marked closed" needs
 * no external capability to answer correctly.
 *
 * A closure is a date range (fromDate..toDate, inclusive). A single closed
 * day is just a range where fromDate equals toDate.
 */
export interface ClosingDayRange {
  readonly id: string;
  readonly fromDate: string; // YYYY-MM-DD
  readonly toDate: string; // YYYY-MM-DD
  readonly reason?: string;
}

export interface ClosingDayStore {
  isClosed(date: Date): Promise<boolean>;
  add(input: { readonly fromDate: Date; readonly toDate: Date; readonly reason?: string; readonly createdBy: string }): Promise<ClosingDayRange>;
  remove(id: string): Promise<void>;
  list(): Promise<readonly ClosingDayRange[]>;
}
