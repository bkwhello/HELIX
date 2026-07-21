import { PrismaClient } from "@prisma/client";
import { ClosingDay, ClosingDayStore } from "../../application/ports/ClosingDayStore.js";

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
    const row = await this.prisma.closingDay.findUnique({ where: { date: startOfDay(date) } });
    return row !== null;
  }

  async add(input: { readonly date: Date; readonly reason?: string; readonly createdBy: string }): Promise<void> {
    const date = startOfDay(input.date);
    await this.prisma.closingDay.upsert({
      where: { date },
      create: { date, reason: input.reason, createdBy: input.createdBy },
      update: { reason: input.reason, createdBy: input.createdBy },
    });
  }

  async remove(date: Date): Promise<void> {
    await this.prisma.closingDay.deleteMany({ where: { date: startOfDay(date) } });
  }

  async list(): Promise<readonly ClosingDay[]> {
    const rows = await this.prisma.closingDay.findMany({ orderBy: { date: "asc" } });
    return rows.map((row) => ({
      date: row.date.toISOString().slice(0, 10),
      reason: row.reason ?? undefined,
    }));
  }
}
