import { createHash } from "node:crypto";

/**
 * R1.2 — Identity & Access. SHA-256, not the slow/adaptive password KDF
 * (ScryptPasswordHasher): a session token is already a high-entropy
 * random value (RandomSessionTokenGenerator, 256 bits), not a low-entropy
 * human-chosen secret, so it needs a fast, deterministic hash suitable
 * for exact-match lookup — not one deliberately slowed down to resist
 * offline brute-force of a guessable input. Only the hash is ever
 * persisted (SessionRepository); the raw token lives only in the
 * client's cookie and this request's memory.
 */
export function hashSessionToken(rawToken: string): string {
  return createHash("sha256").update(rawToken, "utf8").digest("hex");
}
