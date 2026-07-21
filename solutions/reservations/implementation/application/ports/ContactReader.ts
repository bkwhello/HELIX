/**
 * CAP-D01.01-R07 — Exactly One Primary Reservation Contact.
 *
 * Reservation Management does not own contact data — this is a
 * cross-capability query into (the future) Contact Management. See
 * infrastructure/UnvalidatedContactReader.ts for the current placeholder.
 */
export interface ContactReader {
  exists(contactId: string): Promise<boolean>;
}
