import { PrismaClient } from "@prisma/client";
import { GuestManagementCredentialRepository, GuestManagementCredentialRecord } from "../../application/ports/GuestManagementCredentialRepository.js";

function toRecord(row: { id: string; reservationId: string; createdAt: Date; expiresAt: Date; revokedAt: Date | null }): GuestManagementCredentialRecord {
  return { id: row.id, reservationId: row.reservationId, createdAt: row.createdAt, expiresAt: row.expiresAt, revokedAt: row.revokedAt ?? undefined };
}

export class PrismaGuestManagementCredentialRepository implements GuestManagementCredentialRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async create(input: { readonly reservationId: string; readonly tokenHash: string; readonly createdAt: Date; readonly expiresAt: Date }): Promise<GuestManagementCredentialRecord> {
    const row = await this.prisma.guestManagementCredential.create({
      data: { reservationId: input.reservationId, tokenHash: input.tokenHash, createdAt: input.createdAt, expiresAt: input.expiresAt },
    });
    return toRecord(row);
  }

  async findActiveByTokenHash(tokenHash: string, now: Date): Promise<GuestManagementCredentialRecord | null> {
    const row = await this.prisma.guestManagementCredential.findUnique({ where: { tokenHash } });
    if (!row) return null;
    if (row.revokedAt !== null) return null;
    if (row.expiresAt <= now) return null;
    return toRecord(row);
  }

  async findByReservationId(reservationId: string): Promise<readonly GuestManagementCredentialRecord[]> {
    const rows = await this.prisma.guestManagementCredential.findMany({ where: { reservationId }, orderBy: { createdAt: "desc" } });
    return rows.map(toRecord);
  }

  async revoke(id: string): Promise<void> {
    await this.prisma.guestManagementCredential.updateMany({ where: { id }, data: { revokedAt: new Date() } });
  }
}
