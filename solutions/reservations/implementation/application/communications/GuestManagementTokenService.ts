/**
 * R1.6-B — guest-management token foundation (assignment §25/§26;
 * architecture report §22/§23, "Option A"). Directly reuses R1.2's own
 * proven mechanism — `SessionTokenGenerator` (256 bits of entropy,
 * base64url) and `hashSessionToken` (SHA-256) — rather than duplicating
 * identical logic under a new name. A distinct, guest-scoped credential
 * table (`GuestManagementCredentialRepository`) keeps this structurally
 * separate from `StaffSession` (INV-C09 — never staff authentication).
 *
 * This phase issues and stores the credential (called from
 * CreateReservationHandler.finalize(), atomic with reservation creation)
 * but does not expose any public verify/consume HTTP endpoint —
 * assignment §25 explicitly: "Do NOT implement public cancellation
 * endpoint yet." `verify()` exists so the mechanism is real and testable
 * end-to-end now, ready for a future public page to call.
 */
import { SessionTokenGenerator } from "../ports/SessionTokenGenerator.js";
import { GuestManagementCredentialRepository } from "../ports/GuestManagementCredentialRepository.js";
import { Clock } from "../ports/Clock.js";
import { hashSessionToken } from "../../domain/shared/hashSessionToken.js";

/** Safety-net absolute expiry (architecture report §23): comfortably past the reservation date, belt-and-suspenders alongside future explicit revocation on a terminal reservation status. */
export const GUEST_CREDENTIAL_SAFETY_NET_MS = 7 * 24 * 60 * 60 * 1000; // 7 days past the reservation date

export class GuestManagementTokenService {
  constructor(
    private readonly tokenGenerator: SessionTokenGenerator,
    private readonly credentialRepository: GuestManagementCredentialRepository,
    private readonly clock: Clock
  ) {}

  /** Returns the RAW token exactly once, for embedding in an outgoing email link — never persisted, never logged (assignment §26). */
  async issue(reservationId: string, reservationStart: Date): Promise<{ readonly rawToken: string }> {
    const rawToken = this.tokenGenerator.generate();
    const tokenHash = hashSessionToken(rawToken);
    const now = this.clock.now();
    const expiresAt = new Date(Math.max(reservationStart.getTime(), now.getTime()) + GUEST_CREDENTIAL_SAFETY_NET_MS);
    await this.credentialRepository.create({ reservationId, tokenHash, createdAt: now, expiresAt });
    return { rawToken };
  }

  /** A raw token presented by a future guest-facing caller. Returns the scoped reservationId, or null for any invalid/expired/revoked/unknown token — a single undifferentiated outcome, so a caller cannot distinguish "wrong token" from "expired token" by response shape (mirrors requireStaffSession's own undifferentiated-401 discipline). */
  async verify(rawToken: string): Promise<{ readonly reservationId: string } | null> {
    const tokenHash = hashSessionToken(rawToken);
    const record = await this.credentialRepository.findActiveByTokenHash(tokenHash, this.clock.now());
    return record ? { reservationId: record.reservationId } : null;
  }
}
