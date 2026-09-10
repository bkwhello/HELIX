/**
 * R1.7-P1 — the read-side counterpart to SecurityEventRecorder.ts, kept
 * in its own narrow port for the same reason that one is narrow: this
 * returns exactly the persisted row shape, never a projection or a join
 * — resolving a StaffUser id to a username, and parsing/validating
 * LoginFailed's metadata into an allowlisted reason, are both done by
 * application/security/SecurityEventProjection.ts, not here. Keeping
 * this port a plain, unopinionated read keeps it trivially satisfied by
 * a single Prisma query (see PrismaSecurityEventReader) and reusable if
 * a future caller ever needs the raw rows for a different projection.
 */
export interface SecurityEventRecord {
  readonly id: string;
  readonly type: string;
  readonly occurredAt: Date;
  readonly actingStaffUserId: string | null;
  readonly targetStaffUserId: string | null;
  readonly metadata: string | null;
}

export interface SecurityEventReader {
  /**
   * Ordered `occurredAt` DESC, then `id` DESC (deterministic even when
   * two events share a timestamp) — callers must not re-sort. `limit`
   * is always a caller-resolved, already-clamped positive integer; this
   * port performs no validation or clamping of its own.
   */
  listRecent(input: { readonly since?: Date; readonly limit: number }): Promise<readonly SecurityEventRecord[]>;
}
