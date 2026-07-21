/**
 * CAP-D01.01-R05 — Reservation Changes Are Atomic
 * CAP-D01.01-R43 — Failed Commands Do Not Change State
 *
 * Every domain operation that can fail returns a Result instead of throwing.
 * A failed Result never carries a state mutation with it.
 */
export type Result<T> = Readonly<
  { readonly ok: true; readonly value: T } | { readonly ok: false; readonly violations: readonly RuleViolation[] }
>;

export interface RuleViolation {
  readonly ruleId: string;
  readonly message: string;
}

export function ok<T>(value: T): Result<T> {
  return { ok: true, value };
}

export function fail<T>(violations: readonly RuleViolation[]): Result<T> {
  return { ok: false, violations };
}

export function violation(ruleId: string, message: string): RuleViolation {
  return { ruleId, message };
}
