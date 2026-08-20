import { describe, it, expect } from "vitest";
import { escapeHtml, renderConfirmation, renderReminder, CommunicationContentData } from "../../domain/communications/Templates.js";

const BASE_DATA: CommunicationContentData = {
  guestName: "Jan Jansen",
  reservationReference: "res-abc-123",
  reservationStart: new Date("2026-08-21T17:00:00Z"),
  partySize: 4,
  area: "Sushi",
};

describe("escapeHtml — assignment §28 (never allow guest data to inject HTML/headers)", () => {
  it("escapes the five HTML-significant characters", () => {
    expect(escapeHtml(`<script>alert("x")</script> & 'quote'`)).toBe("&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt; &amp; &#39;quote&#39;");
  });
});

describe("renderConfirmation — NL/EN data contract (assignment §29)", () => {
  it("NL includes all required fields", () => {
    const rendered = renderConfirmation("nl", BASE_DATA);
    expect(rendered.subject).toContain("bevestigd");
    expect(rendered.html).toContain("Jan Jansen");
    expect(rendered.html).toContain("res-abc-123");
    expect(rendered.html).toContain("4");
    expect(rendered.html).toContain("Sushi");
    expect(rendered.text).toContain("Jan Jansen");
  });

  it("EN includes all required fields", () => {
    const rendered = renderConfirmation("en", BASE_DATA);
    expect(rendered.subject).toContain("confirmed");
    expect(rendered.html).toContain("Jan Jansen");
    expect(rendered.text).toContain("confirmed");
  });

  it("never exposes internal identifiers (assignment §29's explicit non-exposure list) — only the reservation reference, never a raw Contact/CapacityCommitment/StaffUser id, appears", () => {
    const rendered = renderConfirmation("en", BASE_DATA);
    // The reservation reference itself IS expected (already proven safe — R1.6 investigation §13); nothing else identifier-shaped should appear.
    expect(rendered.html).not.toMatch(/contact-|commitment-|staff-/i);
  });

  it("escapes a malicious guest name rather than injecting it raw into HTML", () => {
    const malicious: CommunicationContentData = { ...BASE_DATA, guestName: `<img src=x onerror=alert(1)>` };
    const rendered = renderConfirmation("en", malicious);
    expect(rendered.html).not.toContain("<img src=x onerror=alert(1)>");
    expect(rendered.html).toContain("&lt;img src=x onerror=alert(1)&gt;");
  });

  it("renders a management link only when supplied, and escapes it too", () => {
    const withoutLink = renderConfirmation("en", BASE_DATA);
    expect(withoutLink.html).not.toContain("href=");

    const withLink: CommunicationContentData = { ...BASE_DATA, managementLink: `https://example.com/?x="><script>` };
    const rendered = renderConfirmation("en", withLink);
    expect(rendered.html).toContain("href=");
    expect(rendered.html).not.toContain(`"><script>`);
  });
});

describe("renderReminder — NL/EN data contract (assignment §30)", () => {
  it("NL includes the cancellation rule and never claims a working cancellation endpoint", () => {
    const rendered = renderReminder("nl", BASE_DATA);
    expect(rendered.html).toContain("2 uur");
    expect(rendered.html).toContain("Jan Jansen");
    // §30 — must not claim cancellation functionality exists; the rule text describes the POLICY (2h cutoff, call Konnichiwa), never a clickable "cancel now" mechanism, since no public endpoint exists yet.
    expect(rendered.html).not.toMatch(/href="[^"]*cancel/i);
  });

  it("EN includes the cancellation rule and the no-self-service-modification note", () => {
    const rendered = renderReminder("en", BASE_DATA);
    expect(rendered.html).toContain("2 hours");
    expect(rendered.html).toMatch(/phone call|call Konnichiwa/i);
  });

  it("escapes malicious guest data in the reminder too", () => {
    const malicious: CommunicationContentData = { ...BASE_DATA, guestName: `</p><script>alert(1)</script>` };
    const rendered = renderReminder("nl", malicious);
    expect(rendered.html).not.toContain("<script>alert(1)</script>");
  });
});
