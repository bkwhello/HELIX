import { PrismaClient } from "@prisma/client";
import { FloorplanRepository } from "../../domain/repositories/FloorplanRepository.js";
import { Floorplan, FloorplanVersion, FloorplanVersionStatus, FloorplanVersionResource } from "../../domain/floor/Floorplan.js";
import { deriveFloorplanLockKey } from "../../domain/availability/LockKey.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

interface FloorplanRow {
  id: string;
  name: string;
  defaultVersionId: string | null;
  createdAt: Date;
}
function toDomainFloorplan(row: FloorplanRow): Floorplan {
  return { id: row.id, name: row.name, defaultVersionId: row.defaultVersionId, createdAt: row.createdAt };
}

interface FloorplanVersionRow {
  id: string;
  floorplanId: string;
  revision: number;
  status: string;
  publishedAt: Date | null;
  createdBy: string;
  createdAt: Date;
}
function toDomainVersion(row: FloorplanVersionRow): FloorplanVersion {
  return {
    id: row.id,
    floorplanId: row.floorplanId,
    revision: row.revision,
    status: row.status as FloorplanVersionStatus,
    publishedAt: row.publishedAt,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
  };
}

interface FloorplanVersionResourceRow {
  id: string;
  floorplanVersionId: string;
  tableId: string;
}
function toDomainMember(row: FloorplanVersionResourceRow): FloorplanVersionResource {
  return { id: row.id, floorplanVersionId: row.floorplanVersionId, tableId: row.tableId };
}

export class PrismaFloorplanRepository implements FloorplanRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findFloorplanById(id: string, tx?: TransactionContext): Promise<Floorplan | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.floorplan.findUnique({ where: { id } });
    return row ? toDomainFloorplan(row) : null;
  }

  async listFloorplans(tx?: TransactionContext): Promise<readonly Floorplan[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.floorplan.findMany({ orderBy: { createdAt: "asc" } });
    return rows.map(toDomainFloorplan);
  }

  async createFloorplan(input: { readonly id: string; readonly name: string; readonly createdAt: Date; readonly tx: TransactionContext }): Promise<Floorplan> {
    const client = asPrismaTx(input.tx);
    const row = await client.floorplan.create({ data: { id: input.id, name: input.name, createdAt: input.createdAt } });
    return toDomainFloorplan(row);
  }

  async setDefaultVersion(input: { readonly floorplanId: string; readonly versionId: string | null; readonly tx: TransactionContext }): Promise<Floorplan> {
    const client = asPrismaTx(input.tx);
    const row = await client.floorplan.update({ where: { id: input.floorplanId }, data: { defaultVersionId: input.versionId } });
    return toDomainFloorplan(row);
  }

  async findVersionById(id: string, tx?: TransactionContext): Promise<FloorplanVersion | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.floorplanVersion.findUnique({ where: { id } });
    return row ? toDomainVersion(row) : null;
  }

  async listVersionsByFloorplanId(floorplanId: string, tx?: TransactionContext): Promise<readonly FloorplanVersion[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.floorplanVersion.findMany({ where: { floorplanId }, orderBy: { revision: "asc" } });
    return rows.map(toDomainVersion);
  }

  async createVersion(input: {
    readonly id: string;
    readonly floorplanId: string;
    readonly revision: number;
    readonly createdBy: string;
    readonly createdAt: Date;
    readonly tx: TransactionContext;
  }): Promise<FloorplanVersion> {
    const client = asPrismaTx(input.tx);
    const row = await client.floorplanVersion.create({
      data: {
        id: input.id,
        floorplanId: input.floorplanId,
        revision: input.revision,
        status: "Draft",
        createdBy: input.createdBy,
        createdAt: input.createdAt,
      },
    });
    return toDomainVersion(row);
  }

  async updateVersionStatus(input: {
    readonly id: string;
    readonly newStatus: FloorplanVersionStatus;
    readonly publishedAt?: Date | null;
    readonly tx: TransactionContext;
  }): Promise<FloorplanVersion> {
    const client = asPrismaTx(input.tx);
    const data: Record<string, unknown> = { status: input.newStatus };
    if (input.publishedAt !== undefined) data.publishedAt = input.publishedAt;
    const row = await client.floorplanVersion.update({ where: { id: input.id }, data });
    return toDomainVersion(row);
  }

  async listMembers(floorplanVersionId: string, tx?: TransactionContext): Promise<readonly FloorplanVersionResource[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.floorplanVersionResource.findMany({ where: { floorplanVersionId } });
    return rows.map(toDomainMember);
  }

  /** Delete-then-insert, in the SAME transaction — a real atomic replace (never a diff/upsert), matching this port's own doc comment. `tableIds[i]` gets the new row id `newRowIds[i]` — the caller supplies ids (RandomIdGenerator) rather than relying on Prisma's `createMany` returning generated rows (createMany does not return rows in this Prisma version). */
  async replaceMembers(input: { readonly floorplanVersionId: string; readonly tableIds: readonly string[]; readonly newRowIds: readonly string[]; readonly tx: TransactionContext }): Promise<readonly FloorplanVersionResource[]> {
    const client = asPrismaTx(input.tx);
    await client.floorplanVersionResource.deleteMany({ where: { floorplanVersionId: input.floorplanVersionId } });
    if (input.tableIds.length === 0) return [];
    await client.floorplanVersionResource.createMany({
      data: input.tableIds.map((tableId, i) => ({ id: input.newRowIds[i]!, floorplanVersionId: input.floorplanVersionId, tableId })),
    });
    const rows = await client.floorplanVersionResource.findMany({ where: { floorplanVersionId: input.floorplanVersionId } });
    return rows.map(toDomainMember);
  }

  /** Mirrors CapacityRepository.acquireCapacityLock / ServiceSessionRepository.acquireSessionLock's own `$executeRaw`/int4-cast pattern exactly — identical technique, new lock family (Tier 1.4). */
  async acquireFloorplanLock(input: { readonly floorplanId: string; readonly tx: TransactionContext }): Promise<void> {
    const client = asPrismaTx(input.tx);
    const { namespace, key } = deriveFloorplanLockKey(input.floorplanId);
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int4, ${key}::int4)`;
  }
}
