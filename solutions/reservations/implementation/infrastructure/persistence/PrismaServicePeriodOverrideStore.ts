import { PrismaClient, ServicePeriodOverride, ServicePeriodOverrideWindow } from "@prisma/client";
import { ServicePeriodOverrideRecord, ServicePeriodOverrideStore } from "../../application/ports/ServicePeriodOverrideStore.js";
import { CapacityPoolId, isCapacityPoolId } from "../../domain/availability/CapacityPool.js";
import { BookingWindow } from "../../domain/availability/ServicePeriod.js";

// Same convention as PrismaClosingDayStore.ts's startOfDay: a bare
// "YYYY-MM-DD" local calendar date has no time-of-day/timezone component
// to convert — it is stored and read back as a plain UTC-midnight-anchored
// @db.Date value, never touched by Intl/local-time conversion.
function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
function fromDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

type OverrideWithWindows = ServicePeriodOverride & { windows: ServicePeriodOverrideWindow[] };

function toRecord(row: OverrideWithWindows): ServicePeriodOverrideRecord {
  if (!isCapacityPoolId(row.areaId)) {
    throw new Error(`PrismaServicePeriodOverrideStore: stored areaId "${row.areaId}" is not a valid CapacityPoolId.`);
  }
  const status = row.status as "Open" | "Closed";
  return {
    id: row.id,
    areaId: row.areaId,
    date: fromDateOnly(row.date),
    status,
    windows: row.windows
      .map((w): BookingWindow => ({ firstStartMinute: w.firstStartMinute, lastStartMinute: w.lastStartMinute }))
      .sort((a, b) => a.firstStartMinute - b.firstStartMinute),
    reason: row.reason ?? undefined,
  };
}

export class PrismaServicePeriodOverrideStore implements ServicePeriodOverrideStore {
  constructor(private readonly prisma: PrismaClient) {}

  async findForDate(area: CapacityPoolId, date: string): Promise<ServicePeriodOverrideRecord | null> {
    const row = await this.prisma.servicePeriodOverride.findUnique({
      where: { areaId_date: { areaId: area, date: toDateOnly(date) } },
      include: { windows: true },
    });
    return row ? toRecord(row) : null;
  }

  async upsert(input: {
    readonly area: CapacityPoolId;
    readonly date: string;
    readonly status: "Open" | "Closed";
    readonly windows: readonly BookingWindow[];
    readonly reason?: string;
    readonly createdBy: string;
  }): Promise<ServicePeriodOverrideRecord> {
    const dateValue = toDateOnly(input.date);
    // A Closed override carries no windows, regardless of what the caller passed — status is the single source of truth for openness (assignment §5/§6).
    const windows = input.status === "Closed" ? [] : input.windows;

    const row = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.servicePeriodOverride.findUnique({
        where: { areaId_date: { areaId: input.area, date: dateValue } },
      });
      const windowsCreate = windows.map((w) => ({ firstStartMinute: w.firstStartMinute, lastStartMinute: w.lastStartMinute }));

      if (existing) {
        // Replace the window set atomically (same transaction) rather than diffing — a Service Period override is a small, infrequently-edited row; a full replace is the simplest correct representation (assignment §20).
        await tx.servicePeriodOverrideWindow.deleteMany({ where: { overrideId: existing.id } });
        return tx.servicePeriodOverride.update({
          where: { id: existing.id },
          data: {
            status: input.status,
            reason: input.reason,
            createdBy: input.createdBy,
            windows: { create: windowsCreate },
          },
          include: { windows: true },
        });
      }
      return tx.servicePeriodOverride.create({
        data: {
          areaId: input.area,
          date: dateValue,
          status: input.status,
          reason: input.reason,
          createdBy: input.createdBy,
          windows: { create: windowsCreate },
        },
        include: { windows: true },
      });
    });

    return toRecord(row);
  }

  async remove(id: string): Promise<void> {
    // ServicePeriodOverrideWindow rows cascade-delete via the schema's onDelete: Cascade — no manual child cleanup needed.
    await this.prisma.servicePeriodOverride.deleteMany({ where: { id } });
  }

  async list(area?: CapacityPoolId): Promise<readonly ServicePeriodOverrideRecord[]> {
    const rows = await this.prisma.servicePeriodOverride.findMany({
      where: area ? { areaId: area } : undefined,
      include: { windows: true },
      orderBy: { date: "asc" },
    });
    return rows.map(toRecord);
  }
}
