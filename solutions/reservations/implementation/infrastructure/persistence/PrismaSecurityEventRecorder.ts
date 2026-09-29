import { PrismaClient } from "@prisma/client";
import { SecurityEventRecorder, LoginFailureReason, ServiceChangeMetadata } from "../../application/ports/SecurityEventRecorder.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { asPrismaTx } from "./PrismaTransactionManager.js";

/**
 * R1.2-P2 — writes via the SAME shared PrismaClient every other adapter
 * in this deployment uses, never a second connection. Mirrors
 * `infrastructure/bootstrap/bootstrapOwner.ts`'s own
 * `prisma.securityEvent.create({ type: "OwnerBootstrapped", ... })` call
 * shape exactly — the second real write site for this table, using the
 * same model, same field names, no schema change. `metadata` stores only
 * the fixed reason code as JSON — never the attempted username, password,
 * or any other attacker-controlled text (enforced by this port's own
 * narrow input type, not by this adapter re-checking anything).
 */
export class PrismaSecurityEventRecorder implements SecurityEventRecorder {
  constructor(private readonly prisma: PrismaClient) {}

  async recordLoginFailure(input: { readonly reason: LoginFailureReason; readonly targetStaffUserId: string | null }): Promise<void> {
    await this.prisma.securityEvent.create({
      data: {
        type: "LoginFailed",
        targetStaffUserId: input.targetStaffUserId,
        metadata: JSON.stringify({ reason: input.reason }),
      },
    });
  }

  async recordServiceModified(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void> {
    await this.writeServiceEvent("ServiceModified", input, tx);
  }

  async recordServiceDeactivated(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void> {
    await this.writeServiceEvent("ServiceDeactivated", input, tx);
  }

  async recordServiceReactivated(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void> {
    await this.writeServiceEvent("ServiceReactivated", input, tx);
  }

  /**
   * R1.6-P3G — the port's three Service methods share this one private
   * write, per the Chief Engineer directive ("methods may share private
   * adapter implementation, but the application-facing port must keep
   * the operations explicit"). `targetStaffUserId` is always null — a
   * Service is not a StaffUser. When `tx` is supplied, this write
   * participates in the SAME transaction as the caller's Service row
   * mutation (via the shared Prisma transaction client), so a failure
   * here rolls back that mutation too — never a second, independent
   * connection.
   */
  private async writeServiceEvent(
    type: "ServiceModified" | "ServiceDeactivated" | "ServiceReactivated",
    input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata },
    tx?: TransactionContext
  ): Promise<void> {
    const client = tx ? asPrismaTx(tx) : this.prisma;
    await client.securityEvent.create({
      data: {
        type,
        actingStaffUserId: input.actingStaffUserId,
        targetStaffUserId: null,
        metadata: JSON.stringify(input.metadata),
      },
    });
  }
}
