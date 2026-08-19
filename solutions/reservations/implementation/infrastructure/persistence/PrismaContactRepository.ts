import { Prisma, PrismaClient } from "@prisma/client";
import { ContactRepository, ContactRecord, CreateContactRecordInput, PossibleMatchCriteria } from "../../application/ports/ContactRepository.js";
import { ContactStatus } from "../../domain/value-objects/ContactStatus.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

/** Either a top-level PrismaClient or an interactive-transaction client — see PrismaReservationRepository's identical PrismaWriteClient pattern. */
type PrismaContactClient = Pick<Prisma.TransactionClient, "contact">;

interface ContactRow {
  id: string;
  displayName: string;
  phoneRaw: string | null;
  phoneNormalized: string | null;
  emailRaw: string | null;
  emailNormalized: string | null;
  status: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  lastRelevantActivityAt: Date;
}

function toDomain(row: ContactRow): ContactRecord {
  return {
    id: row.id,
    displayName: row.displayName,
    phoneRaw: row.phoneRaw ?? undefined,
    phoneNormalized: row.phoneNormalized ?? undefined,
    emailRaw: row.emailRaw ?? undefined,
    emailNormalized: row.emailNormalized ?? undefined,
    status: row.status as ContactStatus,
    createdBy: row.createdBy,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    lastRelevantActivityAt: row.lastRelevantActivityAt,
  };
}

/**
 * CAP-D05.01 — Prisma-backed Contact repository. Replaces
 * UnvalidatedContactReader as the production adapter behind the
 * cross-capability contact boundary CAP-D01.01 depends on (see the R1.3
 * architecture investigation §6/§9 and rule-model.md CAP-D05.01-R01).
 */
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string, tx?: TransactionContext): Promise<ContactRecord | null> {
    const client: PrismaContactClient = tx ? asPrismaTx(tx) : this.prisma;
    const row = await client.contact.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async create(input: CreateContactRecordInput): Promise<ContactRecord> {
    const client: PrismaContactClient = input.tx ? asPrismaTx(input.tx) : this.prisma;
    const row = await client.contact.create({
      data: {
        id: input.id,
        displayName: input.displayName,
        phoneRaw: input.phoneRaw,
        phoneNormalized: input.phoneNormalized,
        emailRaw: input.emailRaw,
        emailNormalized: input.emailNormalized,
        status: ContactStatus.Active,
        createdBy: input.createdBy,
        createdAt: input.now,
        // CAP-D05.01 retention anchor — a freshly created Contact's most
        // recent relevant activity IS its creation.
        lastRelevantActivityAt: input.now,
      },
    });
    return toDomain(row);
  }

  async findPossibleMatches(criteria: PossibleMatchCriteria): Promise<readonly ContactRecord[]> {
    if (!criteria.phoneNormalized && !criteria.emailNormalized) {
      return [];
    }
    const rows = await this.prisma.contact.findMany({
      where: {
        status: ContactStatus.Active,
        OR: [
          ...(criteria.phoneNormalized ? [{ phoneNormalized: criteria.phoneNormalized }] : []),
          ...(criteria.emailNormalized ? [{ emailNormalized: criteria.emailNormalized }] : []),
        ],
      },
    });
    return rows.map(toDomain);
  }

  async touchActivity(id: string, now: Date): Promise<void> {
    await this.prisma.contact.update({ where: { id }, data: { lastRelevantActivityAt: now } });
  }
}
