import { TransactionContext } from "../../domain/shared/TransactionContext.js";
import { ContactStatus } from "../../domain/value-objects/ContactStatus.js";

/**
 * CAP-D05.01 — Reservation Contact Management.
 *
 * Replaces the old ContactReader placeholder boundary (application/ports
 * used to export a bare `exists(contactId): Promise<boolean>`, backed in
 * production by UnvalidatedContactReader, which always returned true).
 * A Reservation's contactId now references a real record read/written
 * through this port.
 */
export interface ContactRecord {
  readonly id: string;
  readonly displayName: string;
  readonly phoneRaw?: string;
  readonly phoneNormalized?: string;
  readonly emailRaw?: string;
  readonly emailNormalized?: string;
  readonly status: ContactStatus;
  readonly createdBy: string;
  readonly createdAt: Date;
  readonly updatedAt: Date;
  readonly lastRelevantActivityAt: Date;
}

export interface CreateContactRecordInput {
  readonly id: string;
  readonly displayName: string;
  readonly phoneRaw?: string;
  readonly phoneNormalized?: string;
  readonly emailRaw?: string;
  readonly emailNormalized?: string;
  readonly createdBy: string;
  readonly now: Date;
  /** CAP-D02.03-style shared transaction — see CreateReservationRequest.tx. When supplied, this write participates in the caller's already-open transaction. */
  readonly tx?: TransactionContext;
}

export interface PossibleMatchCriteria {
  readonly phoneNormalized?: string;
  readonly emailNormalized?: string;
}

export interface ContactRepository {
  findById(id: string, tx?: TransactionContext): Promise<ContactRecord | null>;

  create(input: CreateContactRecordInput): Promise<ContactRecord>;

  /**
   * CAP-D05.01-R03 — Possible Match Discovery Is Non-Blocking, Never
   * Proof of Identity. Returns every Active Contact with an EXACT
   * normalized phone or email match. Never fuzzy, never used to
   * auto-reuse or auto-merge — the caller (staff, via the UI) decides
   * what to do with the results. Multiple Contacts may legitimately
   * share a phone/email (e.g. a shared family number); this is expected,
   * not an error.
   */
  findPossibleMatches(criteria: PossibleMatchCriteria): Promise<readonly ContactRecord[]>;

  /**
   * Updates the retention anchor (R1.3-I1 assignment §"Retention
   * anchor") to `now` — called when an existing Contact participates in
   * a new reservation. Best-effort / non-transactional by design: this
   * is retention metadata, not a safety-critical write, so it is not
   * worth extending the reservation-write transaction for. Automated
   * retention EXECUTION based on this anchor is explicitly deferred —
   * see R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md.
   */
  touchActivity(id: string, now: Date): Promise<void>;
}
