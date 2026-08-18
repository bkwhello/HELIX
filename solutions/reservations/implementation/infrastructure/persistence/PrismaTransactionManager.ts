import { PrismaClient, Prisma } from "@prisma/client";
import { TransactionManager } from "../../application/ports/TransactionManager.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

/**
 * The only place in this codebase that casts TransactionContext back to a
 * concrete Prisma type — see domain/shared/TransactionContext.ts for why
 * that type is opaque everywhere else.
 *
 * `timeout` is raised above Prisma's 5s default: a capacity-checking
 * transaction holds a `pg_advisory_xact_lock` for its full duration
 * (acquire lock -> read commitments -> evaluate -> write), and the
 * concurrency test matrix deliberately serializes concurrent transactions
 * against that lock, so one transaction's total hold time is the sum of
 * however many are queued ahead of it in a test. 10s is generous headroom
 * for local test runs, not a production tuning decision.
 */
const TRANSACTION_OPTIONS = { timeout: 10_000, maxWait: 10_000 };

export class PrismaTransactionManager implements TransactionManager {
  constructor(private readonly prisma: PrismaClient) {}

  async runInTransaction<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> {
    return this.prisma.$transaction((tx) => work(tx as TransactionContext), TRANSACTION_OPTIONS);
  }
}

/** Casts an opaque TransactionContext back to Prisma's transaction client. Used only by the other Prisma-backed adapters in this directory. */
export function asPrismaTx(tx: TransactionContext): Prisma.TransactionClient {
  return tx as Prisma.TransactionClient;
}
