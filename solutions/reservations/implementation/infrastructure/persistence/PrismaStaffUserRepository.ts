import { PrismaClient } from "@prisma/client";
import { StaffUserRepository, StaffUser } from "../../domain/repositories/StaffUserRepository.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { StaffUserStatus } from "../../domain/value-objects/StaffUserStatus.js";

interface StaffUserRow {
  id: string;
  username: string;
  displayName: string;
  email: string | null;
  passwordHash: string;
  role: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

function toDomain(row: StaffUserRow): StaffUser {
  return {
    id: row.id,
    username: row.username,
    displayName: row.displayName,
    email: row.email,
    passwordHash: row.passwordHash,
    role: row.role as ActorRole,
    status: row.status as StaffUserStatus,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  };
}

export class PrismaStaffUserRepository implements StaffUserRepository {
  constructor(private readonly prisma: PrismaClient) {}

  async findById(id: string): Promise<StaffUser | null> {
    const row = await this.prisma.staffUser.findUnique({ where: { id } });
    return row ? toDomain(row) : null;
  }

  async findByUsername(username: string): Promise<StaffUser | null> {
    const row = await this.prisma.staffUser.findUnique({ where: { username } });
    return row ? toDomain(row) : null;
  }

  async create(input: {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly email: string | null;
    readonly passwordHash: string;
    readonly role: ActorRole;
  }): Promise<StaffUser> {
    const row = await this.prisma.staffUser.create({
      data: {
        id: input.id,
        username: input.username,
        displayName: input.displayName,
        email: input.email,
        passwordHash: input.passwordHash,
        role: input.role,
        status: StaffUserStatus.Active,
      },
    });
    return toDomain(row);
  }

  async ownerExists(): Promise<boolean> {
    const owner = await this.prisma.staffUser.findFirst({ where: { role: ActorRole.Owner } });
    return owner !== null;
  }
}
