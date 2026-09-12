import { describe, it, expect, beforeAll } from "vitest";
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

/**
 * P1-B11A — regression coverage for api/server.ts, the real composition
 * root. It is deliberately NOT imported/executed here: doing so would
 * construct a real PrismaClient and (as of this phase) call the real,
 * now-loopback-bound app.listen(), binding an actual OS socket — neither
 * belongs in a test. Same "no DOM/browser runner, so plain source-text
 * assertion against the shipped file" posture this codebase already uses
 * for public/pilot.html (see tests/pilot/*.test.ts) — applied here to the
 * one other file in this codebase that is similarly awkward to execute
 * directly in a test.
 */
const serverTsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "server.ts");
const appTsPath = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "api", "app.ts");
let source: string;
let appSource: string;

beforeAll(() => {
  source = readFileSync(serverTsPath, "utf-8");
  appSource = readFileSync(appTsPath, "utf-8");
});

describe("api/server.ts — loopback binding (P1-B11A)", () => {
  it("imports resolveAppHost/startListening from serverConfig.js, not an inline reimplementation", () => {
    expect(source).toContain('import { resolveAppHost, startListening } from "./serverConfig.js";');
  });

  it("resolves the host before listening, and passes it (not a hardcoded literal) to the listener", () => {
    expect(source).toContain("const appHost = resolveAppHost();");
    expect(source).toContain("startListening(app, port, appHost);");
  });

  it("no longer calls app.listen directly with no host argument", () => {
    expect(source).not.toMatch(/app\.listen\(port,\s*\(\)/);
    expect(source).not.toMatch(/app\.listen\(port\)/);
  });

  it("never passes a hardcoded non-loopback address as an actual argument to startListening — only resolveAppHost()'s own return value", () => {
    expect(source).toMatch(/startListening\(app, port, appHost\);/);
    expect(source).not.toMatch(/startListening\([^)]*["'`]0\.0\.0\.0["'`]/);
  });

  it("the port default is unchanged: 3001, still read from PORT", () => {
    expect(source).toContain('const port = Number(process.env["PORT"] ?? 3001);');
  });
});

describe("api/server.ts — existing runtime wiring remains intact", () => {
  it("still constructs every existing AppDependencies block: capacity, floor, serviceSessions, communications, auth", () => {
    expect(source).toMatch(/capacity:\s*\{/);
    expect(source).toMatch(/floor:\s*\{/);
    expect(source).toMatch(/serviceSessions:\s*\{/);
    expect(source).toMatch(/communications:\s*\{/);
    expect(source).toMatch(/auth:\s*\{/);
  });

  it("still wires the same repository/persistence adapters, unchanged by this phase", () => {
    expect(source).toContain("repository: new PrismaReservationRepository(prisma)");
    expect(source).toContain("contactRepository: new PrismaContactRepository(prisma)");
    expect(source).toContain("floorRepository: new PrismaFloorRepository(prisma)");
  });

  it("cookieSecure/expectedOrigin (R1.2) are untouched — this phase changes only the network bind, never auth/cookie/CSRF behavior", () => {
    expect(source).toContain('cookieSecure: process.env["NODE_ENV"] === "production"');
    expect(source).toContain("expectedOrigin: appOrigin");
  });

  it("still constructs exactly one PrismaClient — no second connection introduced", () => {
    const matches = source.match(/new PrismaClient\(\)/g) || [];
    expect(matches).toHaveLength(1);
  });
});

describe("api/server.ts — R1.6-P2C-1 Service Session production wiring", () => {
  it("imports PrismaServiceSessionRepository", () => {
    expect(source).toContain(
      'import { PrismaServiceSessionRepository } from "../infrastructure/persistence/PrismaServiceSessionRepository.js";'
    );
  });

  it("supplies a real serviceSessions block using the SAME shared `prisma` client, not a new PrismaClient", () => {
    const match = source.match(/serviceSessions:\s*\{([\s\S]*?)\},/);
    expect(match).not.toBeNull();
    const block = match?.[1] ?? "";
    expect(block).toContain("serviceSessionRepository: new PrismaServiceSessionRepository(prisma)");
    expect(block).not.toMatch(/new PrismaClient\(\)/);
  });

  it("supplies transactionManager inside serviceSessions using the same PrismaTransactionManager(prisma) pattern as capacity", () => {
    const match = source.match(/serviceSessions:\s*\{([\s\S]*?)\},/);
    const block = match?.[1] ?? "";
    expect(block).toContain("transactionManager: new PrismaTransactionManager(prisma)");
  });

  it("still constructs exactly one PrismaClient overall — the serviceSessions block adds no second connection", () => {
    const matches = source.match(/new PrismaClient\(\)/g) || [];
    expect(matches).toHaveLength(1);
  });

  it("documents the deployment precondition: the service_sessions migration must be applied before this wiring is started against a database", () => {
    expect(source).toContain("20260910153637_add_service_session");
    expect(source).toMatch(/DEPLOYMENT PRECONDITION/);
  });

  it("api/app.ts constructs the real ServiceSessionService from the supplied serviceSessions block, not a no-op stand-in", () => {
    expect(appSource).toMatch(
      /new ServiceSessionService\(\s*deps\.serviceSessions\.serviceSessionRepository,\s*deps\.serviceSessions\.transactionManager,/
    );
  });

  it("api/app.ts passes the real serviceSessionRepository into both SeatingOrchestrator and AvailabilityOrchestrator — the session gate is not silently disabled in production", () => {
    expect(appSource).toMatch(/new SeatingOrchestrator\(\s*[\s\S]*?deps\.serviceSessions\?\.serviceSessionRepository/);
    expect(appSource).toMatch(/new AvailabilityOrchestrator\(\s*[\s\S]*?deps\.serviceSessions\?\.serviceSessionRepository/);
  });
});
