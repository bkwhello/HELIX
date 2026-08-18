import { ActorRole } from "../value-objects/Actor.js";
import { StaffUserStatus } from "../value-objects/StaffUserStatus.js";

export interface StaffUser {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly email: string | null;
  readonly passwordHash: string;
  readonly role: ActorRole;
  readonly status: StaffUserStatus;
  readonly createdAt: Date;
  readonly updatedAt: Date;
}

/**
 * R1.2 — Identity & Access. Port; infrastructure/ provides the
 * Prisma-backed adapter. `StaffUser.id` is the stable identity anchor
 * (R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §6) — never derived from
 * username/email/displayName, all three of which may change.
 */
export interface StaffUserRepository {
  findById(id: string): Promise<StaffUser | null>;
  findByUsername(username: string): Promise<StaffUser | null>;

  /**
   * Throws if the username is already taken, or (when `role` is Owner)
   * if an Owner already exists — both are real database constraints
   * (unique index on username; the partial unique index on
   * `role = 'Owner'`), not merely application-level checks. Callers
   * (CreateStaffUserHandler, the bootstrap script) are expected to catch
   * and translate, not to pre-check-then-write.
   */
  create(input: {
    readonly id: string;
    readonly username: string;
    readonly displayName: string;
    readonly email: string | null;
    readonly passwordHash: string;
    readonly role: ActorRole;
  }): Promise<StaffUser>;

  /** Whether any StaffUser currently holds the Owner role — used by the bootstrap script's own pre-check (the database constraint is the authoritative guard; this is just a friendlier pre-flight read). */
  ownerExists(): Promise<boolean>;
}
