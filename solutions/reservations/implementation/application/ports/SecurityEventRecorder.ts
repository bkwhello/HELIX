import { TransactionContext } from "../../domain/shared/TransactionContext.js";

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

/**
 * R1.6-P3G — the one allowlisted metadata shape for the three Service
 * audit methods below. `changes` carries only the public domain field
 * names that actually changed (never a database column name, never an
 * unchanged field), each as an explicit `{ old, new }` pair with `null`
 * preserved rather than omitted. Never the request body, session data,
 * credentials, headers, exception messages, or permission names.
 */
export interface ServiceChangeMetadata {
  readonly serviceCode: string;
  readonly changes: Readonly<Record<string, { readonly old: unknown; readonly new: unknown }>>;
}

export interface SecurityEventRecorder {
  /** `targetStaffUserId` is null when no StaffUser was resolved (e.g. an unknown username). */
  recordLoginFailure(input: { readonly reason: LoginFailureReason; readonly targetStaffUserId: string | null }): Promise<void>;

  /**
   * R1.6-P3G — one purpose-built method per Service lifecycle audit
   * event, matching this port's own narrow-method convention: no generic
   * `record(type, metadata)` escape hatch. `targetStaffUserId` is always
   * null for these three (the acting staff member IS the only relevant
   * identity — a Service is not a StaffUser). `tx`, when supplied, must
   * be the SAME transaction the corresponding Service row mutation runs
   * in, so both writes commit or roll back together.
   */
  recordServiceModified(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void>;
  recordServiceDeactivated(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void>;
  recordServiceReactivated(input: { readonly actingStaffUserId: string; readonly metadata: ServiceChangeMetadata }, tx?: TransactionContext): Promise<void>;
}
