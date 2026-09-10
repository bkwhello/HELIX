import { PrismaClient } from "@prisma/client";
import { SecurityEventReader, SecurityEventRecord } from "../../application/ports/SecurityEventReader.js";

/**
 * R1.7-P1 — mirrors PrismaSecurityEventRecorder.ts exactly: writes via
 * the SAME shared PrismaClient every other adapter in this deployment
 * uses, never a second connection. No `where` clause beyond the
 * optional `since` filter — the allowlist projection (username
 * resolution, reason parsing) happens one layer up, never here.
 */
export class PrismaSecurityEventReader implements SecurityEventReader {
  constructor(private readonly prisma: PrismaClient) {}

  async listRecent(input: { readonly since?: Date; readonly limit: number }): Promise<readonly SecurityEventRecord[]> {
    return this.prisma.securityEvent.findMany({
      where: input.since ? { occurredAt: { gte: input.since } } : undefined,
      orderBy: [{ occurredAt: "desc" }, { id: "desc" }],
      take: input.limit,
    });
  }
}
