import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { PrismaReservationRepository } from "../../infrastructure/persistence/PrismaReservationRepository.js";
import { CriticalNoteStatus, CriticalNoteType } from "../../domain/value-objects/ReservationCriticalNote.js";
import { createTestPrismaClient } from "./support/testDatabaseSafety.js";
import { resetDatabase } from "./support/testHarness.js";

const prisma = createTestPrismaClient();
const repository = new PrismaReservationRepository(prisma);
const createdAt = new Date("2026-10-01T10:00:00.000Z");

async function seedReservation(id = "critical-note-reservation") {
  await prisma.reservation.create({
    data: {
      id,
      servicePeriodId: "dinner",
      contactId: "contact-legacy",
      contactName: "Critical Note Guest",
      status: "Proposed",
      reservationDate: new Date("2026-10-20T18:00:00.000Z"),
      partySize: 2,
      sourceCategory: "Telephone",
      preferredArea: "Sushi",
      communicationLanguage: "nl",
      createdBy: "staff-creator",
      createdAt,
      updatedAt: createdAt,
    },
  });
}

async function seedNote(overrides: Record<string, unknown> = {}) {
  return prisma.reservationCriticalNote.create({
    data: {
      id: "critical-note-1",
      reservationId: "critical-note-reservation",
      noteType: CriticalNoteType.Allergy,
      detail: "noten",
      status: CriticalNoteStatus.Active,
      createdByStaffUserId: "staff-creator",
      createdAt,
      updatedAt: createdAt,
      ...overrides,
    },
  });
}

beforeAll(async () => resetDatabase(prisma));
afterAll(async () => prisma.$disconnect());
beforeEach(async () => {
  await resetDatabase(prisma);
  await seedReservation();
});

describe("reservation_critical_notes migration constraints", () => {
  it("persists the authorized shape and repository ordering", async () => {
    await seedNote({ id: "note-b", createdAt: new Date("2026-10-01T10:01:00Z"), updatedAt: new Date("2026-10-01T10:01:00Z") });
    await seedNote({ id: "note-a", createdAt: new Date("2026-10-01T10:01:00Z"), updatedAt: new Date("2026-10-01T10:01:00Z"), detail: "schaaldieren" });
    const rows = await repository.findCriticalNotesByReservationId("critical-note-reservation");
    expect(rows.map((row) => row.id)).toEqual(["note-a", "note-b"]);
    expect(rows[0]).toMatchObject({ noteType: "Allergy", status: "Active", createdByStaffUserId: "staff-creator" });
  });

  it.each([
    ["unknown note type", { noteType: "Other" }],
    ["unknown status", { status: "Reopened" }],
    ["blank detail", { detail: "   " }],
    ["detail over 500 characters", { detail: "x".repeat(501) }],
    ["Active with resolvedAt", { resolvedAt: createdAt }],
    ["Resolved without resolvedAt", { status: CriticalNoteStatus.Resolved }],
  ])("rejects %s at the database boundary", async (_label, overrides) => {
    await expect(seedNote(overrides)).rejects.toThrow();
    expect(await prisma.reservationCriticalNote.count()).toBe(0);
  });

  it("enforces the Reservation FK with RESTRICT update/delete behavior", async () => {
    await seedNote();
    await expect(prisma.reservation.delete({ where: { id: "critical-note-reservation" } })).rejects.toThrow();
    await expect(prisma.reservation.update({ where: { id: "critical-note-reservation" }, data: { id: "renamed" } })).rejects.toThrow();
    expect(await prisma.reservationCriticalNote.count()).toBe(1);
  });

  it("returns Active-only batched reads without hiding Resolved notes from detail reads", async () => {
    await seedNote({ id: "active-note" });
    await seedNote({ id: "resolved-note", status: CriticalNoteStatus.Resolved, resolvedAt: createdAt });
    const active = await repository.findCriticalNotesByReservationIds(["critical-note-reservation"], { activeOnly: true });
    const all = await repository.findCriticalNotesByReservationId("critical-note-reservation");
    expect(active.map((note) => note.id)).toEqual(["active-note"]);
    expect(all.map((note) => note.id)).toEqual(["active-note", "resolved-note"]);
  });
});
