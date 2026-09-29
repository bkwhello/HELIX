import { Prisma, PrismaClient } from "@prisma/client";
import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode, isServiceCode } from "../../domain/availability/Service.js";
import { ServiceOperatingInterval, parsePersistedServiceOperatingInterval } from "../../domain/availability/ServiceOperatingInterval.js";
import { createServiceDefaultDuration } from "../../domain/availability/ServiceDefaultDuration.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

interface ServiceRow {
  code: string;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  defaultStartMinute: number | null;
  defaultEndMinute: number | null;
  defaultDurationMinutes: number | null;
}

/**
 * `code` is validated against the closed `ServiceCode` union at the read
 * boundary — this repository never returns a row whose stored code has
 * drifted outside {"lunch","dinner"}; such a row (which nothing in this
 * increment can create) is treated as absent rather than surfaced as a
 * malformed ServiceDefinition.
 *
 * R1.6-P3C-1 — `parsePersistedServiceOperatingInterval` THROWS on a
 * partially-populated pair rather than silently coercing it to `null` —
 * this repository never catches that error, so a malformed persisted
 * state (which the database's own CHECK constraint should make
 * unreachable in practice) fails loudly here too, never silently.
 */
function toDomainServiceDefinition(row: ServiceRow): ServiceDefinition | null {
  if (!isServiceCode(row.code)) return null;
  return {
    code: row.code,
    displayName: row.displayName,
    enabled: row.enabled,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    defaultOperatingInterval: parsePersistedServiceOperatingInterval(row.defaultStartMinute, row.defaultEndMinute),
    // R1.6-P3D-1 — re-validated on read, same defense-in-depth posture as
    // defaultOperatingInterval above: the database's own CHECK constraint
    // is the primary guard, this is the secondary, application-layer one.
    // A single nullable scalar has no "partially populated" failure mode
    // (unlike the paired interval), so only an out-of-range/non-multiple
    // value that somehow bypassed the CHECK constraint could ever reach
    // this line — and if it did, this throws rather than silently
    // accepting it.
    defaultDurationMinutes: row.defaultDurationMinutes === null ? null : createServiceDefaultDuration(row.defaultDurationMinutes),
  };
}

export class PrismaServiceDefinitionRepository implements ServiceDefinitionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByCode(code: ServiceCode, tx?: TransactionContext): Promise<ServiceDefinition | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.service.findUnique({ where: { code } });
    return row ? toDomainServiceDefinition(row) : null;
  }

  async list(tx?: TransactionContext): Promise<readonly ServiceDefinition[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.service.findMany({ orderBy: { code: "asc" } });
    return rows.map(toDomainServiceDefinition).filter((s): s is ServiceDefinition => s !== null);
  }

  async update(
    code: ServiceCode,
    patch: { readonly displayName?: string; readonly enabled?: boolean; readonly defaultOperatingInterval?: ServiceOperatingInterval | null },
    tx?: TransactionContext
  ): Promise<ServiceDefinition | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const data: Prisma.ServiceUpdateInput = {};
    if (patch.displayName !== undefined) data.displayName = patch.displayName;
    if (patch.enabled !== undefined) data.enabled = patch.enabled;
    // R1.6-P3C-2 — both columns are always assigned together, in this same
    // single `data` object, so Prisma emits exactly one UPDATE statement
    // touching both `default_start_minute` and `default_end_minute` (or
    // neither) — a partial-pair write is not something this branch can
    // express, matching the port's own "no partial-pair write is ever
    // possible" contract.
    if (patch.defaultOperatingInterval !== undefined) {
      const interval = patch.defaultOperatingInterval;
      data.defaultStartMinute = interval === null ? null : interval.startMinute;
      data.defaultEndMinute = interval === null ? null : interval.endMinute;
    }
    try {
      const row = await client.service.update({ where: { code }, data });
      return toDomainServiceDefinition(row);
    } catch (err) {
      // P2025 — no row for this code. Never thrown as a not-found error;
      // every real caller already validated `code` is canonical and
      // looked the row up first, so this is a defensive case only.
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2025") return null;
      throw err;
    }
  }
}
