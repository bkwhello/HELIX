import { describe, it, expect } from "vitest";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";

describe("ScryptPasswordHasher", () => {
  it("verifies a password against its own hash", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("correct horse battery staple");
    expect(await hasher.verify("correct horse battery staple", hash)).toBe(true);
  });

  it("rejects an incorrect password", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("correct horse battery staple");
    expect(await hasher.verify("wrong password", hash)).toBe(false);
  });

  it("never stores the plaintext password in the hash output", async () => {
    const hasher = new ScryptPasswordHasher();
    const password = "correct horse battery staple";
    const hash = await hasher.hash(password);
    expect(hash).not.toContain(password);
  });

  it("produces a different hash for the same password on two separate calls (random per-call salt)", async () => {
    const hasher = new ScryptPasswordHasher();
    const hashA = await hasher.hash("same password");
    const hashB = await hasher.hash("same password");
    expect(hashA).not.toBe(hashB);
    // Both must still independently verify.
    expect(await hasher.verify("same password", hashA)).toBe(true);
    expect(await hasher.verify("same password", hashB)).toBe(true);
  });

  it("embeds the KDF parameters in the stored hash, so verify() does not depend on today's constants", async () => {
    const hasher = new ScryptPasswordHasher();
    const hash = await hasher.hash("a password");
    expect(hash.startsWith("scrypt$")).toBe(true);
    expect(hash.split("$")).toHaveLength(6);
  });

  it("rejects a malformed stored hash instead of throwing", async () => {
    const hasher = new ScryptPasswordHasher();
    expect(await hasher.verify("anything", "not-a-real-hash")).toBe(false);
    expect(await hasher.verify("anything", "")).toBe(false);
  });
});
