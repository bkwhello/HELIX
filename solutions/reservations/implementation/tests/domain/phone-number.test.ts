import { describe, it, expect } from "vitest";
import { PhoneNumber, normalizePhone } from "../../domain/value-objects/PhoneNumber.js";

/**
 * CAP-D05.01-R05 final-gate correction — regression coverage for the
 * maintained-library phone normalization (libphonenumber-js), default
 * region NL. See R1_3_I1_CAP_D05_01_IMPLEMENTATION_REPORT.md's final
 * gate addendum for why a library replaced the original bounded
 * internal normalizer.
 */
describe("PhoneNumber — Dutch national-format equivalence", () => {
  it("normalizes 06.../+31.../0031... forms of the same Dutch mobile number to the same E.164 value", () => {
    const forms = ["06 12345678", "+31 6 12345678", "0031 6 12345678", "0612345678"];
    const normalized = forms.map((f) => normalizePhone(f));
    expect(new Set(normalized).size).toBe(1); // all four collapse to one value
    expect(normalized[0]).toBe("+31612345678");
  });

  it("normalizes a Dutch landline number correctly under the NL default region", () => {
    expect(normalizePhone("020 1234567")).toBe("+31201234567");
  });
});

describe("PhoneNumber — international numbers are not assumed Dutch", () => {
  it("parses a valid US number given in full E.164 form, unaffected by the NL default region", () => {
    expect(normalizePhone("+1 202-555-0143")).toBe("+12025550143");
  });

  it("parses a valid UK number given in full E.164 form", () => {
    expect(normalizePhone("+44 20 7946 0958")).toBe("+442079460958");
  });
});

describe("PhoneNumber — invalid or ambiguous input is never guessed", () => {
  it("returns undefined (not a fabricated value) for input that cannot be parsed as a real number", () => {
    expect(normalizePhone("not a phone number")).toBeUndefined();
  });

  it("returns undefined for a number that is structurally too short to be valid", () => {
    expect(normalizePhone("123")).toBeUndefined();
  });

  it("returns undefined for an empty string", () => {
    expect(normalizePhone("")).toBeUndefined();
  });
});

describe("PhoneNumber value object — raw is always preserved regardless of normalization outcome", () => {
  it("keeps the exact raw input even when it normalizes successfully", () => {
    const result = PhoneNumber.create("06 12 34 56 78");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.getRaw()).toBe("06 12 34 56 78"); // exact, not reformatted
    expect(result.value.getNormalized()).toBe("+31612345678");
  });

  it("keeps the raw input even when normalization fails, and does not reject Contact creation on that basis alone (CAP-D05.01-R01 only requires non-blank)", () => {
    const result = PhoneNumber.create("call the front desk");
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.getRaw()).toBe("call the front desk");
    expect(result.value.getNormalized()).toBeUndefined();
  });

  it("still rejects a blank phone value — CAP-D05.01-R01", () => {
    const result = PhoneNumber.create("   ");
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.violations.some((v) => v.ruleId === "CAP-D05.01-R01")).toBe(true);
  });
});
