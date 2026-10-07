import { test, expect, APIRequestContext, request as playwrightRequest } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import fs from "node:fs";
import { deleteE2EReservationAndContact, UnsafeE2ECleanupError } from "./support/e2eCleanup.js";

/**
 * R1.5-P7-B2 — regression for the E2E cleanup gap: every real reservation
 * create issues a guest_management_credentials row, which
 * deleteE2EReservationAndContact() used to leave behind as an orphan.
 *
 * Runs against the real dev server/database (the only place the cleanup
 * gate permits). Creates ONE tagged synthetic reservation through the real
 * API as the synthetic E2E user, cleans it up through the normal helper,
 * and proves every other credential (linked AND pre-existing historical
 * orphans) and the human PILOT-SYNTHETIC evidence are untouched.
 */
function loadDatabaseUrl(): string {
  const content = fs.readFileSync(".env", "utf8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed.startsWith("DATABASE_URL")) continue;
    const idx = trimmed.indexOf("=");
    return trimmed.slice(idx + 1).trim().replace(/^"(.*)"$/, "$1");
  }
  throw new Error("DATABASE_URL not found in .env");
}

const prisma = new PrismaClient({ datasourceUrl: loadDatabaseUrl() });
const RECEPTION_USERNAME = "resetcheck";
const RECEPTION_PASSWORD = process.env["HELIX_PILOT_TEST_PASSWORD"];
// Adopted, read-only R1.4-I2 fixture: carries a guest credential, but its
// "R1.4-I2" tag is outside the cleanup gate's accepted R1.4-I[4-9]/R1.5-P<n>
// scope — the out-of-scope refusal target. Never a human PILOT-SYNTHETIC row.
const OUT_OF_SCOPE_FIXTURE_NAME = "R1.4-I2 pilot H01";

async function credentialSnapshot() {
  const rows = await prisma.guestManagementCredential.findMany({ orderBy: { id: "asc" } });
  return rows.map((r) => ({ id: r.id, reservationId: r.reservationId, tokenHash: r.tokenHash, expiresAt: r.expiresAt.toISOString(), revokedAt: r.revokedAt?.toISOString() ?? null }));
}

async function humanPilotSnapshot() {
  const rows = await prisma.reservation.findMany({
    where: { OR: [{ contactName: { startsWith: "PILOT-SYNTHETIC" } }, { contactName: { startsWith: "pilot-synthetic" } }] },
    orderBy: { id: "asc" },
    select: { id: true, contactName: true, status: true, version: true, updatedAt: true },
  });
  const ids = rows.map((r) => r.id);
  const creds = await prisma.guestManagementCredential.findMany({ where: { reservationId: { in: ids } }, orderBy: { id: "asc" } });
  return JSON.stringify({ rows, creds });
}

test.describe.serial("R1.5-P7-B2 — E2E cleanup removes the reservation's own guest credential, nothing else", () => {
  let api: APIRequestContext;

  test.beforeAll(async () => {
    test.skip(!RECEPTION_PASSWORD, "HELIX_PILOT_TEST_PASSWORD not set in environment");
    api = await playwrightRequest.newContext({ baseURL: "http://localhost:3001", extraHTTPHeaders: { "x-helix-client": "1" } });
    const login = await api.post("/auth/login", { data: { username: RECEPTION_USERNAME, password: RECEPTION_PASSWORD } });
    expect(login.status()).toBe(200);
    expect((await login.json()).staffUser.username).toBe(RECEPTION_USERNAME);
  });

  test.afterAll(async () => {
    await api?.dispose();
    await prisma.$disconnect();
  });

  test("cleanup deletes the created reservation, its contact, AND its guest credential — every other credential is identical", async () => {
    const credentialsBefore = await credentialSnapshot();
    const humanBefore = await humanPilotSnapshot();
    const reservationCountBefore = await prisma.reservation.count();
    const contactCountBefore = await prisma.contact.count();

    const guestName = `R1.5-P7-B2 cleanup ${Date.now()}`;
    let reservationId: string | undefined;
    let contactId: string | undefined;
    try {
      const res = await api.post("/availability/reservations", {
        data: {
          commandId: `r15-p7b2-${Date.now()}`,
          servicePeriodId: "dinner",
          contactSelection: { type: "CreateNewContact", displayName: guestName, phone: "0611110001" },
          reservationDate: "2026-12-19T18:00:00.000Z",
          partySize: 2,
          source: { category: "Telephone" },
          preferredArea: "Sushi",
        },
      });
      expect(res.status(), await res.text()).toBe(201);
      reservationId = (await res.json()).reservationId as string;
      contactId = (await prisma.reservation.findUniqueOrThrow({ where: { id: reservationId } })).contactId;

      // The real create issued exactly one credential for this reservation.
      expect(await prisma.guestManagementCredential.count({ where: { reservationId } })).toBe(1);
    } finally {
      if (reservationId) await deleteE2EReservationAndContact(prisma, reservationId, contactId);
    }

    // Reservation, its own dependents, and its credential are gone.
    expect(await prisma.reservation.count({ where: { id: reservationId! } })).toBe(0);
    expect(await prisma.guestManagementCredential.count({ where: { reservationId: reservationId! } })).toBe(0);
    expect(await prisma.contact.count({ where: { id: contactId! } })).toBe(0);
    expect(await prisma.reservationEvent.count({ where: { reservationId: reservationId! } })).toBe(0);
    expect(await prisma.capacityCommitment.count({ where: { reservationId: reservationId! } })).toBe(0);

    // Nothing else changed: every other credential (linked + historical orphans) is identical.
    expect(await credentialSnapshot()).toEqual(credentialsBefore);
    expect(await prisma.reservation.count()).toBe(reservationCountBefore);
    expect(await prisma.contact.count()).toBe(contactCountBefore);
    expect(await humanPilotSnapshot()).toBe(humanBefore);
  });

  test("an out-of-scope reservation is refused BEFORE any delete — its reservation and guest credential stay identical", async () => {
    const target = await prisma.reservation.findFirstOrThrow({ where: { contactName: OUT_OF_SCOPE_FIXTURE_NAME } });
    // Preconditions that make this a meaningful, safe refusal probe.
    expect(target.contactName!.startsWith("PILOT-SYNTHETIC")).toBe(false);
    expect(/^R1\.(4-I[4-9]|5-P\d+)\b/.test(target.contactName!)).toBe(false);
    const targetCredentialsBefore = await prisma.guestManagementCredential.findMany({ where: { reservationId: target.id }, orderBy: { id: "asc" } });
    expect(targetCredentialsBefore.length).toBeGreaterThan(0);
    const credentialsBefore = await credentialSnapshot();
    const targetBefore = JSON.stringify(target);

    await expect(deleteE2EReservationAndContact(prisma, target.id, target.contactId)).rejects.toBeInstanceOf(UnsafeE2ECleanupError);

    expect(JSON.stringify(await prisma.reservation.findUniqueOrThrow({ where: { id: target.id } }))).toBe(targetBefore);
    expect(await prisma.guestManagementCredential.findMany({ where: { reservationId: target.id }, orderBy: { id: "asc" } })).toEqual(targetCredentialsBefore);
    expect(await credentialSnapshot()).toEqual(credentialsBefore);
  });
});
