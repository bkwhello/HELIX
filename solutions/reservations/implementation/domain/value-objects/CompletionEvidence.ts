/**
 * CAP-D01.01-R30 — Completion Requires Operational Evidence.
 *
 * A bare `hasOperationalEvidence: boolean` tells the aggregate nothing
 * about what was observed, where it came from, when, or by whom — it
 * just lets a caller assert the rule away. This carries the actual
 * evidence instead; a manual completion is the one path that legitimately
 * has no structured evidence and relies on `manualCompletionReason`.
 */
export const CompletionEvidenceType = {
  ServiceClosed: "SERVICE_CLOSED",
  StaffObservation: "STAFF_OBSERVATION",
  PosSettlement: "POS_SETTLEMENT",
} as const;

export type CompletionEvidenceType = (typeof CompletionEvidenceType)[keyof typeof CompletionEvidenceType];

export interface CompletionEvidence {
  readonly type: CompletionEvidenceType;
  /** e.g. a Live Service Management session id, or a POS settlement id. */
  readonly referenceId?: string;
  readonly recordedBy: string;
  readonly recordedAt: Date;
}
