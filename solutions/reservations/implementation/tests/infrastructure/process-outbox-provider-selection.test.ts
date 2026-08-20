import { describe, it, expect } from "vitest";
import { buildEmailPort } from "../../ops/communications/processOutbox.js";
import { FakeEmailDeliveryPort } from "../../infrastructure/communications/FakeEmailDeliveryPort.js";
import { ResendEmailDeliveryAdapter } from "../../infrastructure/communications/ResendEmailDeliveryAdapter.js";

/**
 * R1.6-C1B assignment §39 P8 — production composition must fail closed
 * when a real provider is configured but incompletely, never silently
 * substitute the fake adapter. `buildEmailPort` is pure (takes a plain
 * env object, never reads `process.env` itself — ops/communications/
 * processOutbox.ts's own doc comment) so this is tested directly,
 * without touching any real environment variable or database.
 */
describe("buildEmailPort — production composition, fail-closed (R1_6_C1A §31)", () => {
  it("EMAIL_PROVIDER unset -> FakeEmailDeliveryPort (today's exact, unchanged default)", () => {
    expect(buildEmailPort({})).toBeInstanceOf(FakeEmailDeliveryPort);
  });

  it('EMAIL_PROVIDER="fake" -> FakeEmailDeliveryPort (explicit opt-in to the same default)', () => {
    expect(buildEmailPort({ EMAIL_PROVIDER: "fake" })).toBeInstanceOf(FakeEmailDeliveryPort);
  });

  it("EMAIL_PROVIDER=resend with both EMAIL_PROVIDER_API_KEY and EMAIL_FROM_ADDRESS -> ResendEmailDeliveryAdapter", () => {
    const port = buildEmailPort({
      EMAIL_PROVIDER: "resend",
      EMAIL_PROVIDER_API_KEY: "test-key-not-real",
      EMAIL_FROM_ADDRESS: "Konnichiwa <reservations@konnichiwa.nl>",
      EMAIL_REPLY_TO: "info@konnichiwa.nl",
    });
    expect(port).toBeInstanceOf(ResendEmailDeliveryAdapter);
  });

  it("EMAIL_PROVIDER=resend with EMAIL_REPLY_TO omitted still constructs successfully (Reply-To is optional)", () => {
    const port = buildEmailPort({ EMAIL_PROVIDER: "resend", EMAIL_PROVIDER_API_KEY: "k", EMAIL_FROM_ADDRESS: "Konnichiwa <reservations@konnichiwa.nl>" });
    expect(port).toBeInstanceOf(ResendEmailDeliveryAdapter);
  });

  it("EMAIL_PROVIDER=resend with EMAIL_PROVIDER_API_KEY missing -> throws, never falls back to Fake", () => {
    expect(() => buildEmailPort({ EMAIL_PROVIDER: "resend", EMAIL_FROM_ADDRESS: "Konnichiwa <reservations@konnichiwa.nl>" })).toThrow(/EMAIL_PROVIDER_API_KEY/);
  });

  it("EMAIL_PROVIDER=resend with EMAIL_FROM_ADDRESS missing -> throws, never falls back to Fake", () => {
    expect(() => buildEmailPort({ EMAIL_PROVIDER: "resend", EMAIL_PROVIDER_API_KEY: "k" })).toThrow(/EMAIL_FROM_ADDRESS/);
  });

  it("EMAIL_PROVIDER=resend with both missing -> throws", () => {
    expect(() => buildEmailPort({ EMAIL_PROVIDER: "resend" })).toThrow();
  });

  it("an unknown EMAIL_PROVIDER value -> throws, never silently defaults to Fake", () => {
    expect(() => buildEmailPort({ EMAIL_PROVIDER: "sendgrid" })).toThrow(/unknown EMAIL_PROVIDER/);
  });
});
