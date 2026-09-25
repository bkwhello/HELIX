import { describe, it, expect } from "vitest";
import {
  createServiceOperatingInterval,
  parsePersistedServiceOperatingInterval,
  InvalidServiceOperatingIntervalError,
} from "../../domain/availability/ServiceOperatingInterval.js";

describe("createServiceOperatingInterval — valid pairs", () => {
  it("accepts [720,960) — 12:00-16:00, the seeded lunch value", () => {
    expect(createServiceOperatingInterval(720, 960)).toEqual({ startMinute: 720, endMinute: 960 });
  });

  it("accepts start = 0 (midnight)", () => {
    expect(createServiceOperatingInterval(0, 60)).toEqual({ startMinute: 0, endMinute: 60 });
  });

  it("accepts end = 1440 (midnight, exclusive upper bound)", () => {
    expect(createServiceOperatingInterval(1439, 1440)).toEqual({ startMinute: 1439, endMinute: 1440 });
  });
});

describe("createServiceOperatingInterval — rejected pairs", () => {
  it("rejects equal start/end", () => {
    expect(() => createServiceOperatingInterval(720, 720)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects a reversed pair (end before start)", () => {
    expect(() => createServiceOperatingInterval(960, 720)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects a negative start", () => {
    expect(() => createServiceOperatingInterval(-1, 60)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects start above 1439", () => {
    expect(() => createServiceOperatingInterval(1440, 1440)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects end above 1440", () => {
    expect(() => createServiceOperatingInterval(0, 1441)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects end below 1 (0 is not a valid exclusive end)", () => {
    expect(() => createServiceOperatingInterval(0, 0)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects a non-integer startMinute", () => {
    expect(() => createServiceOperatingInterval(720.5, 960)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects a non-integer endMinute", () => {
    expect(() => createServiceOperatingInterval(720, 960.25)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("rejects NaN", () => {
    expect(() => createServiceOperatingInterval(Number.NaN, 960)).toThrow(InvalidServiceOperatingIntervalError);
  });
});

describe("parsePersistedServiceOperatingInterval — absence and malformed pairs", () => {
  it("both columns null -> null (absence, never a guessed value)", () => {
    expect(parsePersistedServiceOperatingInterval(null, null)).toBeNull();
  });

  it("a valid persisted pair round-trips to the atomic domain value", () => {
    expect(parsePersistedServiceOperatingInterval(720, 960)).toEqual({ startMinute: 720, endMinute: 960 });
  });

  it("startMinute present, endMinute null — a malformed persisted pair — throws rather than silently coercing to null", () => {
    expect(() => parsePersistedServiceOperatingInterval(720, null)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("endMinute present, startMinute null — a malformed persisted pair — throws rather than silently coercing to null", () => {
    expect(() => parsePersistedServiceOperatingInterval(null, 960)).toThrow(InvalidServiceOperatingIntervalError);
  });

  it("a persisted pair that is present but out of range still throws (range validation is not bypassed for persisted data)", () => {
    expect(() => parsePersistedServiceOperatingInterval(960, 720)).toThrow(InvalidServiceOperatingIntervalError);
  });
});
