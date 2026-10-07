/**
 * R1.5-P7-D — removes ONE disposable test reservation (and only its own
 * dependent rows) from the UX database, e.g. the isolation-proof write in
 * tests/e2e-ux. Same UX gates as teardown (URL + live identity + sentinel),
 * plus: the reservation's contactName must start with "UX-DISPOSABLE-", so a
 * seeded UX-SAT fixture can never be removed this way.
 */
import { PrismaClient } from "@prisma/client";
import { assertProvisionedUxDatabase, assertUxDatabaseUrl, createPrismaUxIdentityReader, UxSafetyError } from "./uxSafety.js";

export const UX_DISPOSABLE_PREFIX = "UX-DISPOSABLE-";

export async function deleteUxDisposableReservation(databaseUrl: string, reservationId: string): Promise<void> {
  assertUxDatabaseUrl(databaseUrl);
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertProvisionedUxDatabase(createPrismaUxIdentityReader(prisma));
    const reservation = await prisma.reservation.findUnique({ where: { id: reservationId } });
    if (!reservation) return;
    if (!reservation.contactName?.startsWith(UX_DISPOSABLE_PREFIX)) throw new UxSafetyError(`reservation ${reservationId} is not a ${UX_DISPOSABLE_PREFIX}* record.`);
    await prisma.$transaction(async (tx) => {
      await tx.reservationCriticalNote.deleteMany({ where: { reservationId } });
      await tx.$executeRawUnsafe('DELETE FROM "seating_assignment_resources" WHERE "assignment_id" IN (SELECT "id" FROM "seating_assignments" WHERE "reservation_id" = $1)', reservationId);
      await tx.seatingAssignment.deleteMany({ where: { reservationId } });
      await tx.reservationEvent.deleteMany({ where: { reservationId } });
      await tx.appliedCommand.deleteMany({ where: { reservationId } });
      await tx.capacityCommitment.deleteMany({ where: { reservationId } });
      await tx.guestManagementCredential.deleteMany({ where: { reservationId } });
      await tx.communicationMessage.deleteMany({ where: { reservationId } });
      const deleted = await tx.reservation.deleteMany({ where: { id: reservationId } });
      if (deleted.count !== 1) throw new Error(`expected to delete 1 reservation, deleted ${deleted.count}`);
      const stillReferenced = await tx.reservation.count({ where: { contactId: reservation.contactId } });
      const contact = await tx.contact.findUnique({ where: { id: reservation.contactId } });
      if (contact && stillReferenced === 0 && contact.displayName.startsWith(UX_DISPOSABLE_PREFIX)) await tx.contact.delete({ where: { id: contact.id } });
    });
  } finally {
    await prisma.$disconnect();
  }
}
