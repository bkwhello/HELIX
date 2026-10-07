/**
 * R1.5-P7-D — seeds the isolated Reception UX database with the fictional
 * busy-Saturday dataset (ops/ux/uxSaturdayPlan.ts). Run via `npm run ux:seed`
 * (loads .env.ux) while the UX app instance runs on 127.0.0.1:3002.
 *
 * Refuses — before ANY write — unless ALL of:
 *   - DATABASE_URL is loopback:5433/helix_reservations_ux (static check);
 *   - the live connection reports current_database() = helix_reservations_ux;
 *   - the `_ux_dataset_sentinel` (created only by ux:provision) exists;
 *   - the dataset was never seeded and no earlier seed was left partial;
 *   - the target app URL is loopback port 3002 (never the dev app on 3001);
 *   - the fixture plan passes validatePlan().
 * The sentinel is then claimed atomically (seeding_started_at), so a second
 * run can never duplicate the dataset; reseeding requires ux:teardown.
 *
 * Reference data (floor, floorplan, service session, the single synthetic
 * `ux-reception` staff account) is written in-process through the existing
 * seed/bootstrap/application code against THIS database only. Every
 * reservation, confirmation, critical note, seating action, arrival and
 * cancellation goes through the REAL HTTP API as `ux-reception`, so capacity,
 * overlap, seatability, floorplan-membership and service-session rules are
 * enforced by the server exactly as in production code paths.
 *
 * The ux-reception password is supplied via HELIX_UX_RECEPTION_PASSWORD
 * (environment only — never stored in a file, never printed).
 */
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { seedFloor } from "../floor/seedFloor.js";
import { bootstrapMainFloorplan } from "../floor/bootstrapMainFloorplan.js";
import { PrismaStaffUserRepository } from "../../infrastructure/persistence/PrismaStaffUserRepository.js";
import { PrismaServiceSessionRepository } from "../../infrastructure/persistence/PrismaServiceSessionRepository.js";
import { PrismaTransactionManager } from "../../infrastructure/persistence/PrismaTransactionManager.js";
import { PrismaFloorplanRepository } from "../../infrastructure/persistence/PrismaFloorplanRepository.js";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { RandomIdGenerator } from "../../infrastructure/RandomIdGenerator.js";
import { SystemClock } from "../../infrastructure/SystemClock.js";
import { ServiceSessionService } from "../../application/availability/ServiceSessionService.js";
import { ActorKind, ActorRole } from "../../domain/value-objects/Actor.js";
import { assertUxBaseUrl, assertUxDatabaseUrl, assertUxSeedable, createPrismaUxIdentityReader, UxSafetyError, UX_SENTINEL_TABLE } from "./uxSafety.js";
import { amsterdamLocalToUtc, creationOrder, guestName, upcomingSaturday, UX_DATASET_VERSION, UX_RECEPTION_USERNAME, UX_SATURDAY_PLAN, validatePlan, type UxReservationPlan } from "./uxSaturdayPlan.js";

export const UX_RECEPTION_STAFF_ID = "su-ux-reception";
const MIN_PASSWORD_LENGTH = 16;

class UxApi {
  private cookie = "";
  constructor(private readonly baseUrl: string) {}

  async login(username: string, password: string): Promise<void> {
    const res = await fetch(`${this.baseUrl}/auth/login`, { method: "POST", headers: { "content-type": "application/json", "x-helix-client": "1" }, body: JSON.stringify({ username, password }) });
    if (res.status !== 200) throw new Error(`UX login as ${username} failed (HTTP ${res.status}) — is the UX app (not dev) running on ${this.baseUrl}?`);
    const body = (await res.json()) as { staffUser?: { username?: string; role?: string } };
    if (body.staffUser?.username !== username || body.staffUser?.role !== "Reception") throw new Error(`UX login returned an unexpected identity.`);
    this.cookie = (res.headers.get("set-cookie") ?? "").split(";")[0] ?? "";
    if (!this.cookie) throw new Error("UX login returned no session cookie.");
  }

  async call(method: string, urlPath: string, body?: unknown, expectOk = true): Promise<{ status: number; json: any }> {
    const res = await fetch(`${this.baseUrl}${urlPath}`, {
      method,
      headers: { "content-type": "application/json", "x-helix-client": "1", cookie: this.cookie },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
    const text = await res.text();
    const json = text ? JSON.parse(text) : null;
    if (expectOk && !res.ok) throw new Error(`${method} ${urlPath} → HTTP ${res.status}: ${text.slice(0, 400)}`);
    return { status: res.status, json };
  }
}

const isTeppanyakiSeat = (id: string): boolean => id.includes("-seat-");
const selectors = (ids: readonly string[]) => ids.map((id) => (isTeppanyakiSeat(id) ? { seatId: id } : { tableId: id }));
const plusMinutes = (d: Date, m: number): Date => new Date(d.getTime() + m * 60_000);

export interface UxSeedResult {
  readonly datasetDate: string;
  readonly reservations: number;
  readonly serviceSession: { readonly id: string; readonly status: string };
}

export async function seedUxSaturday(options: { databaseUrl: string; baseUrl: string; password: string; now?: Date }): Promise<UxSeedResult> {
  // ── Gates (no write before every one of these has passed) ──────────────
  const databaseUrl = assertUxDatabaseUrl(options.databaseUrl);
  const baseUrl = assertUxBaseUrl(options.baseUrl);
  if (!options.password || options.password.length < MIN_PASSWORD_LENGTH) throw new UxSafetyError(`HELIX_UX_RECEPTION_PASSWORD must be set (at least ${MIN_PASSWORD_LENGTH} characters).`);
  const planProblems = validatePlan(UX_SATURDAY_PLAN);
  if (planProblems.length > 0) throw new Error(`fixture plan is invalid:\n${planProblems.join("\n")}`);

  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertUxSeedable(createPrismaUxIdentityReader(prisma));
    const existing = await prisma.$queryRawUnsafe<{ reservations: number; staff: number }[]>(
      `SELECT (SELECT count(*)::int FROM reservations) AS reservations, (SELECT count(*)::int FROM staff_users) AS staff`
    );
    if ((existing[0]?.reservations ?? 0) > 0 || (existing[0]?.staff ?? 0) > 0) throw new UxSafetyError("the UX database already contains reservations or staff; run ux:teardown first.");

    const datasetDate = upcomingSaturday(options.now ?? new Date());
    // Atomic claim — a concurrent or repeated seed can never both pass.
    const claimed = await prisma.$executeRawUnsafe(
      `UPDATE "${UX_SENTINEL_TABLE}" SET seeding_started_at = now(), dataset_date = $1, dataset_version = $2 WHERE id = 1 AND seeding_started_at IS NULL AND seeded_at IS NULL`,
      datasetDate,
      UX_DATASET_VERSION
    );
    if (claimed !== 1) throw new UxSafetyError("could not claim the UX sentinel (already seeding/seeded).");

    // ── Reference data, in-process, this database only ──────────────────
    await seedFloor(databaseUrl);
    await bootstrapMainFloorplan(databaseUrl);
    await new PrismaStaffUserRepository(prisma).create({
      id: UX_RECEPTION_STAFF_ID,
      username: UX_RECEPTION_USERNAME,
      displayName: "UX Reception",
      email: null,
      passwordHash: await new ScryptPasswordHasher().hash(options.password),
      role: ActorRole.Reception,
    });
    const sessions = new ServiceSessionService(
      new PrismaServiceSessionRepository(prisma),
      new PrismaTransactionManager(prisma),
      new RandomIdGenerator(),
      new SystemClock(),
      new PrismaFloorplanRepository(prisma)
    );
    const created = await sessions.create({ serviceCode: "dinner", serviceDate: datasetDate, actor: { id: "ux-seed", kind: ActorKind.ApprovedAutomatedProcess, role: ActorRole.Owner } });
    if (created.type !== "CREATED") throw new Error(`service session create: ${created.type}`);
    const opened = await sessions.open(created.session.id);
    if (opened.type !== "OPENED") throw new Error(`service session open: ${opened.type}`);

    // ── Business data, through the real HTTP API as ux-reception ─────────
    const api = new UxApi(baseUrl);
    await api.login(UX_RECEPTION_USERNAME, options.password);
    const ids = new Map<string, string>();

    // Every failure names the fixture it belongs to.
    const step = async (ref: string, fn: () => Promise<void>): Promise<void> => {
      try {
        await fn();
      } catch (err) {
        throw new Error(`${ref}: ${err instanceof Error ? err.message : String(err)}`);
      }
    };

    for (const r of creationOrder(UX_SATURDAY_PLAN)) await step(r.ref, async () => {
      const at = amsterdamLocalToUtc(datasetDate, r.time);
      const res = await api.call("POST", "/availability/reservations", {
        commandId: `${r.ref}-create`,
        servicePeriodId: "dinner",
        contactSelection: { type: "CreateNewContact", displayName: guestName(r), phone: r.phone },
        reservationDate: at.toISOString(),
        partySize: r.partySize,
        source: { category: r.source },
        preferredArea: r.area,
        notes: r.notes,
        criticalNotes: r.critical && r.critical.length > 0 ? r.critical.map((n) => ({ noteType: n.type, detail: n.detail })) : undefined,
      });
      ids.set(r.ref, res.json.reservationId);
      if (r.status === "Confirmed") await api.call("POST", `/reservations/${res.json.reservationId}/confirm`, { commandId: `${r.ref}-confirm` });
      // Cancelled immediately (a cancellation releases its capacity before later bookings are made).
      if (r.status === "Cancelled") {
        await api.call("POST", `/availability/reservations/${res.json.reservationId}/cancel`, { commandId: `${r.ref}-cancel`, reason: "UX dataset: gast heeft afgezegd" });
      }
    });

    const seatingOrder = (r: UxReservationPlan): number => (r.seating?.mode === "noShow" ? 0 : r.seating?.moveFrom ? 1 : 2);
    for (const r of [...UX_SATURDAY_PLAN].filter((x) => x.seating).sort((a, b) => seatingOrder(a) - seatingOrder(b))) await step(r.ref, async () => {
      const id = ids.get(r.ref)!;
      const s = r.seating!;
      if (s.mode === "noShow") {
        await api.call("POST", `/reservations/${id}/seating/pre-assign`, { commandId: `${r.ref}-preassign`, resources: selectors(s.resources) });
        await api.call("POST", `/reservations/${id}/seating/no-show`, {});
      } else if (s.moveFrom) {
        await api.call("POST", `/reservations/${id}/seating/pre-assign`, { commandId: `${r.ref}-preassign`, resources: selectors(s.moveFrom) });
        await api.call("POST", `/reservations/${id}/seating/move`, { commandId: `${r.ref}-move`, resources: selectors(s.resources) });
        if (s.mode === "seat") await api.call("POST", `/reservations/${id}/seating/mark-seated`, {});
      } else if (s.mode === "assign") {
        await api.call("POST", `/reservations/${id}/seating/pre-assign`, { commandId: `${r.ref}-preassign`, resources: selectors(s.resources) });
      } else {
        await api.call("POST", `/reservations/${id}/seating`, { commandId: `${r.ref}-seat`, resources: selectors(s.resources) });
      }
    });

    for (const r of UX_SATURDAY_PLAN) await step(r.ref, async () => {
      const id = ids.get(r.ref)!;
      if (r.arrived) {
        await api.call("PATCH", `/availability/reservations/${id}`, { commandId: `${r.ref}-arrived`, changes: { arrivedAt: plusMinutes(amsterdamLocalToUtc(datasetDate, r.time), 5).toISOString() } });
      }
      const toResolve = (r.critical ?? []).filter((n) => n.resolved);
      if (toResolve.length > 0) {
        const detail = await api.call("GET", `/reservations/${id}`);
        const noteIds = toResolve.map((n) => {
          const match = (detail.json.criticalNotes as { id: string; detail: string; status: string }[]).find((x) => x.detail === n.detail && x.status === "Active");
          if (!match) throw new Error(`${r.ref}: note to resolve not found`);
          return { id: match.id };
        });
        await api.call("PATCH", `/availability/reservations/${id}`, { commandId: `${r.ref}-resolve`, changes: {}, criticalNoteChanges: { resolve: noteIds } });
      }
    });

    await prisma.$executeRawUnsafe(`UPDATE "${UX_SENTINEL_TABLE}" SET seeded_at = now() WHERE id = 1`);
    return { datasetDate, reservations: ids.size, serviceSession: { id: opened.session.id, status: opened.session.status } };
  } finally {
    await prisma.$disconnect();
  }
}

async function main(): Promise<void> {
  const result = await seedUxSaturday({
    databaseUrl: process.env["DATABASE_URL"] ?? "",
    baseUrl: process.env["HELIX_UX_BASE_URL"] ?? "http://127.0.0.1:3002",
    password: process.env["HELIX_UX_RECEPTION_PASSWORD"] ?? "",
  });
  console.log(`ux:seed OK — ${result.reservations} reservations for Saturday ${result.datasetDate}; dinner service session ${result.serviceSession.status}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
