import { randomBytes } from "node:crypto";
import { SessionTokenGenerator } from "../application/ports/SessionTokenGenerator.js";

/** 256 bits of entropy, base64url-encoded (URL/cookie-safe, no padding characters to worry about). */
export class RandomSessionTokenGenerator implements SessionTokenGenerator {
  generate(): string {
    return randomBytes(32).toString("base64url");
  }
}
