/**
 * R1.6-B — guest-management token foundation (assignment §25/§26;
 * architecture report §22/§23). Only the hash is ever persisted — the raw
 * token exists only transiently, in application memory, long enough to be
 * embedded in an outgoing email link (not yet built — no public page
 * exists this phase, assignment §25). Scoped to exactly one reservation;
 * structurally distinct from StaffSession (never staff authentication).
 */
export interface GuestManagementCredentialRecord {
  readonly id: string;
  readonly reservationId: string;
  readonly createdAt: Date;
  readonly expiresAt: Date;
  readonly revokedAt?: Date;
}

export interface GuestManagementCredentialRepository {
  /** Persists only `tokenHash` — the caller must generate the raw token and never pass it here. */
  create(input: { readonly reservationId: string; readonly tokenHash: string; readonly createdAt: Date; readonly expiresAt: Date }): Promise<GuestManagementCredentialRecord>;

  /** Looks up by the HASH of a presented raw token — the raw token itself is never stored or searchable. Returns null if not found, expired, or revoked (a single, undifferentiated null keeps the caller from distinguishing "wrong token" from "expired token" by timing/response shape). */
  findActiveByTokenHash(tokenHash: string, now: Date): Promise<GuestManagementCredentialRecord | null>;

  findByReservationId(reservationId: string): Promise<readonly GuestManagementCredentialRecord[]>;

  revoke(id: string): Promise<void>;
}
