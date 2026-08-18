/**
 * R1.2 — Identity & Access. Generates the raw, high-entropy opaque
 * session token handed to the client cookie. Deliberately a separate
 * port from IdGenerator (used for entity ids, which have no secrecy
 * requirement) — a session token's whole security property depends on
 * being unguessable, which deserves its own explicit, intention-revealing
 * type rather than reusing a general-purpose id generator.
 */
export interface SessionTokenGenerator {
  generate(): string;
}
