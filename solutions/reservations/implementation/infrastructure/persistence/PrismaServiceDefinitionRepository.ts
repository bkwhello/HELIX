import { PrismaClient } from "@prisma/client";
import { ServiceDefinitionRepository } from "../../domain/repositories/ServiceDefinitionRepository.js";
import { ServiceDefinition } from "../../domain/availability/ServiceDefinition.js";
import { ServiceCode, isServiceCode } from "../../domain/availability/Service.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

interface ServiceRow {
  code: string;
  displayName: string;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/** `code` is validated against the closed `ServiceCode` union at the read boundary — this repository never returns a row whose stored code has drifted outside {"lunch","dinner"}; such a row (which nothing in this increment can create) is treated as absent rather than surfaced as a malformed ServiceDefinition. */
function toDomainServiceDefinition(row: ServiceRow): ServiceDefinition | null {
  if (!isServiceCode(row.code)) return null;
  return { code: row.code, displayName: row.displayName, enabled: row.enabled, createdAt: row.createdAt, updatedAt: row.updatedAt };
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
}
