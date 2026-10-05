import { PrismaClient } from "@prisma/client";
import fs from "node:fs";

/**
 * R1.4-I7 — E2E Test-Data Cleanup Gate.
 *
 * NOT the same thing as tests/integration/support/testDatabaseSafety.ts.
 * That module authorizes a broad TRUNCATE against the fully disposable
 * `helix_reservations_test` database, used only by vitest's in-process
 * integration suite (no HTTP layer, no browser).
 *
 * This module instead authorizes narrowly-scoped, by-id DELETEs against
 * `helix_reservations_dev` — the same database the real running pilot
 * server and the Playwright browser suite already use (there is no
 * separate disposable database a real HTTP server + Chromium session
 * can safely be pointed at without restarting the shared dev server,
 * which R1.4-I7 was not authorized to do). Every E2E test run creates a
 * small, deterministically-tagged set of rows; this module deletes
 * EXACTLY those rows, by primary key, after independently re-verifying
 * both the database identity and that each targeted row's own content
 * still matches the expected synthetic-test-data tag — never a broad
 * WHERE, never TRUNCATE, never reachable from application/server code
 * (this file lives only under tests/e2e/support/ and is imported only
 * by Playwright spec files).
 */

const EXPECTED_DEV_DATABASE_NAME = "helix_reservations_dev";
const EXPECTED_LOOPBACK_HOSTS = new Set(["localhost", "127.0.0.1", "::1"]);
/** Every row this module is ever asked to delete must carry one of these tags somewhere in its identifying text. */
const E2E_SYNTHETIC_TAG_PATTERN = /^R1\.4-I[4-9]\b/;
const E2E_SYNTHETIC_STAFF_USER_ID = "su-resetcheck";

export class UnsafeE2ECleanupError extends Error {
  constructor(message: string) {
    super(`Refusing E2E test-data cleanup: ${message}`);
    this.name = "UnsafeE2ECleanupError";
  }
}

function loadDatabaseUrlFromEnvFile(): string {
  const content = fs.readFileSync(".env", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL")) continue;
    const idx = trimmed.indexOf("=");
    let value = trimmed.slice(idx + 1).trim();
    value = value.replace(/^"(.*)"$/, "$1");
    return value;
  }
  throw new UnsafeE2ECleanupError("DATABASE_URL not found in .env");
}

/**
 * Fail-closed gate. Must resolve without throwing immediately before any
 * DELETE in this module. Checks the connection string's own host/database
 * name (same static check pattern as testDatabaseSafety.ts's URL check)
 * AND independently re-queries the LIVE connection's current_database(),
 * so a client somehow constructed against a different URL than the one
 * on disk still fails closed.
 */
export async function assertSafeForE2ERowCleanup(prisma: PrismaClient): Promise<void> {
  const url = new URL(loadDatabaseUrlFromEnvFile());
  if (!EXPECTED_LOOPBACK_HOSTS.has(url.hostname)) {
    throw new UnsafeE2ECleanupError(`.env DATABASE_URL host "${url.hostname}" is not loopback.`);
  }
  const urlDatabaseName = url.pathname.replace(/^\//, "");
  if (urlDatabaseName !== EXPECTED_DEV_DATABASE_NAME) {
    throw new UnsafeE2ECleanupError(`.env DATABASE_URL database "${urlDatabaseName}" does not match the expected "${EXPECTED_DEV_DATABASE_NAME}".`);
  }

  const rows = await prisma.$queryRawUnsafe<{ current_database: string }[]>("SELECT current_database()");
  const liveName = rows[0]?.current_database;
  if (liveName !== EXPECTED_DEV_DATABASE_NAME) {
    throw new UnsafeE2ECleanupError(`live connection's current_database() "${String(liveName)}" does not match the expected "${EXPECTED_DEV_DATABASE_NAME}".`);
  }
}

/**
 * Deletes exactly the given ReservationCriticalNote rows, by id. Refuses
 * (throws, deletes nothing) if any id is missing, if any row's `detail`
 * does not carry the expected E2E synthetic tag, or if the number of
 * rows actually deleted does not exactly match the number requested.
 */
export async function deleteE2ECriticalNotes(prisma: PrismaClient, ids: readonly string[]): Promise<void> {
  if (ids.length === 0) return;
  await assertSafeForE2ERowCleanup(prisma);

  const rows = await prisma.reservationCriticalNote.findMany({ where: { id: { in: [...ids] } } });
  if (rows.length !== ids.length) {
    throw new UnsafeE2ECleanupError(`expected ${ids.length} critical-note row(s) by id, found ${rows.length}.`);
  }
  for (const row of rows) {
    if (!E2E_SYNTHETIC_TAG_PATTERN.test(row.detail)) {
      throw new UnsafeE2ECleanupError(`critical note ${row.id} detail ${JSON.stringify(row.detail)} does not match the expected E2E synthetic tag — refusing to delete.`);
    }
  }

  const result = await prisma.reservationCriticalNote.deleteMany({ where: { id: { in: [...ids] } } });
  if (result.count !== ids.length) {
    throw new UnsafeE2ECleanupError(`expected to delete ${ids.length} critical-note row(s), actually deleted ${result.count}.`);
  }
}

/**
 * Deletes exactly one E2E-created Reservation row and its own Contact
 * row (plus the Reservation's child rows that the ON DELETE RESTRICT FKs
 * on reservation_events/reservation_critical_notes/seating_assignments
 * require to be removed first — reservation_critical_notes is refused,
 * not deleted, if any are found: this helper is only for reservations
 * that never carried a critical note). Refuses if the reservation is
 * missing (no-op — the test never got far enough to create it), if its
 * contactName/createdBy don't match the expected E2E synthetic tags, if
 * it still carries any critical note, or if the Contact is still
 * referenced by any OTHER reservation.
 */
export async function deleteE2EReservationAndContact(prisma: PrismaClient, reservationId: string, contactId: string | undefined): Promise<void> {
  await assertSafeForE2ERowCleanup(prisma);

  const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
  if (!reservation) return; // nothing created — nothing to clean up

  if (!reservation.contactName || !E2E_SYNTHETIC_TAG_PATTERN.test(reservation.contactName)) {
    throw new UnsafeE2ECleanupError(`reservation ${reservationId} contactName ${JSON.stringify(reservation.contactName)} does not match the expected E2E synthetic tag — refusing to delete.`);
  }
  if (reservation.createdBy !== E2E_SYNTHETIC_STAFF_USER_ID) {
    throw new UnsafeE2ECleanupError(`reservation ${reservationId} createdBy ${JSON.stringify(reservation.createdBy)} is not the expected synthetic test staff user — refusing to delete.`);
  }

  const noteCount = await prisma.reservationCriticalNote.count({ where: { reservationId } });
  if (noteCount > 0) {
    throw new UnsafeE2ECleanupError(`reservation ${reservationId} still has ${noteCount} critical-note row(s) — refusing to delete (would violate the ON DELETE RESTRICT FK); this helper is not for reservations that carry critical notes.`);
  }

  await prisma.$executeRawUnsafe('DELETE FROM "seating_assignments" WHERE "reservation_id" = $1', reservationId);
  await prisma.$executeRawUnsafe('DELETE FROM "reservation_events" WHERE "reservationId" = $1', reservationId);
  await prisma.$executeRawUnsafe('DELETE FROM "applied_commands" WHERE "reservationId" = $1', reservationId);
  await prisma.$executeRawUnsafe('DELETE FROM "capacity_commitments" WHERE "reservation_id" = $1', reservationId);

  const deletedReservations = await prisma.reservation.deleteMany({ where: { id: reservationId } });
  if (deletedReservations.count !== 1) {
    throw new UnsafeE2ECleanupError(`expected to delete exactly 1 reservation row for ${reservationId}, deleted ${deletedReservations.count}.`);
  }

  if (!contactId) return;
  const contact = await prisma.contact.findUnique({ where: { id: contactId } });
  if (!contact) return;
  if (!contact.displayName.startsWith("R1.4-I4 Browser T08")) {
    throw new UnsafeE2ECleanupError(`contact ${contactId} displayName ${JSON.stringify(contact.displayName)} does not match the expected E2E synthetic tag — refusing to delete.`);
  }
  const stillReferenced = await prisma.reservation.count({ where: { contactId } });
  if (stillReferenced > 0) {
    throw new UnsafeE2ECleanupError(`contact ${contactId} is still referenced by ${stillReferenced} other reservation row(s) — refusing to delete.`);
  }
  const deletedContacts = await prisma.contact.deleteMany({ where: { id: contactId } });
  if (deletedContacts.count !== 1) {
    throw new UnsafeE2ECleanupError(`expected to delete exactly 1 contact row for ${contactId}, deleted ${deletedContacts.count}.`);
  }
}
