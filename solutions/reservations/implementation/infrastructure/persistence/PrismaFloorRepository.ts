import { PrismaClient } from "@prisma/client";
import { FloorRepository } from "../../domain/repositories/FloorRepository.js";
import { Table, TableStatus } from "../../domain/floor/Table.js";
import { Seat, SeatStatus } from "../../domain/floor/Seat.js";
import { ResourceBlock } from "../../domain/floor/ResourceBlock.js";
import { SeatingAssignment, SeatingAssignmentResource, SeatingAssignmentStatus, ReleaseReason } from "../../domain/floor/SeatingAssignment.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { deriveSeatingResourceLockKey } from "../../domain/availability/LockKey.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

interface TableRow {
  id: string;
  areaId: string;
  operationalLabel: string;
  nominalCapacity: number;
  supportsSharedSeating: boolean;
  status: string;
  createdAt: Date;
}
function toTable(row: TableRow): Table {
  return {
    id: row.id,
    areaId: row.areaId,
    operationalLabel: row.operationalLabel,
    nominalCapacity: row.nominalCapacity,
    supportsSharedSeating: row.supportsSharedSeating,
    status: row.status as TableStatus,
    createdAt: row.createdAt,
  };
}

interface SeatRow {
  id: string;
  tableId: string;
  operationalLabel: string;
  status: string;
  createdAt: Date;
}
function toSeat(row: SeatRow): Seat {
  return { id: row.id, tableId: row.tableId, operationalLabel: row.operationalLabel, status: row.status as SeatStatus, createdAt: row.createdAt };
}

interface ResourceBlockRow {
  id: string;
  tableId: string;
  startTime: Date;
  endTime: Date;
  reason: string | null;
  createdBy: string;
  createdAt: Date;
}
function toResourceBlock(row: ResourceBlockRow): ResourceBlock {
  return { id: row.id, tableId: row.tableId, startTime: row.startTime, endTime: row.endTime, reason: row.reason, createdBy: row.createdBy, createdAt: row.createdAt };
}

interface AssignmentRow {
  id: string;
  reservationId: string;
  status: string;
  releaseReason: string | null;
  startTime: Date;
  endTime: Date;
  assignedBy: string;
  assignedAt: Date;
  seatedAt: Date | null;
  releasedBy: string | null;
  releasedAt: Date | null;
  commandId: string;
}
function toAssignment(row: AssignmentRow): SeatingAssignment {
  return {
    id: row.id,
    reservationId: row.reservationId,
    status: row.status as SeatingAssignmentStatus,
    releaseReason: row.releaseReason as ReleaseReason | null,
    startTime: row.startTime,
    endTime: row.endTime,
    assignedBy: row.assignedBy,
    assignedAt: row.assignedAt,
    seatedAt: row.seatedAt,
    releasedBy: row.releasedBy,
    releasedAt: row.releasedAt,
    commandId: row.commandId,
  };
}

interface AssignmentResourceRow {
  id: string;
  assignmentId: string;
  tableId: string | null;
  seatId: string | null;
  status: string;
  startTime: Date;
  endTime: Date;
}
function toAssignmentResource(row: AssignmentResourceRow): SeatingAssignmentResource {
  return { id: row.id, assignmentId: row.assignmentId, tableId: row.tableId, seatId: row.seatId, status: row.status as SeatingAssignmentStatus, startTime: row.startTime, endTime: row.endTime };
}

/**
 * Infrastructure adapter for FloorRepository. Every write method requires
 * `tx` and runs against it, never against `this.prisma` directly — same
 * discipline as PrismaCapacityRepository, same reasoning (final
 * architecture §20 transaction model).
 */
export class PrismaFloorRepository implements FloorRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findTableById(tableId: string, tx?: TransactionContext): Promise<Table | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.table.findUnique({ where: { id: tableId } });
    return row ? toTable(row) : null;
  }

  async findTableByLabel(operationalLabel: string, tx?: TransactionContext): Promise<Table | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.table.findFirst({ where: { operationalLabel } });
    return row ? toTable(row) : null;
  }

  async findTablesByArea(areaId: string, tx?: TransactionContext): Promise<readonly Table[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.table.findMany({ where: { areaId }, orderBy: { operationalLabel: "asc" } });
    return rows.map(toTable);
  }

  async findSeatById(seatId: string, tx?: TransactionContext): Promise<Seat | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.seat.findUnique({ where: { id: seatId } });
    return row ? toSeat(row) : null;
  }

  async findSeatsByTableId(tableId: string, tx?: TransactionContext): Promise<readonly Seat[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.seat.findMany({ where: { tableId }, orderBy: { operationalLabel: "asc" } });
    return rows.map(toSeat);
  }

  async findOverlappingResourceBlocks(input: {
    readonly tableId: string;
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<readonly ResourceBlock[]> {
    const client = input.tx ? asPrismaTx(input.tx) : this.prisma;
    const rows = await client.resourceBlock.findMany({
      where: { tableId: input.tableId, startTime: { lt: input.rangeEnd }, endTime: { gt: input.rangeStart } },
    });
    return rows.map(toResourceBlock);
  }

  async createResourceBlock(input: {
    readonly tableId: string;
    readonly startTime: Date;
    readonly endTime: Date;
    readonly reason: string | null;
    readonly createdBy: string;
    readonly tx: TransactionContext;
  }): Promise<ResourceBlock> {
    const client = asPrismaTx(input.tx);
    const row = await client.resourceBlock.create({
      data: { tableId: input.tableId, startTime: input.startTime, endTime: input.endTime, reason: input.reason, createdBy: input.createdBy },
    });
    return toResourceBlock(row);
  }

  async listResourceBlocks(input?: { readonly areaId?: string; readonly tx?: TransactionContext }): Promise<readonly ResourceBlock[]> {
    const client = input?.tx ? asPrismaTx(input.tx) : this.prisma;
    const rows = await client.resourceBlock.findMany({
      where: input?.areaId ? { table: { areaId: input.areaId } } : {},
      orderBy: { startTime: "asc" },
    });
    return rows.map(toResourceBlock);
  }

  async findResourceBlockById(id: string, tx?: TransactionContext): Promise<ResourceBlock | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.resourceBlock.findUnique({ where: { id } });
    return row ? toResourceBlock(row) : null;
  }

  async deleteResourceBlock(id: string, tx: TransactionContext): Promise<void> {
    const client = asPrismaTx(tx);
    await client.resourceBlock.deleteMany({ where: { id } });
  }

  async findOverlappingResourceClaims(input: {
    readonly tableIds: readonly string[];
    readonly seatIds: readonly string[];
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<{ readonly tableIds: ReadonlySet<string>; readonly seatIds: ReadonlySet<string> }> {
    const client = input.tx ? asPrismaTx(input.tx) : this.prisma;
    const rows = await client.seatingAssignmentResource.findMany({
      where: {
        status: { in: ["Assigned", "Seated"] },
        startTime: { lt: input.rangeEnd },
        endTime: { gt: input.rangeStart },
        OR: [
          ...(input.tableIds.length > 0 ? [{ tableId: { in: [...input.tableIds] } }] : []),
          ...(input.seatIds.length > 0 ? [{ seatId: { in: [...input.seatIds] } }] : []),
        ],
      },
      select: { tableId: true, seatId: true },
    });
    const tableIds = new Set<string>();
    const seatIds = new Set<string>();
    for (const row of rows) {
      if (row.tableId) tableIds.add(row.tableId);
      if (row.seatId) seatIds.add(row.seatId);
    }
    return { tableIds, seatIds };
  }

  async findAssignmentByCommandId(commandId: string, tx?: TransactionContext): Promise<SeatingAssignment | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.seatingAssignment.findFirst({ where: { commandId } });
    return row ? toAssignment(row) : null;
  }

  async findActiveAssignmentByReservationId(reservationId: string, tx?: TransactionContext): Promise<SeatingAssignment | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.seatingAssignment.findFirst({ where: { reservationId, status: { in: ["Assigned", "Seated"] } } });
    return row ? toAssignment(row) : null;
  }

  async findAssignmentResources(assignmentId: string, tx?: TransactionContext): Promise<readonly SeatingAssignmentResource[]> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const rows = await client.seatingAssignmentResource.findMany({ where: { assignmentId } });
    return rows.map(toAssignmentResource);
  }

  async createAssignment(input: {
    readonly assignment: {
      readonly id: string;
      readonly reservationId: string;
      readonly status: SeatingAssignmentStatus;
      readonly startTime: Date;
      readonly endTime: Date;
      readonly assignedBy: string;
      readonly commandId: string;
    };
    readonly resources: readonly { readonly tableId: string | null; readonly seatId: string | null }[];
    readonly tx: TransactionContext;
  }): Promise<SeatingAssignment> {
    const client = asPrismaTx(input.tx);
    const row = await client.seatingAssignment.create({
      data: {
        id: input.assignment.id,
        reservationId: input.assignment.reservationId,
        status: input.assignment.status,
        startTime: input.assignment.startTime,
        endTime: input.assignment.endTime,
        assignedBy: input.assignment.assignedBy,
        commandId: input.assignment.commandId,
        seatedAt: input.assignment.status === "Seated" ? new Date() : null,
        resources: {
          create: input.resources.map((r) => ({
            tableId: r.tableId,
            seatId: r.seatId,
            status: input.assignment.status,
            startTime: input.assignment.startTime,
            endTime: input.assignment.endTime,
          })),
        },
      },
    });
    return toAssignment(row);
  }

  async updateAssignmentStatus(input: {
    readonly assignmentId: string;
    readonly status: SeatingAssignmentStatus;
    readonly releaseReason?: ReleaseReason;
    readonly actorId?: string;
    readonly tx: TransactionContext;
  }): Promise<void> {
    const client = asPrismaTx(input.tx);
    const now = new Date();
    await client.seatingAssignment.update({
      where: { id: input.assignmentId },
      data: {
        status: input.status,
        releaseReason: input.status === "Released" ? (input.releaseReason ?? null) : undefined,
        releasedAt: input.status === "Released" ? now : undefined,
        releasedBy: input.status === "Released" ? input.actorId : undefined,
        seatedAt: input.status === "Seated" ? now : undefined,
      },
    });
    // Resource rows' own status must move in lockstep with the parent —
    // required for the EXCLUDE constraints' WHERE clause (only
    // Assigned/Seated rows are considered "active") to correctly release
    // this assignment's claim on its resources.
    await client.seatingAssignmentResource.updateMany({
      where: { assignmentId: input.assignmentId },
      data: { status: input.status },
    });
  }

  async acquireSeatingResourceLock(input: { readonly resourceId: string; readonly tx: TransactionContext }): Promise<void> {
    const client = asPrismaTx(input.tx);
    const { namespace, key } = deriveSeatingResourceLockKey(input.resourceId);
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int4, ${key}::int4)`;
  }
}
