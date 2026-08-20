/**
 * R1.6-B — minimal structural email templates (assignment §27/§28/§29/§30).
 *
 * DRAFT — OWNER BRANDING SIGN-OFF REQUIRED. This is engineering
 * placeholder copy establishing the correct DATA CONTRACT and escaping
 * discipline, not final, brand-approved guest-facing wording (assignment
 * §27's own explicit instruction). Do not deploy this copy to real guests
 * without owner review.
 *
 * Code-based templates, not database/provider-managed (architecture
 * report §19) — plain, pure, deterministic functions; no I/O. Date/time
 * values are formatted via the existing, DST-correct
 * domain/availability/ServiceTime.ts helpers, never reimplemented here —
 * formatted as an unambiguous "YYYY-MM-DD"/"HH:MM" pair for both
 * languages (locale-specific date formatting, e.g. Dutch "20 augustus
 * 2026", is a presentation refinement left for the owner-branding pass,
 * not invented speculatively here).
 */
import { CommunicationLanguage } from "../value-objects/CommunicationLanguage.js";
import { toLocalServiceDate, toLocalHourMinute } from "../availability/ServiceTime.js";

export interface RenderedMessage {
  readonly subject: string;
  readonly html: string;
  readonly text: string;
}

export interface CommunicationContentData {
  readonly guestName: string;
  readonly reservationReference: string;
  readonly reservationStart: Date;
  readonly partySize: number;
  /** A plain string, not CapacityPoolId — may be "N/A" when the reservation has no preferredArea set (assignment does not require area presence for confirmation eligibility). */
  readonly area: string;
  /** Present only once the guest-management token foundation (§25) is wired to an actual link — this phase issues/stores the credential but does not yet render a public URL, since no public page exists (assignment §25: "Do NOT implement public cancellation endpoint yet"). */
  readonly managementLink?: string;
}

/**
 * Escapes the five HTML-significant characters. Applied to every
 * guest-provided value before interpolation into `html` (assignment
 * §28 — never allow guest name/notes/contact values to inject arbitrary
 * HTML or email headers). `text` bodies need no escaping (plain text has
 * no markup to break out of); `subject` is never built from raw guest
 * input in these templates (only from static copy + the reservation
 * reference, which is a `crypto.randomUUID()` value, not guest-authored).
 */
export function escapeHtml(value: string): string {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function formatLocalDate(instant: Date): string {
  return toLocalServiceDate(instant);
}
function formatLocalTime(instant: Date): string {
  const { hour, minute } = toLocalHourMinute(instant);
  return `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
}

const CONTACT_INSTRUCTION: Record<CommunicationLanguage, string> = {
  nl: "Neem contact op met Konnichiwa als u vragen heeft over uw reservering.",
  en: "Please contact Konnichiwa if you have any questions about your reservation.",
};

const CANCELLATION_RULE: Record<CommunicationLanguage, string> = {
  nl: "U kunt uw reservering online annuleren tot 2 uur voor aanvang. Binnen 2 uur: bel Konnichiwa. Wijzigen van datum, tijd, aantal personen of Sushi/Teppanyaki kan momenteel alleen telefonisch.",
  en: "You may cancel your reservation online until 2 hours before the start time. Within 2 hours: please call Konnichiwa. Changing the date, time, party size, or Sushi/Teppanyaki area currently requires a phone call.",
};

/** Assignment §29 — confirmation data contract. */
export function renderConfirmation(language: CommunicationLanguage, data: CommunicationContentData): RenderedMessage {
  const guestName = escapeHtml(data.guestName);
  const date = formatLocalDate(data.reservationStart);
  const time = formatLocalTime(data.reservationStart);
  const reference = escapeHtml(data.reservationReference);
  const linkHtml = data.managementLink ? `<p><a href="${escapeHtml(data.managementLink)}">${language === "nl" ? "Beheer uw reservering" : "Manage your reservation"}</a></p>` : "";
  const linkText = data.managementLink ? `\n${language === "nl" ? "Beheer uw reservering" : "Manage your reservation"}: ${data.managementLink}\n` : "";

  if (language === "en") {
    return {
      subject: `Konnichiwa — Reservation confirmed (${date} ${time})`,
      html: `<p>Dear ${guestName},</p><p>Your reservation at Konnichiwa is confirmed.</p><ul><li>Reference: ${reference}</li><li>Date: ${date}</li><li>Time: ${time}</li><li>Party size: ${data.partySize}</li><li>Area: ${escapeHtml(data.area)}</li></ul>${linkHtml}<p>${CONTACT_INSTRUCTION.en}</p>`,
      text: `Dear ${data.guestName},\n\nYour reservation at Konnichiwa is confirmed.\nReference: ${data.reservationReference}\nDate: ${date}\nTime: ${time}\nParty size: ${data.partySize}\nArea: ${data.area}\n${linkText}\n${CONTACT_INSTRUCTION.en}`,
    };
  }
  return {
    subject: `Konnichiwa — Reservering bevestigd (${date} ${time})`,
    html: `<p>Beste ${guestName},</p><p>Uw reservering bij Konnichiwa is bevestigd.</p><ul><li>Referentie: ${reference}</li><li>Datum: ${date}</li><li>Tijd: ${time}</li><li>Aantal personen: ${data.partySize}</li><li>Locatie: ${escapeHtml(data.area)}</li></ul>${linkHtml}<p>${CONTACT_INSTRUCTION.nl}</p>`,
    text: `Beste ${data.guestName},\n\nUw reservering bij Konnichiwa is bevestigd.\nReferentie: ${data.reservationReference}\nDatum: ${date}\nTijd: ${time}\nAantal personen: ${data.partySize}\nLocatie: ${data.area}\n${linkText}\n${CONTACT_INSTRUCTION.nl}`,
  };
}

/** Assignment §30 — reminder data contract. Never claims cancellation functionality exists beyond the owner-confirmed rule text itself (no functioning public endpoint is implemented in this phase). */
export function renderReminder(language: CommunicationLanguage, data: CommunicationContentData): RenderedMessage {
  const guestName = escapeHtml(data.guestName);
  const date = formatLocalDate(data.reservationStart);
  const time = formatLocalTime(data.reservationStart);
  const reference = escapeHtml(data.reservationReference);

  if (language === "en") {
    return {
      subject: `Konnichiwa — Reminder: your reservation is tomorrow (${time})`,
      html: `<p>Dear ${guestName},</p><p>This is a reminder of your upcoming reservation at Konnichiwa.</p><ul><li>Reference: ${reference}</li><li>Date: ${date}</li><li>Time: ${time}</li><li>Party size: ${data.partySize}</li><li>Area: ${escapeHtml(data.area)}</li></ul><p>${CANCELLATION_RULE.en}</p><p>${CONTACT_INSTRUCTION.en}</p>`,
      text: `Dear ${data.guestName},\n\nThis is a reminder of your upcoming reservation at Konnichiwa.\nReference: ${data.reservationReference}\nDate: ${date}\nTime: ${time}\nParty size: ${data.partySize}\nArea: ${data.area}\n\n${CANCELLATION_RULE.en}\n${CONTACT_INSTRUCTION.en}`,
    };
  }
  return {
    subject: `Konnichiwa — Herinnering: uw reservering is morgen (${time})`,
    html: `<p>Beste ${guestName},</p><p>Dit is een herinnering aan uw aankomende reservering bij Konnichiwa.</p><ul><li>Referentie: ${reference}</li><li>Datum: ${date}</li><li>Tijd: ${time}</li><li>Aantal personen: ${data.partySize}</li><li>Locatie: ${escapeHtml(data.area)}</li></ul><p>${CANCELLATION_RULE.nl}</p><p>${CONTACT_INSTRUCTION.nl}</p>`,
    text: `Beste ${data.guestName},\n\nDit is een herinnering aan uw aankomende reservering bij Konnichiwa.\nReferentie: ${data.reservationReference}\nDatum: ${date}\nTijd: ${time}\nAantal personen: ${data.partySize}\nLocatie: ${data.area}\n\n${CANCELLATION_RULE.nl}\n${CONTACT_INSTRUCTION.nl}`,
  };
}
