import { ContactReader } from "../application/ports/ContactReader.js";

/**
 * PLACEHOLDER — Contact Management does not exist as a capability yet.
 * Always reports the contact as existing so the CreateReservation
 * vertical slice can be wired and tested end-to-end today. This is not
 * validation and must not be mistaken for it: replace with a real
 * adapter (e.g. backed by Contact Management's own repository) once
 * that capability is built. Do not add speculative contact-storage logic
 * here in the meantime.
 */
export class UnvalidatedContactReader implements ContactReader {
  async exists(): Promise<boolean> {
    return true;
  }
}
