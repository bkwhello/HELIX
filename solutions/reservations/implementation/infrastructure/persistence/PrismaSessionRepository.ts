import { PrismaClient } from "@prisma/client";
import { SessionRepository, StaffSession } from "../../domain/repositories/SessionRepository.js";

export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { readonly hashedToken: string; readonly staffUserId: string; readonly expiresAt: Date }): Promise<StaffSession> {
    const row = await this.prisma.staffSession.create({
      data: { id: input.hashedToken, staffUserId: input.staffUserId, expiresAt: input.expiresAt },
    });
    return row;
  }

  async findByHashedToken(hashedToken: string): Promise<StaffSession | null> {
    return this.prisma.staffSession.findUnique({ where: { id: hashedToken } });
  }

  async revoke(hashedToken: string): Promise<void> {
    // updateMany, not update: a logout call for an already-revoked or
    // nonexistent session is a safe no-op, not an error worth surfacing —
    // the caller's intent (this session must not be valid) is already
    // satisfied either way.
    await this.prisma.staffSession.updateMany({
      where: { id: hashedToken, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeAllForUser(staffUserId: string): Promise<void> {
    await this.prisma.staffSession.updateMany({
      where: { staffUserId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }
}
