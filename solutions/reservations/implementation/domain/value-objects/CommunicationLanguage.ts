/**
 * R1.6-B — owner-confirmed guest-facing communication languages. An
 * explicit enum/value object, never arbitrary free text (assignment §3) —
 * mirrors the existing PreferredArea.ts convention exactly.
 *
 * Never inferred from browser headers, phone number, staff locale, email
 * domain, or nationality (R1.6-B architecture report §20 / assignment
 * §3) — always an explicit choice, made by the guest (future public
 * booking) or by staff (this phase, for a staff-created reservation with
 * email communication).
 */
export const CommunicationLanguage = {
  Dutch: "nl",
  English: "en",
} as const;

export type CommunicationLanguage = (typeof CommunicationLanguage)[keyof typeof CommunicationLanguage];

/**
 * Bounded, explicitly-documented default for legacy/internal callers that
 * do not yet supply a language (assignment §4: "do not silently infer
 * English... document any default"). This is a deliberate, code-level
 * DEFAULT — never an inference from guest/staff data — applied only when
 * the field is omitted entirely, so every existing R1.1-R1.5 caller that
 * predates this concept keeps working unchanged.
 */
export const DEFAULT_COMMUNICATION_LANGUAGE: CommunicationLanguage = CommunicationLanguage.Dutch;

export function isCommunicationLanguage(value: string): value is CommunicationLanguage {
  return value === CommunicationLanguage.Dutch || value === CommunicationLanguage.English;
}
