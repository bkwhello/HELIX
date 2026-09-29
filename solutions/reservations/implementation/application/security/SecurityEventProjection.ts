import { SecurityEventRecord } from "../ports/SecurityEventReader.js";
import { LoginFailureReason, ServiceChangeMetadata } from "../ports/SecurityEventRecorder.js";

const KNOWN_LOGIN_FAILURE_REASONS: ReadonlySet<string> = new Set<LoginFailureReason>(["UNKNOWN_USERNAME", "INVALID_PASSWORD", "ACCOUNT_DISABLED"]);

const SERVICE_CHANGE_EVENT_TYPES: ReadonlySet<string> = new Set(["ServiceModified", "ServiceDeactivated", "ServiceReactivated"]);

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

/**
 * R1.7-P1 — the explicit HTTP-response allowlist (Chief Engineer
 * directive). Every field here is deliberately named, never a spread of
 * the underlying record: `metadata` itself, any other metadata key, and
 * anything not listed below (attempted username, password, session,
 * IP/device, exception detail) can never reach a caller through this
 * type, regardless of what a future SecurityEvent type might store.
 */
export interface SecurityEventProjectionRow {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: string;
  readonly actingStaffUserId: string | null;
  readonly actingStaffUsername: string | null;
  readonly targetStaffUserId: string | null;
  readonly targetStaffUsername: string | null;
  readonly reason: LoginFailureReason | null;
  /**
   * R1.6-P3G — populated only for `ServiceModified`/`ServiceDeactivated`/
   * `ServiceReactivated`; `null` for every other event type, including a
   * future/unknown one, matching `reason`'s own "always present, null
   * when not applicable" convention above. Malformed or legacy metadata
   * (wrong shape, missing keys, unparsable JSON) degrades to `null`
   * rather than throwing or leaking the raw string — same posture as
   * `parseLoginFailureReason` below.
   */
  readonly serviceChange: ServiceChangeMetadata | null;
}

/**
 * Only ever attempted for `"LoginFailed"` — every other event type
 * projects `reason: null` unconditionally, without even looking at its
 * metadata. Malformed JSON, a missing `reason` key, or a value outside
 * the known three-member union all degrade to `null` rather than
 * throwing — a single corrupted row must never fail the whole
 * response (Chief Engineer directive).
 */
function parseLoginFailureReason(type: string, metadata: string | null): LoginFailureReason | null {
  if (type !== "LoginFailed" || !metadata) return null;
  try {
    const parsed: unknown = JSON.parse(metadata);
    const reason = (parsed as { reason?: unknown } | null)?.reason;
    return typeof reason === "string" && KNOWN_LOGIN_FAILURE_REASONS.has(reason) ? (reason as LoginFailureReason) : null;
  } catch {
    return null;
  }
}

/**
 * R1.6-P3G — only ever attempted for the three Service audit types,
 * exactly mirroring `parseLoginFailureReason`'s own "wrong type never
 * throws, degrades to null" posture. Validates the top-level shape
 * (`serviceCode` a string, `changes` a plain object whose every value is
 * itself a plain `{ old, new }` pair) before trusting any of it; any
 * deviation — malformed JSON, a legacy/foreign shape, an unexpected
 * nested value — collapses the WHOLE result to `null` rather than
 * projecting a partially-trusted structure, the same all-or-nothing
 * granularity `parseLoginFailureReason` uses for its own single field.
 */
function parseServiceChange(type: string, metadata: string | null): ServiceChangeMetadata | null {
  if (!SERVICE_CHANGE_EVENT_TYPES.has(type) || !metadata) return null;
  try {
    const parsed: unknown = JSON.parse(metadata);
    if (!isPlainObject(parsed)) return null;
    const serviceCode = parsed["serviceCode"];
    const changesRaw = parsed["changes"];
    if (typeof serviceCode !== "string" || !isPlainObject(changesRaw)) return null;
    const changes: Record<string, { old: unknown; new: unknown }> = {};
    for (const [key, value] of Object.entries(changesRaw)) {
      if (!isPlainObject(value) || !("old" in value) || !("new" in value)) return null;
      changes[key] = { old: value["old"], new: value["new"] };
    }
    return { serviceCode, changes };
  } catch {
    return null;
  }
}

/**
 * `usernamesById` is pre-resolved by the caller (one batched lookup per
 * response, via StaffUserRepository.findById) — this function stays
 * pure/no I/O, matching the domain/rules/*.ts convention. A record
 * whose acting/target id has no entry in the map (never persisted, or
 * an unknown attempted-login username that was never resolved to a
 * StaffUser in the first place) projects that identity's username as
 * `null` — it is never recovered or guessed at.
 */
export function projectSecurityEvent(record: SecurityEventRecord, usernamesById: ReadonlyMap<string, string>): SecurityEventProjectionRow {
  return {
    id: record.id,
    type: record.type,
    occurredAt: record.occurredAt.toISOString(),
    actingStaffUserId: record.actingStaffUserId,
    actingStaffUsername: record.actingStaffUserId ? (usernamesById.get(record.actingStaffUserId) ?? null) : null,
    targetStaffUserId: record.targetStaffUserId,
    targetStaffUsername: record.targetStaffUserId ? (usernamesById.get(record.targetStaffUserId) ?? null) : null,
    reason: parseLoginFailureReason(record.type, record.metadata),
    serviceChange: parseServiceChange(record.type, record.metadata),
  };
}
