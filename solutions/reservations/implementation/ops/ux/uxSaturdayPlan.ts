/**
 * R1.5-P7-D — the deterministic, ENTIRELY FICTIONAL "busy Saturday" Reception
 * dataset for the isolated UX environment. Pure data + pure validation: no
 * database, no network. Seeded by ops/ux/seedUxSaturday.ts through the real
 * HTTP API (capacity, overlap, seatability and session rules all enforced by
 * the server); validatePlan() additionally proves, before any write, that the
 * plan itself respects the same capacity and resource-overlap rules.
 *
 * Every guest is "UX-SAT-nnn <fictional surname>", every phone number is in
 * the unallocated 06-00000xxx range. No real Konnichiwa or Guestplan data.
 * Designed around a ~19:45 Reception view of Saturday dinner (17:00–21:00).
 */
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";
import { ALL_TABLES, seatId } from "../../infrastructure/floor/floorSeedData.js";

export const UX_DATASET_VERSION = "ux-sat-v1";
export const UX_TARGET_LOCAL_TIME = "19:45";
export const UX_RECEPTION_USERNAME = "ux-reception";

export type UxArea = "Sushi" | "Teppanyaki";
export type UxStatus = "Proposed" | "Confirmed" | "Cancelled";
export type UxSource = "Telephone" | "Website" | "Google" | "TheFork" | "Walk-in" | "Staff";
export interface UxCriticalNote {
  readonly type: "Allergy" | "Critical";
  readonly detail: string;
  /** Added, then resolved through the real API — must never appear as active. */
  readonly resolved?: boolean;
}
export interface UxSeating {
  /** seat = seated immediately; assign = pre-assigned (not yet seated); noShow = assigned, then released as No-show. */
  readonly mode: "seat" | "assign" | "noShow";
  /** tableIds (Sushi) or seatIds (Teppanyaki). */
  readonly resources: readonly string[];
  /** Optional earlier assignment that is MOVED to `resources` (leaves a Released/StaffReassigned history row). */
  readonly moveFrom?: readonly string[];
}
export interface UxReservationPlan {
  readonly ref: string;
  readonly surname: string;
  readonly time: string;
  readonly area: UxArea;
  readonly partySize: number;
  readonly status: UxStatus;
  readonly source: UxSource;
  readonly phone: string;
  readonly seating?: UxSeating;
  readonly arrived?: boolean;
  readonly notes?: string;
  readonly critical?: readonly UxCriticalNote[];
}

const tep = (grill: "c" | "d" | "e" | "f", from: number, to: number): string[] => {
  const seats: string[] = [];
  for (let n = from; n <= to; n++) seats.push(seatId(`teppanyaki-${grill}`, String(n).padStart(2, "0")));
  return seats;
};
const table = (n: number): string => (n >= 17 ? `sushi-bar-${n}` : `sushi-table-${n}`);
const phone = (n: number): string => `06000${String(n).padStart(5, "0")}`;

/** 60 reservations: 18 Teppanyaki, 42 Sushi. Order = creation order. */
export const UX_SATURDAY_PLAN: readonly UxReservationPlan[] = [
  // ── Teppanyaki — first seating 17:00/17:30 (grill C full until 19:30, D nearly full until 20:00)
  { ref: "UX-SAT-001", surname: "Bakker", time: "17:00", area: "Teppanyaki", partySize: 4, status: "Confirmed", source: "Website", phone: phone(1), seating: { mode: "seat", resources: tep("c", 1, 4) }, arrived: true },
  { ref: "UX-SAT-002", surname: "Visser", time: "17:00", area: "Teppanyaki", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(2), seating: { mode: "seat", resources: tep("c", 5, 8) }, arrived: true, critical: [{ type: "Allergy", detail: "Schaaldieren — ernstig" }] },
  { ref: "UX-SAT-003", surname: "Smit", time: "17:00", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "Google", phone: phone(3), seating: { mode: "seat", resources: tep("c", 9, 10) }, arrived: true },
  { ref: "UX-SAT-004", surname: "Meijer", time: "17:30", area: "Teppanyaki", partySize: 6, status: "Confirmed", source: "Telephone", phone: phone(4), seating: { mode: "seat", resources: tep("d", 1, 6) }, arrived: true, critical: [{ type: "Critical", detail: "Rolstoel — vaste plek aan de kop van de grill" }] },
  { ref: "UX-SAT-005", surname: "de Boer", time: "17:30", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "TheFork", phone: phone(5), seating: { mode: "seat", resources: tep("d", 7, 8) }, arrived: true },
  // ── Teppanyaki — second seating 18:00–19:15 (grill E full, F lightly used)
  { ref: "UX-SAT-006", surname: "Mulder", time: "19:00", area: "Teppanyaki", partySize: 3, status: "Confirmed", source: "Website", phone: phone(6), seating: { mode: "seat", resources: tep("e", 1, 3) }, arrived: true, critical: [{ type: "Allergy", detail: "Glutenvrij (coeliakie)" }] },
  { ref: "UX-SAT-007", surname: "de Groot", time: "19:00", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(7), seating: { mode: "seat", resources: tep("e", 4, 5) }, arrived: true },
  { ref: "UX-SAT-008", surname: "Bos", time: "19:15", area: "Teppanyaki", partySize: 5, status: "Confirmed", source: "Telephone", phone: phone(8), seating: { mode: "assign", resources: tep("e", 6, 10) }, arrived: true, notes: "Wacht aan de bar tot de grill klaar is" },
  { ref: "UX-SAT-009", surname: "Vos", time: "19:30", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "Google", phone: phone(9) },
  { ref: "UX-SAT-010", surname: "Peters", time: "19:45", area: "Teppanyaki", partySize: 5, status: "Confirmed", source: "Telephone", phone: phone(10), seating: { mode: "assign", resources: tep("c", 1, 5), moveFrom: tep("c", 6, 10) } },
  { ref: "UX-SAT-011", surname: "Hendriks", time: "19:45", area: "Teppanyaki", partySize: 2, status: "Proposed", source: "Website", phone: phone(11) },
  { ref: "UX-SAT-012", surname: "van Leeuwen", time: "20:00", area: "Teppanyaki", partySize: 4, status: "Confirmed", source: "TheFork", phone: phone(12), seating: { mode: "assign", resources: tep("f", 1, 4) }, critical: [{ type: "Allergy", detail: "Sesam" }] },
  { ref: "UX-SAT-013", surname: "Dekker", time: "20:30", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "TheFork", phone: phone(13), notes: "Raamkant graag" },
  { ref: "UX-SAT-014", surname: "Brouwer", time: "20:45", area: "Teppanyaki", partySize: 6, status: "Confirmed", source: "Telephone", phone: phone(14), critical: [{ type: "Critical", detail: "Epilepsie — geen flitsfoto's / vlammenshow aan deze grill" }] },
  { ref: "UX-SAT-015", surname: "de Wit", time: "19:00", area: "Teppanyaki", partySize: 4, status: "Cancelled", source: "Telephone", phone: phone(15) },
  { ref: "UX-SAT-016", surname: "Dijkstra", time: "18:30", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "Website", phone: phone(16), seating: { mode: "noShow", resources: tep("f", 9, 10) } },
  { ref: "UX-SAT-017", surname: "Smits", time: "18:00", area: "Teppanyaki", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(17), seating: { mode: "seat", resources: tep("f", 5, 6) }, arrived: true },
  { ref: "UX-SAT-018", surname: "de Graaf", time: "20:30", area: "Teppanyaki", partySize: 4, status: "Proposed", source: "Google", phone: phone(18) },

  // ── Sushi — early (overstaying / just leaving)
  { ref: "UX-SAT-019", surname: "van Dam", time: "17:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(19), seating: { mode: "seat", resources: [table(5)] }, arrived: true },
  { ref: "UX-SAT-020", surname: "Kok", time: "17:15", area: "Sushi", partySize: 4, status: "Confirmed", source: "Website", phone: phone(20), seating: { mode: "seat", resources: [table(1)] }, arrived: true },
  // ── Sushi — first wave 18:15–18:45 (seated, finishing around 19:45–20:15)
  { ref: "UX-SAT-021", surname: "Jacobs", time: "18:15", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(21), seating: { mode: "seat", resources: [table(2)] }, arrived: true, critical: [{ type: "Allergy", detail: "Noten — ernstig, EpiPen aanwezig" }] },
  { ref: "UX-SAT-022", surname: "Vermeulen", time: "18:15", area: "Sushi", partySize: 2, status: "Confirmed", source: "TheFork", phone: phone(22), seating: { mode: "seat", resources: [table(6)] }, arrived: true, critical: [{ type: "Allergy", detail: "Ei (opgelost: bleek misverstand)", resolved: true }] },
  { ref: "UX-SAT-023", surname: "van den Berg", time: "18:30", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(23), seating: { mode: "seat", resources: [table(3)] }, arrived: true },
  { ref: "UX-SAT-024", surname: "Willems", time: "18:30", area: "Sushi", partySize: 1, status: "Confirmed", source: "Website", phone: phone(24), seating: { mode: "seat", resources: [table(17)] }, arrived: true },
  { ref: "UX-SAT-025", surname: "Lambrechts", time: "18:30", area: "Sushi", partySize: 2, status: "Confirmed", source: "Walk-in", phone: phone(25), seating: { mode: "seat", resources: [table(7)] }, arrived: true },
  { ref: "UX-SAT-026", surname: "Hoekstra", time: "18:45", area: "Sushi", partySize: 5, status: "Confirmed", source: "Telephone", phone: phone(26), seating: { mode: "seat", resources: [table(10)] }, arrived: true },
  { ref: "UX-SAT-027", surname: "Koster", time: "18:45", area: "Sushi", partySize: 4, status: "Confirmed", source: "Google", phone: phone(27), seating: { mode: "seat", resources: [table(8)] }, arrived: true, critical: [{ type: "Critical", detail: "Zwanger — geen rauwe vis" }] },
  { ref: "UX-SAT-028", surname: "Prins", time: "18:45", area: "Sushi", partySize: 1, status: "Confirmed", source: "Website", phone: phone(28), seating: { mode: "seat", resources: [table(18)] }, arrived: true },
  // ── Sushi — peak 19:00–19:45 (seated, waiting, late, unassigned)
  { ref: "UX-SAT-029", surname: "Jansen", time: "19:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(29) },
  { ref: "UX-SAT-030", surname: "Huisman", time: "19:00", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(30), seating: { mode: "seat", resources: [table(4)] }, arrived: true },
  { ref: "UX-SAT-031", surname: "Kuipers", time: "19:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "Website", phone: phone(31), seating: { mode: "seat", resources: [table(11)] }, arrived: true },
  { ref: "UX-SAT-032", surname: "Veenstra", time: "19:15", area: "Sushi", partySize: 4, status: "Confirmed", source: "TheFork", phone: phone(32), seating: { mode: "seat", resources: [table(9)] }, arrived: true, critical: [{ type: "Allergy", detail: "Lactose" }] },
  { ref: "UX-SAT-033", surname: "Kramer", time: "19:15", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(33), seating: { mode: "assign", resources: [table(13)] }, arrived: true },
  { ref: "UX-SAT-034", surname: "van Dijk", time: "19:15", area: "Sushi", partySize: 3, status: "Confirmed", source: "Walk-in", phone: phone(34), seating: { mode: "seat", resources: [table(12)] }, arrived: true },
  { ref: "UX-SAT-035", surname: "Wouters", time: "19:30", area: "Sushi", partySize: 2, status: "Confirmed", source: "Google", phone: phone(35), seating: { mode: "assign", resources: [table(15)] } },
  { ref: "UX-SAT-036", surname: "Janssen", time: "19:30", area: "Sushi", partySize: 2, status: "Proposed", source: "Website", phone: phone(36) },
  { ref: "UX-SAT-037", surname: "Sanders", time: "19:30", area: "Sushi", partySize: 1, status: "Confirmed", source: "Walk-in", phone: phone(37), seating: { mode: "seat", resources: [table(19)] }, arrived: true },
  { ref: "UX-SAT-038", surname: "Kuijpers", time: "19:45", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(38), seating: { mode: "assign", resources: [table(1)] } },
  { ref: "UX-SAT-039", surname: "Hermans", time: "19:45", area: "Sushi", partySize: 2, status: "Confirmed", source: "Website", phone: phone(39), seating: { mode: "assign", resources: [table(16)] } },
  { ref: "UX-SAT-040", surname: "Postma", time: "19:45", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(40), critical: [{ type: "Allergy", detail: "Pinda" }] },
  { ref: "UX-SAT-041", surname: "Martens", time: "19:45", area: "Sushi", partySize: 2, status: "Proposed", source: "Google", phone: phone(41) },
  // ── Sushi — later 20:00–20:30
  { ref: "UX-SAT-042", surname: "Bosman", time: "20:00", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(42), seating: { mode: "assign", resources: [table(2)] } },
  { ref: "UX-SAT-043", surname: "Timmermans", time: "20:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "TheFork", phone: phone(43), seating: { mode: "assign", resources: [table(6)] } },
  { ref: "UX-SAT-044", surname: "Groen", time: "20:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(44), critical: [{ type: "Critical", detail: "Rolstoel — ingang aan de zijkant gebruiken" }] },
  { ref: "UX-SAT-045", surname: "Gerritsen", time: "20:15", area: "Sushi", partySize: 4, status: "Confirmed", source: "Website", phone: phone(45), seating: { mode: "assign", resources: [table(3)] } },
  { ref: "UX-SAT-046", surname: "Jansen", time: "20:15", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(29), notes: "Zelfde gezinstelefoon als UX-SAT-029" },
  { ref: "UX-SAT-047", surname: "Maas", time: "20:15", area: "Sushi", partySize: 3, status: "Confirmed", source: "Google", phone: phone(47), notes: "Kinderstoel nodig" },
  { ref: "UX-SAT-048", surname: "Verbeek", time: "20:30", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(48), critical: [{ type: "Critical", detail: "Gast is slechtziend — menu voorlezen", resolved: true }] },
  { ref: "UX-SAT-049", surname: "Scholten", time: "20:30", area: "Sushi", partySize: 2, status: "Confirmed", source: "Website", phone: phone(49) },
  { ref: "UX-SAT-050", surname: "Kok", time: "20:30", area: "Sushi", partySize: 1, status: "Proposed", source: "Website", phone: phone(50), critical: [{ type: "Allergy", detail: "Soja" }] },
  // ── Sushi — late 20:45–21:00
  { ref: "UX-SAT-051", surname: "van der Meer", time: "20:45", area: "Sushi", partySize: 4, status: "Confirmed", source: "Telephone", phone: phone(51) },
  { ref: "UX-SAT-052", surname: "Bakker", time: "20:45", area: "Sushi", partySize: 2, status: "Proposed", source: "Google", phone: phone(52), critical: [{ type: "Allergy", detail: "Selderij" }] },
  { ref: "UX-SAT-053", surname: "Evers", time: "20:45", area: "Sushi", partySize: 2, status: "Confirmed", source: "TheFork", phone: phone(53) },
  { ref: "UX-SAT-054", surname: "Hofman", time: "21:00", area: "Sushi", partySize: 2, status: "Confirmed", source: "Telephone", phone: phone(54) },
  { ref: "UX-SAT-055", surname: "van Vliet", time: "21:00", area: "Sushi", partySize: 4, status: "Confirmed", source: "Website", phone: phone(55), notes: "Vroeger noten genoemd — geen actieve allergie", critical: [{ type: "Allergy", detail: "Noten (opgelost: geen allergie)", resolved: true }] },
  { ref: "UX-SAT-056", surname: "Mertens", time: "21:00", area: "Sushi", partySize: 1, status: "Confirmed", source: "Website", phone: phone(56) },
  // ── Sushi — cancellations and a no-show
  { ref: "UX-SAT-057", surname: "Claes", time: "19:00", area: "Sushi", partySize: 2, status: "Cancelled", source: "Telephone", phone: phone(57) },
  { ref: "UX-SAT-058", surname: "Peeters", time: "20:00", area: "Sushi", partySize: 4, status: "Cancelled", source: "Website", phone: phone(58) },
  { ref: "UX-SAT-059", surname: "Wauters", time: "18:30", area: "Sushi", partySize: 1, status: "Confirmed", source: "Telephone", phone: phone(59), seating: { mode: "noShow", resources: [table(20)] } },
  { ref: "UX-SAT-060", surname: "Willems", time: "20:15", area: "Sushi", partySize: 2, status: "Confirmed", source: "Google", phone: phone(60) },
];

/**
 * Creation order used by the seed (and by validatePlan): reservations that end
 * up cancelled were booked FIRST (then cancelled straight away, releasing their
 * capacity), so they never compete with the later full-house bookings.
 */
export function creationOrder(plan: readonly UxReservationPlan[]): readonly UxReservationPlan[] {
  return [...plan.filter((r) => r.status === "Cancelled"), ...plan.filter((r) => r.status !== "Cancelled")];
}

export function guestName(r: UxReservationPlan): string {
  return `${r.ref} ${r.surname}`;
}

/** The first Saturday strictly after `now`'s Amsterdam calendar date (a reusable, always-future service day). */
export function upcomingSaturday(now: Date): string {
  const local = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Amsterdam", year: "numeric", month: "2-digit", day: "2-digit" }).format(now);
  const d = new Date(`${local}T12:00:00Z`);
  const daysAhead = ((6 - d.getUTCDay() + 7) % 7) || 7;
  d.setUTCDate(d.getUTCDate() + daysAhead);
  return d.toISOString().slice(0, 10);
}

/** Europe/Amsterdam wall-clock (date + "HH:MM") → UTC instant, DST-correct. */
export function amsterdamLocalToUtc(date: string, time: string): Date {
  const guess = new Date(`${date}T${time}:00Z`);
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Amsterdam", hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" })
      .formatToParts(guess)
      .map((p) => [p.type, p.value])
  );
  const asIfUtc = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
  return new Date(guess.getTime() - (asIfUtc - guess.getTime()));
}

const minutes = (hhmm: string): number => Number(hhmm.slice(0, 2)) * 60 + Number(hhmm.slice(3, 5));
const tableById = new Map(ALL_TABLES.map((t) => [t.id, t]));

/** Pure pre-write validation: the plan must itself satisfy the rules the server will enforce. Returns violations (empty = valid). */
export function validatePlan(plan: readonly UxReservationPlan[]): string[] {
  const problems: string[] = [];
  const refs = new Set<string>();
  for (const r of plan) {
    if (refs.has(r.ref)) problems.push(`${r.ref}: duplicate ref`);
    refs.add(r.ref);
    if (!/^UX-SAT-\d{3}$/.test(r.ref)) problems.push(`${r.ref}: ref must be UX-SAT-nnn`);
    if (!/^06000\d{5}$/.test(r.phone)) problems.push(`${r.ref}: phone must be in the fictional 06000xxxxx range`);
    const m = minutes(r.time);
    if (m < 17 * 60 || m > 21 * 60 || m % 15 !== 0) problems.push(`${r.ref}: time ${r.time} outside the Saturday dinner grid 17:00–21:00`);
    if (r.seating && r.status === "Cancelled") problems.push(`${r.ref}: a cancelled reservation cannot be seated`);
    for (const resourceId of [...(r.seating?.resources ?? []), ...(r.seating?.moveFrom ?? [])]) {
      if (r.area === "Teppanyaki" ? !resourceId.startsWith("teppanyaki-") || !resourceId.includes("-seat-") : !tableById.has(resourceId) || !resourceId.startsWith("sushi-")) {
        problems.push(`${r.ref}: resource ${resourceId} does not belong to ${r.area}`);
      }
    }
    if (r.seating) {
      const capacity =
        r.area === "Teppanyaki" ? r.seating.resources.length : r.seating.resources.reduce((sum, id) => sum + (tableById.get(id)?.nominalCapacity ?? 0), 0);
      if (r.area === "Teppanyaki" ? capacity !== r.partySize : capacity < r.partySize) problems.push(`${r.ref}: ${capacity} seat(s) for a party of ${r.partySize}`);
    }
  }

  // Capacity, exactly as the server evaluates it (CAP-D02.03): at the moment
  // each reservation is CREATED (creationOrder), the peak occupancy of the
  // already-committed reservations of its pool within its own window, plus its
  // party, must not exceed the pool maximum. A cancellation is applied right
  // after its own create (so it never holds capacity for later bookings); a
  // no-show keeps its commitment.
  const fmt = (t: number) => `${Math.floor(t / 60)}:${String(t % 60).padStart(2, "0")}`;
  const committed: UxReservationPlan[] = [];
  for (const r of creationOrder(plan)) {
    const { maximumCapacity, durationMinutes } = CAPACITY_POOLS[r.area];
    const start = minutes(r.time);
    for (let t = start; t < start + durationMinutes; t += 15) {
      const existing = committed
        .filter((x) => x.area === r.area && minutes(x.time) <= t && t < minutes(x.time) + durationMinutes)
        .reduce((sum, x) => sum + x.partySize, 0);
      if (existing + r.partySize > maximumCapacity) {
        problems.push(`${r.area}: ${existing + r.partySize} covers at ${fmt(t)} exceed ${maximumCapacity} when ${r.ref} is created`);
        break;
      }
    }
    if (r.status !== "Cancelled") committed.push(r);
  }

  // Resource overlap among ACTIVE final seatings (no-show releases its resources; a move releases moveFrom).
  const claims: { ref: string; resourceId: string; start: number; end: number }[] = [];
  for (const r of plan) {
    if (!r.seating || r.seating.mode === "noShow") continue;
    const start = minutes(r.time);
    const end = start + CAPACITY_POOLS[r.area].durationMinutes;
    for (const resourceId of r.seating.resources) claims.push({ ref: r.ref, resourceId, start, end });
  }
  for (let i = 0; i < claims.length; i++) {
    for (let j = i + 1; j < claims.length; j++) {
      const a = claims[i]!;
      const b = claims[j]!;
      if (a.resourceId === b.resourceId && a.start < b.end && b.start < a.end) problems.push(`${a.ref} and ${b.ref} overlap on ${a.resourceId}`);
    }
  }
  return problems;
}
