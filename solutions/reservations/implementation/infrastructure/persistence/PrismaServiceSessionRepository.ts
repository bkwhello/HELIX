import { PrismaClient } from "@prisma/client";
import { ServiceSessionRepository } from "../../domain/repositories/ServiceSessionRepository.js";
import { ServiceSession, ServiceSessionStatus } from "../../domain/availability/ServiceSession.js";
import { ServiceCode, deriveServiceCode } from "../../domain/availability/Service.js";
import { toLocalServiceDate, localDateToPaddedUtcRange } from "../../domain/availability/ServiceTime.js";
import { deriveServiceSessionLockKey } from "../../domain/availability/LockKey.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

/**
 * A `@db.Date` column has no time-of-day/timezone component at all — the
 * value Prisma returns for it is not a real instant to be converted via
 * `toLocalServiceDate` (that function is for real `@db.Timestamptz`
 * instants like `Reservation.reservationDate`). Mirrors
 * `PrismaServicePeriodOverrideStore.ts`'s own `toDateOnly`/`fromDateOnly`
 * helpers exactly, for the identical reason.
 */
function toDateOnly(date: string): Date {
  return new Date(`${date}T00:00:00.000Z`);
}
function fromDateOnly(date: Date): string {
  return date.toISOString().slice(0, 10);
}

interface ServiceSessionRow {
  id: string;
  serviceCode: string;
  serviceDate: Date;
  status: string;
  openedAt: Date | null;
  closedAt: Date | null;
  cancelledAt: Date | null;
  createdBy: string;
  createdAt: Date;
  version: number;
}

function toDomain(row: ServiceSessionRow): ServiceSession {
  return {
    id: row.id,
    serviceCode: row.serviceCode as ServiceCode,
    serviceDate: fromDateOnly(row.serviceDate),
    status: row.status as ServiceSessionStatus,
    openedAt: row.openedAt,
    closedAt: row.closedAt,
    cancelledAt: row.cancelledAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    version: row.version,
  };
}

const TIMESTAMP_FIELD_BY_STATUS: Readonly<Partial<Record<ServiceSessionStatus, "openedAt" | "closedAt" | "cancelledAt">>> = {
  Opened: "openedAt",
  Closed: "closedAt",
  Cancelled: "cancelledAt",
};

export class PrismaServiceSessionRepository implements ServiceSessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findByKey(serviceCode: string, serviceDate: string, tx?: TransactionContext): Promise<ServiceSession | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.serviceSession.findUnique({
      where: { serviceCode_serviceDate: { serviceCode, serviceDate: toDateOnly(serviceDate) } },
    });
    return row ? toDomain(row) : null;
  }

  async findById(id: string, tx?: TransactionContext): Promise<ServiceSession | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.serviceSession.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async list(tx?: TransactionContext): Promise<readonly ServiceSession[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.serviceSession.findMany({ orderBy: [{ serviceDate: "desc" }, { serviceCode: "asc" }] });
    return rows.map(toDomain);
  }

  async create(input: {
    readonly id: string;
    readonly serviceCode: string;
    readonly serviceDate: string;
    readonly createdBy: string;
    readonly createdAt: Date;
    readonly tx: TransactionContext;
  }): Promise<ServiceSession> {
    const client = asPrismaTx(input.tx);
    const row = await client.serviceSession.create({
      data: {
        id: input.id,
        serviceCode: input.serviceCode,
        serviceDate: toDateOnly(input.serviceDate),
        status: "Created",
        createdBy: input.createdBy,
        createdAt: input.createdAt,
      },
    });
    return toDomain(row);
  }

  async updateStatus(input: {
    readonly id: string;
    readonly expectedVersion: number;
    readonly newStatus: ServiceSessionStatus;
    readonly timestamp: Date;
    readonly tx: TransactionContext;
  }): Promise<{ readonly type: "UPDATED"; readonly session: ServiceSession } | { readonly type: "VERSION_CONFLICT" }> {
    const client = asPrismaTx(input.tx);
    const timestampField = TIMESTAMP_FIELD_BY_STATUS[input.newStatus];
    const data: Record<string, unknown> = { status: input.newStatus, version: { increment: 1 } };
    if (timestampField) data[timestampField] = input.timestamp;

    const result = await client.serviceSession.updateMany({
      where: { id: input.id, version: input.expectedVersion },
      data,
    });
    if (result.count === 0) return { type: "VERSION_CONFLICT" };
    const row = await client.serviceSession.findUniqueOrThrow({ where: { id: input.id } });
    return { type: "UPDATED", session: toDomain(row) };
  }

  /** See CapacityRepository.acquireCapacityLock's own doc comment for the `$executeRaw`/int4-cast rationale — identical pattern, new lock family. */
  async acquireSessionLock(input: { readonly serviceCode: string; readonly serviceDate: string; readonly tx: TransactionContext }): Promise<void> {
    const client = asPrismaTx(input.tx);
    const { namespace, key } = deriveServiceSessionLockKey(input.serviceCode, input.serviceDate);
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int4, ${key}::int4)`;
  }

  async countActiveAssignmentsForServiceDate(input: { readonly serviceCode: string; readonly serviceDate: string; readonly tx: TransactionContext }): Promise<number> {
    const client = asPrismaTx(input.tx);
    const { rangeStart, rangeEnd } = localDateToPaddedUtcRange(input.serviceDate);
    // Coarse SQL pre-filter (padded UTC range + active status), exact
    // Amsterdam-local-date + canonical-Service-code match applied below —
    // see this port's own doc comment and ServiceTime.localDateToPaddedUtcRange.
    // NOTE: Reservation.reservationDate has no @map — the actual column
    // is literally camelCase ("reservationDate"), unlike most other
    // columns in this schema, which use snake_case @map names. Must be
    // double-quoted in raw SQL or Postgres folds it to lowercase and
    // the column is not found.
    const rows = await client.$queryRaw<{ reservationDate: Date }[]>`
      SELECT r."reservationDate" AS "reservationDate"
      FROM seating_assignments sa
      JOIN reservations r ON r.id = sa.reservation_id
      WHERE sa.status IN ('Assigned', 'Seated')
        AND r."reservationDate" >= ${rangeStart}
        AND r."reservationDate" < ${rangeEnd}
    `;
    return rows.filter(
      (row) => toLocalServiceDate(row.reservationDate) === input.serviceDate && deriveServiceCode(row.reservationDate) === input.serviceCode
    ).length;
  }
}
