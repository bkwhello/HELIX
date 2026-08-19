/**
 * R1.4 — shared helpers for locating and safely invoking PostgreSQL
 * client tools (`pg_dump`, `pg_restore`, `psql`) from Node, and for
 * extracting a database identifier from a connection string WITHOUT ever
 * exposing the credential embedded in it (§11 — manifests/logs must
 * never contain secrets).
 */
import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

export interface RunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

/**
 * Locates the directory containing the PostgreSQL client binaries.
 * Override with PG_BIN_DIR for any environment where they are not
 * already on PATH. Falls back to the well-known local Windows install
 * path used by this project's own local PostgreSQL setup, then to bare
 * command names (i.e. "already on PATH") as a last resort — this last
 * fallback is what a future, non-Windows production host would use.
 */
export function resolvePgBinDir(): string | null {
  const override = process.env["PG_BIN_DIR"];
  if (override && existsSync(override)) return override;

  const commonWindowsCandidates = [
    "C:\\Program Files\\PostgreSQL\\17\\bin",
    "C:\\Program Files\\PostgreSQL\\16\\bin",
    "C:\\Program Files\\PostgreSQL\\15\\bin",
  ];
  for (const candidate of commonWindowsCandidates) {
    if (existsSync(candidate)) return candidate;
  }
  return null; // assume PATH already resolves pg_dump/pg_restore/psql
}

function toolPath(tool: "pg_dump" | "pg_restore" | "psql"): string {
  const dir = resolvePgBinDir();
  if (!dir) return tool;
  const exe = process.platform === "win32" ? `${tool}.exe` : tool;
  return join(dir, exe);
}

/**
 * Runs a PostgreSQL client tool as a child process. The connection
 * password is passed via the PGPASSWORD environment variable of the
 * child process only (never as a CLI argument, which would be visible
 * in process listings) and is never included in the returned stdout/
 * stderr capture path used for manifests or logs — callers are
 * responsible for not logging `env` themselves.
 */
export function runPgTool(
  tool: "pg_dump" | "pg_restore" | "psql",
  args: readonly string[],
  options: { readonly password?: string; readonly timeoutMs?: number } = {}
): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(toolPath(tool), args, {
      env: { ...process.env, ...(options.password ? { PGPASSWORD: options.password } : {}) },
      windowsHide: true,
    });

    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk: Buffer) => (stdout += chunk.toString("utf8")));
    child.stderr.on("data", (chunk: Buffer) => (stderr += chunk.toString("utf8")));

    const timeout = options.timeoutMs
      ? setTimeout(() => {
          child.kill();
          reject(new Error(`${tool} timed out after ${options.timeoutMs}ms`));
        }, options.timeoutMs)
      : null;

    child.on("error", (err) => {
      if (timeout) clearTimeout(timeout);
      reject(err);
    });
    child.on("close", (code) => {
      if (timeout) clearTimeout(timeout);
      resolve({ exitCode: code ?? -1, stdout, stderr });
    });
  });
}

export interface ParsedConnection {
  readonly host: string;
  readonly port: string;
  readonly database: string;
  readonly user: string;
  readonly password: string;
}

/** Parses a postgresql:// URL. Never logs or returns the URL string itself. */
export function parseConnectionString(url: string): ParsedConnection {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parsed.port || "5432",
    database: parsed.pathname.replace(/^\//, ""),
    user: decodeURIComponent(parsed.username),
    password: decodeURIComponent(parsed.password),
  };
}

/** Safe-to-log identifier: host, port, database — deliberately never the credential. */
export function safeDatabaseIdentifier(conn: ParsedConnection): string {
  return `${conn.host}:${conn.port}/${conn.database}`;
}
