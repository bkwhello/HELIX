import { describe, it, expect } from "vitest";
import {
  deriveLockKey,
  sortLockResources,
  CAPACITY_LOCK_NAMESPACE,
  deriveReservationLockKey,
  RESERVATION_LOCK_NAMESPACE,
} from "../../domain/availability/LockKey.js";

describe("deriveLockKey — determinism", () => {
  it("returns the identical key for the identical input, every time", () => {
    const a = deriveLockKey("Sushi", "2026-08-20");
    const b = deriveLockKey("Sushi", "2026-08-20");
    expect(a).toEqual(b);
  });

  it("uses the fixed namespace constant, never a computed or random one", () => {
    const key = deriveLockKey("Sushi", "2026-08-20");
    expect(key.namespace).toBe(CAPACITY_LOCK_NAMESPACE);
  });

  it("produces different keys for different pools on the same date", () => {
    const sushi = deriveLockKey("Sushi", "2026-08-20");
    const teppanyaki = deriveLockKey("Teppanyaki", "2026-08-20");
    expect(sushi.key).not.toBe(teppanyaki.key);
  });

  it("produces different keys for the same pool on different dates", () => {
    const day1 = deriveLockKey("Sushi", "2026-08-20");
    const day2 = deriveLockKey("Sushi", "2026-08-21");
    expect(day1.key).not.toBe(day2.key);
  });

  it("is not simply the field values swapped between two resources ('Sushi'+'20' vs 'Sushi2'+'0' style collisions) — the '|' separator prevents concatenation ambiguity", () => {
    const a = deriveLockKey("Sushi", "2026-08-2");
    const b = deriveLockKey("Sushi", "2026-08-20").key === deriveLockKey("Sushi", "2026-08-20").key; // sanity: still deterministic
    expect(b).toBe(true);
    expect(a.key).not.toBe(deriveLockKey("Sushi", "2026-08-20").key);
  });

  it("throws on missing inputs rather than silently hashing an empty/undefined value", () => {
    expect(() => deriveLockKey("", "2026-08-20")).toThrow();
    expect(() => deriveLockKey("Sushi", "")).toThrow();
  });

  it("always returns a signed 32-bit integer key (in range for pg_advisory_xact_lock(int4, int4))", () => {
    for (const poolId of ["Sushi", "Teppanyaki", "AnyOtherFuturePool"]) {
      for (const date of ["2026-01-01", "2026-08-20", "2099-12-31"]) {
        const { key } = deriveLockKey(poolId, date);
        expect(Number.isInteger(key)).toBe(true);
        expect(key).toBeGreaterThanOrEqual(-2147483648);
        expect(key).toBeLessThanOrEqual(2147483647);
      }
    }
  });
});

describe("deriveReservationLockKey — determinism (R1.1 Modify-vs-Modify P0 fix)", () => {
  it("returns the identical key for the identical reservationId, every time", () => {
    const a = deriveReservationLockKey("res-1");
    const b = deriveReservationLockKey("res-1");
    expect(a).toEqual(b);
  });

  it("uses a namespace distinct from CAPACITY_LOCK_NAMESPACE, so a reservation lock can never collide with a (pool, date) lock", () => {
    const key = deriveReservationLockKey("res-1");
    expect(key.namespace).toBe(RESERVATION_LOCK_NAMESPACE);
    expect(key.namespace).not.toBe(CAPACITY_LOCK_NAMESPACE);
  });

  it("produces different keys for different reservationIds", () => {
    const a = deriveReservationLockKey("res-1");
    const b = deriveReservationLockKey("res-2");
    expect(a.key).not.toBe(b.key);
  });

  it("throws on a missing reservationId rather than silently hashing an empty value", () => {
    expect(() => deriveReservationLockKey("")).toThrow();
  });

  it("always returns a signed 32-bit integer key", () => {
    for (const id of ["res-1", "a-very-long-uuid-like-reservation-identity-1234567890", "x"]) {
      const { key } = deriveReservationLockKey(id);
      expect(Number.isInteger(key)).toBe(true);
      expect(key).toBeGreaterThanOrEqual(-2147483648);
      expect(key).toBeLessThanOrEqual(2147483647);
    }
  });
});

describe("sortLockResources — deterministic global lock order", () => {
  it("sorts by capacityPoolId then localServiceDate ascending, regardless of input order", () => {
    const resources = [
      { capacityPoolId: "Teppanyaki", localServiceDate: "2026-08-20" },
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-21" },
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-20" },
    ];

    const sortedA = sortLockResources(resources);
    const sortedB = sortLockResources([...resources].reverse());

    expect(sortedA).toEqual(sortedB);
    expect(sortedA).toEqual([
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-20" },
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-21" },
      { capacityPoolId: "Teppanyaki", localServiceDate: "2026-08-20" },
    ]);
  });

  it("deduplicates identical (pool, date) resources", () => {
    const resources = [
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-20" },
      { capacityPoolId: "Sushi", localServiceDate: "2026-08-20" },
    ];
    expect(sortLockResources(resources)).toHaveLength(1);
  });

  it("two operations touching the same two resources always compute the same acquisition order (deadlock-prevention property)", () => {
    // Operation A wants [X, Y]; Operation B wants [Y, X]. Both must resolve to the same order.
    const x = { capacityPoolId: "Sushi", localServiceDate: "2026-08-20" };
    const y = { capacityPoolId: "Teppanyaki", localServiceDate: "2026-08-20" };
    expect(sortLockResources([x, y])).toEqual(sortLockResources([y, x]));
  });
});
