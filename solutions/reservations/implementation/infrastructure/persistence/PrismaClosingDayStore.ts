import { PrismaClient } from "@prisma/client";
import { ClosingDayRange, ClosingDayStore } from "../../application/ports/ClosingDayStore.js";

// UTC, not local time: a bare "YYYY-MM-DD" (e.g. from a date picker) is
// parsed by JS as UTC midnight per spec. Normalizing with local setHours()
// instead double-converts through the server's timezone offset and can
// shift the stored date to the previous day — e.g. "2026-08-10" round-
// tripping to "2026-08-09" in any timezone ahead of UTC. Closing days
// have no time-of-day component, so there is no reason to ever touch
// local time here.
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

export class PrismaClosingDayStore implements ClosingDayStore {
  constructor(private readonly prisma: PrismaClient) {}

  async isClosed(date: Date): Promise<boolean> {
    const day = startOfDay(date);
    const row = await this.prisma.closingDay.findFirst({ where: { fromDate: { lte: day }, toDate: { gte: day } } });
    return row !== null;
  }

  async add(input: {
    readonly fromDate: Date;
    readonly toDate: Date;
    readonly reason?: string;
    readonly createdBy: string;
  }): Promise<ClosingDayRange> {
    let fromDate = startOfDay(input.fromDate);
    let toDate = startOfDay(input.toDate);
    // Forgiving on an accidentally reversed range rather than rejecting it —
    // "van 12 augustus tot 10 augustus" almost certainly meant the other
    // way around, not an error worth blocking staff over.
    if (toDate < fromDate) {
      [fromDate, toDate] = [toDate, fromDate];
    }
    const row = await this.prisma.closingDay.create({
      data: { fromDate, toDate, reason: input.reason, createdBy: input.createdBy },
    });
    return {
      id: row.id,
      fromDate: row.fromDate.toISOString().slice(0, 10),
      toDate: row.toDate.toISOString().slice(0, 10),
      reason: row.reason ?? undefined,
    };
  }

  async remove(id: string): Promise<void> {
    await this.prisma.closingDay.deleteMany({ where: { id } });
  }

  async list(): Promise<readonly ClosingDayRange[]> {
    const rows = await this.prisma.closingDay.findMany({ orderBy: { fromDate: "asc" } });
    return rows.map((row) => ({
      id: row.id,
      fromDate: row.fromDate.toISOString().slice(0, 10),
      toDate: row.toDate.toISOString().slice(0, 10),
      reason: row.reason ?? undefined,
    }));
  }
}
