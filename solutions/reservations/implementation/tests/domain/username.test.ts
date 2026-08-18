import { describe, it, expect } from "vitest";
import { Username } from "../../domain/value-objects/Username.js";

describe("Username — normalization and validation", () => {
  it("normalizes to lowercase, so 'Kelvin' and 'kelvin' are the same account", () => {
    const a = Username.create("Kelvin");
    const b = Username.create("kelvin");
    expect(a.ok && a.value.toString()).toBe("kelvin");
    expect(b.ok && b.value.toString()).toBe("kelvin");
  });

  it("trims surrounding whitespace", () => {
    const result = Username.create("  reception1  ");
    expect(result.ok && result.value.toString()).toBe("reception1");
  });

  it("accepts letters, digits, dots, underscores, and hyphens", () => {
    const result = Username.create("jan.jansen_2");
    expect(result.ok).toBe(true);
  });

  it("rejects an empty or whitespace-only value", () => {
    expect(Username.create("").ok).toBe(false);
    expect(Username.create("   ").ok).toBe(false);
  });

  it("rejects a value shorter than 3 characters", () => {
    expect(Username.create("ab").ok).toBe(false);
  });

  it("rejects a value longer than 32 characters", () => {
    expect(Username.create("a".repeat(33)).ok).toBe(false);
  });

  it("rejects spaces and other disallowed characters", () => {
    expect(Username.create("jan jansen").ok).toBe(false);
    expect(Username.create("jan@jansen").ok).toBe(false);
  });
});
