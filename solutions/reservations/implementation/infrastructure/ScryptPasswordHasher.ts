import { randomBytes, scrypt, timingSafeEqual, ScryptOptions } from "node:crypto";
import { promisify } from "node:util";
import { PasswordHasher } from "../application/ports/PasswordHasher.js";

// `promisify` resolves node:crypto's `scrypt` to its 3-arg (no options)
// overload by default — explicit typing selects the 4-arg (with options)
// overload we actually need for custom N/r/p cost parameters.
const scryptAsync = promisify(scrypt) as (password: string, salt: Buffer, keylen: number, options: ScryptOptions) => Promise<Buffer>;

/**
 * R1.2 — Identity & Access. scrypt (Node's built-in `node:crypto`
 * implementation) rather than adding bcrypt/argon2 as a dependency:
 * scrypt is OWASP-listed as an acceptable memory-hard password-hashing
 * KDF alongside Argon2id and bcrypt, and Node ships an audited
 * implementation in its standard library — no new dependency, no native
 * build toolchain, no Windows-compilation risk for this specific
 * environment. Not a custom cryptographic construction: this calls
 * Node's own scrypt directly, per the assignment's "do not invent custom
 * cryptography."
 *
 * Stored format: `scrypt$N$r$p$saltHex$hashHex` — the KDF parameters
 * travel with the hash, so a future cost-parameter increase never
 * invalidates existing stored hashes; verify() always uses whatever
 * parameters are embedded in the stored value, not today's constants.
 */
const N = 16384; // 2^14 — Node's own documented example value
const R = 8;
const P = 1;
const KEY_LENGTH = 64;
const SALT_LENGTH = 16;

export class ScryptPasswordHasher implements PasswordHasher {
  async hash(plaintextPassword: string): Promise<string> {
    const salt = randomBytes(SALT_LENGTH);
    const derived = (await scryptAsync(plaintextPassword, salt, KEY_LENGTH, { N, r: R, p: P })) as Buffer;
    return `scrypt$${N}$${R}$${P}$${salt.toString("hex")}$${derived.toString("hex")}`;
  }

  async verify(plaintextPassword: string, storedHash: string): Promise<boolean> {
    const parts = storedHash.split("$");
    if (parts.length !== 6 || parts[0] !== "scrypt") return false;
    const [, nStr, rStr, pStr, saltHex, hashHex] = parts;
    const n = Number(nStr);
    const r = Number(rStr);
    const p = Number(pStr);
    if (!Number.isInteger(n) || !Number.isInteger(r) || !Number.isInteger(p)) return false;

    const salt = Buffer.from(saltHex ?? "", "hex");
    const expected = Buffer.from(hashHex ?? "", "hex");
    if (salt.length === 0 || expected.length === 0) return false;

    const derived = (await scryptAsync(plaintextPassword, salt, expected.length, { N: n, r, p })) as Buffer;
    // timingSafeEqual requires equal-length buffers; a length mismatch is
    // itself just "not a match," not an error condition worth throwing over.
    if (derived.length !== expected.length) return false;
    return timingSafeEqual(derived, expected);
  }
}
