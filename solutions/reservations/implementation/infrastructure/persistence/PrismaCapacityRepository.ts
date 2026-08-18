import { PrismaClient } from "@prisma/client";
import { CapacityRepository } from "../../domain/repositories/CapacityRepository.js";
import { CapacityCommitment, CapacityCommitmentStatus, CommitmentInterval } from "../../domain/availability/CapacityCommitment.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { deriveLockKey } from "../../domain/availability/LockKey.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

interface CapacityCommitmentRow {
  commitmentId: string;
  reservationId: string | null;
  capacityPoolId: string;
  startTime: Date;
  endTime: Date;
  partySize: number;
  status: string;
  commandId: string;
  createdAt: Date;
}

function toDomain(row: CapacityCommitmentRow): CapacityCommitment {
  return {
    commitmentId: row.commitmentId,
    reservationId: row.reservationId,
    capacityPoolId: row.capacityPoolId,
    startTime: row.startTime,
    endTime: row.endTime,
    partySize: row.partySize,
    status: row.status as CapacityCommitmentStatus,
    commandId: row.commandId,
    createdAt: row.createdAt,
  };
}

/**
 * Infrastructure adapter for the CapacityRepository port. Every write
 * method requires `tx` (see the port's doc comment for why) and every
 * write in this class runs against that `tx`, never against
 * `this.prisma` directly — there is deliberately no "open my own
 * transaction" fallback here the way PrismaReservationRepository.save()
 * has one, because a capacity write standing alone, outside the shared
 * transaction with its paired reservation write, is exactly the
 * two-step-sequence failure mode CAP-D02.03 exists to close.
 */
export class PrismaCapacityRepository implements CapacityRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findOverlappingCommitments(input: {
    readonly capacityPoolId: string;
    readonly rangeStart: Date;
    readonly rangeEnd: Date;
    readonly tx?: TransactionContext;
  }): Promise<readonly CommitmentInterval[]> {
    const client = input.tx ? asPrismaTx(input.tx) : this.prisma;
    const rows = await client.capacityCommitment.findMany({
      where: {
        capacityPoolId: input.capacityPoolId,
        status: "Committed",
        // Coarse pre-filter: any row whose interval could possibly overlap
        // [rangeStart, rangeEnd). AvailabilityEvaluator performs the exact
        // per-slice overlap test on the results — see that module's header.
        startTime: { lt: input.rangeEnd },
        endTime: { gt: input.rangeStart },
      },
    });
    return rows.map((row) => ({
      commitmentId: row.commitmentId,
      startTime: row.startTime,
      endTime: row.endTime,
      partySize: row.partySize,
    }));
  }

  async findById(commitmentId: string, tx?: TransactionContext): Promise<CapacityCommitment | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.capacityCommitment.findUnique({ where: { commitmentId } });
    return row ? toDomain(row) : null;
  }

  async findByCommandId(commandId: string, tx?: TransactionContext): Promise<CapacityCommitment | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.capacityCommitment.findFirst({ where: { commandId } });
    return row ? toDomain(row) : null;
  }

  async findActiveByReservationId(reservationId: string, tx?: TransactionContext): Promise<CapacityCommitment | null> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.capacityCommitment.findFirst({ where: { reservationId, status: "Committed" } });
    return row ? toDomain(row) : null;
  }

  /**
   * `pg_advisory_xact_lock` has no first-class Prisma API — issued as a
   * raw parameterized query. Prisma's tagged-template `$executeRaw` (not
   * `$executeRawUnsafe`, which does not parameterize) is used rather than
   * `$queryRaw` specifically because `pg_advisory_xact_lock` returns
   * `void`, which `$queryRaw` cannot deserialize into a result row — this
   * only executes the statement and returns an affected-row count Prisma
   * discards, which is fine since we only need the side effect (the lock).
   */
  async acquireCapacityLock(input: { readonly capacityPoolId: string; readonly localServiceDate: string; readonly tx: TransactionContext }): Promise<void> {
    const client = asPrismaTx(input.tx);
    const { namespace, key } = deriveLockKey(input.capacityPoolId, input.localServiceDate);
    // Explicit ::int4 casts: Prisma sends plain JS numbers in a way
    // Postgres resolves to bigint by default, and pg_advisory_xact_lock has
    // overloads for (bigint) and (int4, int4) but not (bigint, bigint) —
    // without the casts this fails with "function ... does not exist".
    await client.$executeRaw`SELECT pg_advisory_xact_lock(${namespace}::int4, ${key}::int4)`;
  }

  async create(input: {
    readonly commitment: {
      readonly commitmentId: string;
      readonly reservationId: string | null;
      readonly capacityPoolId: string;
      readonly startTime: Date;
      readonly endTime: Date;
      readonly partySize: number;
      readonly commandId: string;
      readonly status?: CapacityCommitmentStatus;
    };
    readonly tx: TransactionContext;
  }): Promise<CapacityCommitment> {
    const client = asPrismaTx(input.tx);
    const row = await client.capacityCommitment.create({
      data: {
        commitmentId: input.commitment.commitmentId,
        reservationId: input.commitment.reservationId,
        capacityPoolId: input.commitment.capacityPoolId,
        startTime: input.commitment.startTime,
        endTime: input.commitment.endTime,
        partySize: input.commitment.partySize,
        status: input.commitment.status ?? "Committed",
        commandId: input.commitment.commandId,
      },
    });
    return toDomain(row);
  }

  async updateStatus(input: { readonly commitmentId: string; readonly status: CapacityCommitmentStatus; readonly tx: TransactionContext }): Promise<void> {
    const client = asPrismaTx(input.tx);
    await client.capacityCommitment.update({
      where: { commitmentId: input.commitmentId },
      data: { status: input.status },
    });
  }
}
