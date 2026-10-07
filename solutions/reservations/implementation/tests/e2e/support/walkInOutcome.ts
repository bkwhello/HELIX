/**
 * R1.5-P7-C1 — exact classification of the Walk-in form's result message
 * (#walkin-message text + its showMessage() class: "message ok|warn|error").
 * Pure (no Playwright import), so it is unit-tested in vitest
 * (tests/pilot/walkin-session-not-open-ui.test.ts) as well as used by
 * tests/e2e/walkin-auth.spec.ts.
 *
 * The previous success check was `toMatch(/geregistreerd/)`, which the
 * FAILURE text "Walk-in niet geregistreerd: …" also satisfied. Success is now
 * only ever one of the two exact success messages with its exact class.
 * Exactly two known environment prerequisites may skip; anything else
 * (unknown error, capacity, closed, auth, empty) is a FAILURE.
 */
export const WALKIN_SUCCESS_SEATED_MESSAGE = "Walk-in geregistreerd en geplaatst.";
export const WALKIN_SUCCESS_UNSEATED_MESSAGE = "Walk-in geregistreerd, maar nog niet geplaatst. Kies hieronder een tafel of zitplaats om te plaatsen.";
export const WALKIN_SESSION_NOT_OPEN_MESSAGE = "Walk-in kan niet worden geregistreerd: er is geen geopende dienst.";
export const WALKIN_OUTSIDE_BOOKING_WINDOW_MESSAGE = "Walk-in niet geregistreerd:\nBuiten de reserveringstijden.";

export type WalkInOutcome = "SUCCESS" | "SKIP_OUTSIDE_BOOKING_WINDOW" | "SKIP_NO_OPENED_SESSION" | "FAILURE";

export function classifyWalkInMessage(text: string, className: string): WalkInOutcome {
  const message = text.replace(/\r\n/g, "\n").trim();
  const classes = new Set(className.split(/\s+/));
  if (!classes.has("message")) return "FAILURE";
  if (classes.has("ok") && message === WALKIN_SUCCESS_SEATED_MESSAGE) return "SUCCESS";
  if (classes.has("warn") && message === WALKIN_SUCCESS_UNSEATED_MESSAGE) return "SUCCESS";
  if (classes.has("error") && message === WALKIN_SESSION_NOT_OPEN_MESSAGE) return "SKIP_NO_OPENED_SESSION";
  if (classes.has("error") && message === WALKIN_OUTSIDE_BOOKING_WINDOW_MESSAGE) return "SKIP_OUTSIDE_BOOKING_WINDOW";
  return "FAILURE";
}
