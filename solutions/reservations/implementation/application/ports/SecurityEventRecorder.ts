/**
 * R1.2-P2 — deliberately narrow: a purpose-specific `recordLoginFailure`
 * contract with a fixed reason union, not an unrestricted arbitrary
 * event-type/metadata writer (Chief Engineer directive). This port
 * cannot be used to record any other `SecurityEvent` type or an
 * arbitrary metadata shape — if a future need arises for a different
 * event, it gets its own narrow method here, not a generic escape hatch.
 *
 * Never carries the attempted username, password, password-derived
 * data, session information, IP address, device information, or any
 * other attacker-controlled text — only the fixed reason code and,
 * when a StaffUser was actually resolved, that user's id.
 */
export type LoginFailureReason = "UNKNOWN_USERNAME" | "INVALID_PASSWORD" | "ACCOUNT_DISABLED";

export interface SecurityEventRecorder {
  /** `targetStaffUserId` is null when no StaffUser was resolved (e.g. an unknown username). */
  recordLoginFailure(input: { readonly reason: LoginFailureReason; readonly targetStaffUserId: string | null }): Promise<void>;
}
