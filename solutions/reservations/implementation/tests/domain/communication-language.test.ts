import { describe, it, expect } from "vitest";
import { CommunicationLanguage, DEFAULT_COMMUNICATION_LANGUAGE, isCommunicationLanguage } from "../../domain/value-objects/CommunicationLanguage.js";

describe("CommunicationLanguage — assignment §3", () => {
  it("has exactly two allowed values: nl and en", () => {
    expect(Object.values(CommunicationLanguage).sort()).toEqual(["en", "nl"]);
  });

  it("defaults to Dutch (nl) — the documented, bounded default for legacy/internal callers (assignment §4)", () => {
    expect(DEFAULT_COMMUNICATION_LANGUAGE).toBe("nl");
  });

  it.each(["nl", "en"])("isCommunicationLanguage(%s) is true", (value) => {
    expect(isCommunicationLanguage(value)).toBe(true);
  });

  it.each(["NL", "EN", "english", "dutch", "fr", "", "nl "])("isCommunicationLanguage(%j) is false — never guesses at a near-miss", (value) => {
    expect(isCommunicationLanguage(value)).toBe(false);
  });
});
