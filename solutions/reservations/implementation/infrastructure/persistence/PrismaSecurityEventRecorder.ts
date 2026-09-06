import { PrismaClient } from "@prisma/client";
import { SecurityEventRecorder, LoginFailureReason } from "../../application/ports/SecurityEventRecorder.js";

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
}
