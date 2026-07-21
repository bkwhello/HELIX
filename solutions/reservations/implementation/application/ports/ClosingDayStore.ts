/**
 * CAP-D01.01-R51 — a stopgap operational calendar (see rule-model.md §16b
 * for why this lives here rather than in Availability Management, which
 * doesn't exist yet). Unlike ContactReader/ServicePeriodReader, this one
 * is fully real, not a placeholder — "is this date marked closed" needs
 * no external capability to answer correctly.
 */
export interface ClosingDay {
  readonly date: string; // YYYY-MM-DD
  readonly reason?: string;
}

export interface ClosingDayStore {
  isClosed(date: Date): Promise<boolean>;
  add(input: { readonly date: Date; readonly reason?: string; readonly createdBy: string }): Promise<void>;
  remove(date: Date): Promise<void>;
  list(): Promise<readonly ClosingDay[]>;
}
