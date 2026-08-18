export interface StaffSession {
  /** SHA-256 hash of the opaque session token — the raw token is never persisted, only ever held by the client cookie. See infrastructure/persistence/PrismaSessionRepository.ts. */
  readonly id: string;
  readonly staffUserId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt: Date | null;
}

/**
 * R1.2 — Identity & Access. Deliberately minimal: no role/status is ever
 * stored here (R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §9) — every
 * authenticated request re-reads StaffUser.status/.role live via
 * StaffUserRepository, so a disable or role change takes effect on the
 * very next request with no separate invalidation mechanism needed.
 */
export interface SessionRepository {
  /** `hashedToken` is the SHA-256 hash of the raw session token — callers never pass the raw token here. */
  create(input: { readonly hashedToken: string; readonly staffUserId: string; readonly expiresAt: Date }): Promise<StaffSession>;

  findByHashedToken(hashedToken: string): Promise<StaffSession | null>;

  revoke(hashedToken: string): Promise<void>;

  /** Used by disable-account handling (not yet exposed via HTTP in this MVA — see report, deferred scope) and by credential reset. */
  revokeAllForUser(staffUserId: string): Promise<void>;
}
