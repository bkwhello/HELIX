import { describe, it, expect, vi } from "vitest";
import { resolveAppHost, startListening, Listenable } from "../../api/serverConfig.js";

/**
 * P1-B11A — unit coverage for the loopback-binding config, extracted into
 * its own module specifically so it's testable without importing
 * api/server.ts itself (which constructs a real PrismaClient and, before
 * this phase, called a real app.listen() at module load time — neither
 * side effect belongs in a test).
 */
describe("resolveAppHost", () => {
  it("missing (unset) → 127.0.0.1", () => {
    expect(resolveAppHost({})).toBe("127.0.0.1");
  });

  it("empty string → 127.0.0.1 (must never bypass the loopback default)", () => {
    expect(resolveAppHost({ APP_HOST: "" })).toBe("127.0.0.1");
  });

  it("whitespace-only string → 127.0.0.1", () => {
    expect(resolveAppHost({ APP_HOST: "   " })).toBe("127.0.0.1");
    expect(resolveAppHost({ APP_HOST: "\t\n " })).toBe("127.0.0.1");
  });

  it("a padded explicit value is trimmed and honored", () => {
    expect(resolveAppHost({ APP_HOST: "  192.168.1.50  " })).toBe("192.168.1.50");
  });

  it("0.0.0.0 is honored only when explicitly configured, never chosen on its own", () => {
    expect(resolveAppHost({ APP_HOST: "0.0.0.0" })).toBe("0.0.0.0");
    expect(resolveAppHost({})).not.toBe("0.0.0.0");
  });

  it("other intentional non-loopback values remain configurable and are never silently rewritten", () => {
    expect(resolveAppHost({ APP_HOST: "::" })).toBe("::");
    expect(resolveAppHost({ APP_HOST: "localhost" })).toBe("localhost");
    expect(resolveAppHost({ APP_HOST: "10.0.0.5" })).toBe("10.0.0.5");
  });
});

describe("startListening", () => {
  it("passes the exact resolved port and host through to the listener", () => {
    const listen = vi.fn();
    const fakeApp: Listenable = { listen };
    startListening(fakeApp, 3001, "127.0.0.1");
    expect(listen).toHaveBeenCalledTimes(1);
    expect(listen).toHaveBeenCalledWith(3001, "127.0.0.1", expect.any(Function));
  });

  it("passes a configured non-default port/host pair through unchanged", () => {
    const listen = vi.fn();
    const fakeApp: Listenable = { listen };
    startListening(fakeApp, 8080, "0.0.0.0");
    expect(listen).toHaveBeenCalledWith(8080, "0.0.0.0", expect.any(Function));
  });

  it("never binds a real socket itself — it only calls whatever .listen() it was given", () => {
    // No real Express/http server is constructed anywhere in this file;
    // `fakeApp` above is a plain object literal with a spy method.
    const listen = vi.fn();
    startListening({ listen }, 3001, "127.0.0.1");
    expect(listen.mock.calls[0]?.[2]).toBeTypeOf("function");
  });

  it("receives resolveAppHost's exact resolved (trimmed) value end to end, not a re-derived one", () => {
    const listen = vi.fn();
    startListening({ listen }, 3001, resolveAppHost({ APP_HOST: "  10.0.0.9  " }));
    expect(listen).toHaveBeenCalledWith(3001, "10.0.0.9", expect.any(Function));
  });

  it("receives the loopback default end to end when APP_HOST is blank", () => {
    const listen = vi.fn();
    startListening({ listen }, 3001, resolveAppHost({ APP_HOST: "  " }));
    expect(listen).toHaveBeenCalledWith(3001, "127.0.0.1", expect.any(Function));
  });
});
