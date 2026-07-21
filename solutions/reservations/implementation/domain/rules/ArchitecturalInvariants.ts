/**
 * Rules CAP-D01.01-R43 through R49 are architectural guarantees rather
 * than conditional business checks. They are satisfied by how the
 * domain and application layers are built, not by an "if" statement
 * inside a single rule function. This file documents where each one
 * is actually enforced, so the mapping stays traceable.
 *
 * CAP-D01.01-R43 — Failed Commands Do Not Change State
 *   Enforced by the Result<T> type (see shared/Result.ts): every command
 *   handler returns fail(violations) before any aggregate field is
 *   written. There is no code path that mutates state and then reports
 *   failure.
 *
 * CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe
 *   Enforced at the application layer: command handlers accept a
 *   client-supplied idempotency/command key, and the repository port
 *   (ReservationRepository) is responsible for detecting a command that
 *   was already applied and returning the prior result instead of
 *   re-applying it. See application/ports/IdempotencyStore.ts.
 *
 * CAP-D01.01-R45 — External Failure Shall Not Corrupt Internal State
 *   Enforced by construction: the aggregate has no dependency on any
 *   external channel, communication provider, or integration. Internal
 *   commands cannot fail because of an external system, because they
 *   never call one.
 *
 * CAP-D01.01-R46 — Unknown External State Must Be Explicit
 *   Not owned by this capability's runtime behaviour. See event-model.md
 *   §9 and acceptance.md CAP-D01.01-AC22: the responsible Integration
 *   capability records and exposes synchronization uncertainty.
 *
 * CAP-D01.01-R47 — Reservation Acceptance Is Separate from Availability
 *   Enforced by omission: the aggregate has no capacity, pacing, or
 *   availability field, and no rule in this domain model evaluates one.
 *   A Proposed reservation may be created before Availability Management
 *   renders its decision, per policy owned elsewhere.
 *
 * CAP-D01.01-R48 — Preferred Area Is a Preference
 *   Enforced by naming and by omission: any seating-area field on the
 *   Reservation aggregate is named as a preference, never as an
 *   assignment, and the aggregate has no table/seat identifier field —
 *   that identity is owned by Seating Assignment.
 *
 * CAP-D01.01-R49 — Reservation Duration Is Planning Information
 *   Enforced by omission: reservation duration, if present, informs
 *   downstream planning but never gates a lifecycle transition rule in
 *   this file.
 */
export const ARCHITECTURAL_INVARIANTS_DOCUMENTED = [
  "CAP-D01.01-R43",
  "CAP-D01.01-R44",
  "CAP-D01.01-R45",
  "CAP-D01.01-R46",
  "CAP-D01.01-R47",
  "CAP-D01.01-R48",
  "CAP-D01.01-R49",
] as const;
