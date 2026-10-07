import { describe, expect, it } from "vitest";
import {
  assertConnectedToUxDatabase,
  assertProvisionedUxDatabase,
  assertUxBaseUrl,
  assertUxDatabaseUrl,
  assertUxSeedable,
  UxIdentityReader,
  UxSafetyError,
  UxSentinelRow,
} from "../../ops/ux/uxSafety.js";
import { teardownUx } from "../../ops/ux/teardownUx.js";
import { seedUxSaturday } from "../../ops/ux/seedUxSaturday.js";
import { setUxReceptionPassword } from "../../ops/ux/setUxReceptionPassword.js";
import { deleteUxDisposableReservation } from "../../ops/ux/uxDisposable.js";

/**
 * R1.5-P7-D — the UX environment's fail-closed gates. Pure: fake identity
 * readers and static URLs only — no database is contacted, so nothing here
 * can reach helix_reservations_dev (or any database).
 */
const DEV_URL = "postgresql://u:p@localhost:5433/helix_reservations_dev?schema=public";
const UX_URL = "postgresql://u:p@localhost:5433/helix_reservations_ux?schema=public";
const freshSentinel: UxSentinelRow = { provisionedAt: new Date("2026-10-07T17:00:00Z"), seedingStartedAt: null, seededAt: null, datasetDate: null, datasetVersion: null };

function reader(db: string, sentinel: UxSentinelRow | null): UxIdentityReader & { calls: string[] } {
  const calls: string[] = [];
  return {
    calls,
    async currentDatabase() {
      calls.push("currentDatabase");
      return db;
    },
    async readSentinel() {
      calls.push("readSentinel");
      return sentinel;
    },
  };
}

describe("static URL gates", () => {
  it("refuses the dev, test and recovery databases and any non-UX name", () => {
    for (const name of ["helix_reservations_dev", "helix_reservations_test", "helix_reservations_recovery", "helix_reservations_ux_copy", "postgres"]) {
      expect(() => assertUxDatabaseUrl(`postgresql://u:p@localhost:5433/${name}`)).toThrow(UxSafetyError);
    }
  });
  it("refuses a non-loopback host or another port (e.g. the 5432 service)", () => {
    expect(() => assertUxDatabaseUrl("postgresql://u:p@db.example.com:5433/helix_reservations_ux")).toThrow(/not loopback/);
    expect(() => assertUxDatabaseUrl("postgresql://u:p@localhost:5432/helix_reservations_ux")).toThrow(/not the HELIX cluster port/);
    expect(() => assertUxDatabaseUrl(undefined)).toThrow(UxSafetyError);
  });
  it("accepts exactly loopback:5433/helix_reservations_ux", () => {
    expect(assertUxDatabaseUrl(UX_URL)).toBe(UX_URL);
  });
  it("UX base URL must be loopback port 3002 — never the dev app on 3001", () => {
    expect(() => assertUxBaseUrl("http://127.0.0.1:3001")).toThrow(/DEV app port/);
    expect(() => assertUxBaseUrl("http://example.com:3002")).toThrow(/not loopback/);
    expect(assertUxBaseUrl("http://127.0.0.1:3002/")).toBe("http://127.0.0.1:3002");
  });
});

describe("live identity + sentinel gates (fake readers)", () => {
  it("seed gate refuses a live dev connection before even reading a sentinel", async () => {
    const dev = reader("helix_reservations_dev", freshSentinel);
    await expect(assertUxSeedable(dev)).rejects.toThrow(/current_database\(\) = "helix_reservations_dev"/);
    expect(dev.calls).toEqual(["currentDatabase"]);
  });
  it("seed gate refuses a UX database whose sentinel is missing (never provisioned)", async () => {
    await expect(assertUxSeedable(reader("helix_reservations_ux", null))).rejects.toThrow(/sentinel is missing/);
  });
  it("seed gate refuses a repeat seed (already seeded) and a partial earlier seed", async () => {
    await expect(assertUxSeedable(reader("helix_reservations_ux", { ...freshSentinel, seedingStartedAt: new Date(), seededAt: new Date(), datasetDate: "2026-10-10" }))).rejects.toThrow(/already seeded/);
    await expect(assertUxSeedable(reader("helix_reservations_ux", { ...freshSentinel, seedingStartedAt: new Date() }))).rejects.toThrow(/did not complete/);
  });
  it("seed gate passes only for the provisioned, never-seeded UX database", async () => {
    await expect(assertUxSeedable(reader("helix_reservations_ux", freshSentinel))).resolves.toEqual(freshSentinel);
  });
  it("teardown/destructive gate requires BOTH the exact UX identity and the sentinel", async () => {
    await expect(assertProvisionedUxDatabase(reader("helix_reservations_dev", freshSentinel))).rejects.toThrow(UxSafetyError);
    await expect(assertProvisionedUxDatabase(reader("helix_reservations_ux", null))).rejects.toThrow(/sentinel is missing/);
    await expect(assertConnectedToUxDatabase(reader("helix_reservations_test", null))).rejects.toThrow(UxSafetyError);
  });
});

describe("every UX tool refuses the dev URL before connecting", () => {
  it("teardown, seed, set-password and disposable cleanup all refuse helix_reservations_dev", async () => {
    await expect(teardownUx(DEV_URL)).rejects.toThrow(/is not exactly "helix_reservations_ux"/);
    await expect(seedUxSaturday({ databaseUrl: DEV_URL, baseUrl: "http://127.0.0.1:3002", password: "x".repeat(20) })).rejects.toThrow(/is not exactly "helix_reservations_ux"/);
    await expect(setUxReceptionPassword(DEV_URL, "x".repeat(20))).rejects.toThrow(/is not exactly "helix_reservations_ux"/);
    await expect(deleteUxDisposableReservation(DEV_URL, "any-id")).rejects.toThrow(/is not exactly "helix_reservations_ux"/);
  });
  it("seed refuses a dev-app base URL and a weak/missing password before connecting", async () => {
    await expect(seedUxSaturday({ databaseUrl: UX_URL, baseUrl: "http://127.0.0.1:3001", password: "x".repeat(20) })).rejects.toThrow(/DEV app port/);
    await expect(seedUxSaturday({ databaseUrl: UX_URL, baseUrl: "http://127.0.0.1:3002", password: "short" })).rejects.toThrow(/HELIX_UX_RECEPTION_PASSWORD/);
  });
});
