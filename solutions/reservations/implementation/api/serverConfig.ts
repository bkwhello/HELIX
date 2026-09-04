/**
 * P1-B11A — loopback-safe server binding. Extracted into its own tiny,
 * side-effect-free module (rather than inlined in api/server.ts) so it
 * can be unit-tested directly: server.ts itself cannot be imported by a
 * test without also executing its top-level `PrismaClient()` construction
 * and (previously) an immediate real `app.listen()` call that binds a
 * real OS socket — neither of which a test should ever trigger.
 */

/**
 * Resolves the host `app.listen` binds to. Defaults to the IPv4 loopback
 * address, matching APP_ORIGIN's own existing `process.env[...] ?? default`
 * convention (api/server.ts) — never all-interfaces by default. A
 * non-loopback value (e.g. "0.0.0.0", "::", "localhost", or a concrete
 * interface address, for a future real deployment environment) must be
 * set explicitly via APP_HOST; nothing here ever chooses one on its own.
 *
 * Missing, empty, or whitespace-only is treated identically to unset —
 * `APP_HOST=""` must never bypass the loopback default or produce
 * ambiguous listener behavior (an empty string passed to `app.listen`
 * as the host argument). No further hostname validation is performed
 * beyond trimming; an explicit non-empty value (however unusual) is
 * honored as given.
 */
export function resolveAppHost(env: NodeJS.ProcessEnv = process.env): string {
  const trimmed = env["APP_HOST"]?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : "127.0.0.1";
}

/** The minimal shape this needs from `app` — real Express satisfies it structurally, and a test can pass a plain stub. */
export interface Listenable {
  listen(port: number, host: string, callback?: () => void): unknown;
}

/** Thin wrapper around `app.listen` so the exact (port, host) pair actually passed to the listener is independently testable, without needing a real Express app or a real bound socket. */
export function startListening(app: Listenable, port: number, host: string): void {
  app.listen(port, host, () => {
    // eslint-disable-next-line no-console
    console.log(`CAP-D01.01 Reservation Management API listening on http://${host}:${port}`);
  });
}
