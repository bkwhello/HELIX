import { describe, it, expect } from "vitest";
import {
  createServiceDefaultDuration,
  InvalidServiceDefaultDurationError,
  SERVICE_DEFAULT_DURATION_MIN_MINUTES,
  SERVICE_DEFAULT_DURATION_MAX_MINUTES,
  SERVICE_DEFAULT_DURATION_STEP_MINUTES,
} from "../../domain/availability/ServiceDefaultDuration.js";

/**
 * R1.6-P3D-1 — domain-layer coverage for `createServiceDefaultDuration`,
 * the one pure constructor every caller validates a Service's optional
 * default reservation duration through. No I/O, no Service/ServiceSession/
 * capacity/Reservation lookup — see the file's own header comment.
 */
describe("createServiceDefaultDuration — accepted values", () => {
  it.each([15, 30, 60, 480])("accepts %i minutes", (minutes) => {
    expect(createServiceDefaultDuration(minutes)).toBe(minutes);
  });

  it("accepts every boundary constant exactly", () => {
    expect(createServiceDefaultDuration(SERVICE_DEFAULT_DURATION_MIN_MINUTES)).toBe(15);
    expect(createServiceDefaultDuration(SERVICE_DEFAULT_DURATION_MAX_MINUTES)).toBe(480);
    expect(SERVICE_DEFAULT_DURATION_STEP_MINUTES).toBe(15);
  });
});

describe("createServiceDefaultDuration — rejected values", () => {
  it("rejects a value below 15", () => {
    expect(() => createServiceDefaultDuration(14)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects a value above 480", () => {
    expect(() => createServiceDefaultDuration(481)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects zero", () => {
    expect(() => createServiceDefaultDuration(0)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects a negative value", () => {
    expect(() => createServiceDefaultDuration(-15)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects a non-integer value", () => {
    expect(() => createServiceDefaultDuration(30.5)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects NaN", () => {
    expect(() => createServiceDefaultDuration(Number.NaN)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects a value not divisible by 15", () => {
    expect(() => createServiceDefaultDuration(20)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("rejects a value not divisible by 15 even when within range", () => {
    expect(() => createServiceDefaultDuration(100)).toThrow(InvalidServiceDefaultDurationError);
  });

  it("error message names the offending value", () => {
    expect(() => createServiceDefaultDuration(20)).toThrow(/20/);
  });
});

describe("createServiceDefaultDuration — no I/O, no external lookup", () => {
  it("is a pure synchronous function (throws or returns immediately, no Promise)", () => {
    const result = createServiceDefaultDuration(60);
    expect(result).not.toBeInstanceOf(Promise);
  });
});
