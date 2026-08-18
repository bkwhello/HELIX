/**
 * R1.2 — Identity & Access. One-way password hashing, kept behind a port
 * so the concrete KDF is an infrastructure choice — see
 * infrastructure/ScryptPasswordHasher.ts for which one and why.
 */
export interface PasswordHasher {
  hash(plaintextPassword: string): Promise<string>;
  verify(plaintextPassword: string, storedHash: string): Promise<boolean>;
}
