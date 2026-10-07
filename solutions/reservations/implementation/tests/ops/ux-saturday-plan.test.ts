import { describe, expect, it } from "vitest";
import { amsterdamLocalToUtc, guestName, upcomingSaturday, UX_SATURDAY_PLAN, validatePlan } from "../../ops/ux/uxSaturdayPlan.js";
import { CAPACITY_POOLS } from "../../domain/availability/CapacityPool.js";

/**
 * R1.5-P7-D — the fictional busy-Saturday fixture is deterministic and, by
 * itself, respects the capacity and resource-overlap rules the server will
 * enforce when it is seeded (pure — no database).
 */
const count = (pred: (r: (typeof UX_SATURDAY_PLAN)[number]) => boolean) => UX_SATURDAY_PLAN.filter(pred).length;
const notes = UX_SATURDAY_PLAN.flatMap((r) => (r.critical ?? []).map((n) => ({ ref: r.ref, ...n })));

describe("deterministic fixture counts", () => {
  it("60 uniquely referenced, entirely fictional reservations", () => {
    expect(UX_SATURDAY_PLAN).toHaveLength(60);
    expect(new Set(UX_SATURDAY_PLAN.map((r) => r.ref)).size).toBe(60);
    expect(UX_SATURDAY_PLAN.map((r) => r.ref)).toEqual(Array.from({ length: 60 }, (_, i) => `UX-SAT-${String(i + 1).padStart(3, "0")}`));
    for (const r of UX_SATURDAY_PLAN) {
      expect(guestName(r)).toMatch(/^UX-SAT-\d{3} /);
      expect(r.phone).toMatch(/^06000\d{5}$/);
    }
  });
  it("exact distribution", () => {
    expect({ teppanyaki: count((r) => r.area === "Teppanyaki"), sushi: count((r) => r.area === "Sushi") }).toEqual({ teppanyaki: 18, sushi: 42 });
    expect({ confirmed: count((r) => r.status === "Confirmed"), proposed: count((r) => r.status === "Proposed"), cancelled: count((r) => r.status === "Cancelled") }).toEqual({ confirmed: 51, proposed: 6, cancelled: 3 });
    expect({ seat: count((r) => r.seating?.mode === "seat"), assign: count((r) => r.seating?.mode === "assign"), noShow: count((r) => r.seating?.mode === "noShow"), none: count((r) => !r.seating) }).toEqual({ seat: 23, assign: 10, noShow: 2, none: 25 });
    expect(count((r) => r.source === "Walk-in")).toBe(3);
    expect(count((r) => r.time >= "19:00" && r.time <= "19:45")).toBe(21); // the peak wave
  });
  it("active vs resolved critical notes", () => {
    expect(notes.filter((n) => n.type === "Allergy" && !n.resolved)).toHaveLength(8);
    expect(notes.filter((n) => n.type === "Critical" && !n.resolved)).toHaveLength(4);
    expect(notes.filter((n) => n.resolved).map((n) => n.ref).sort()).toEqual(["UX-SAT-022", "UX-SAT-048", "UX-SAT-055"]);
    // A free-text note that mentions an allergy word is never an active allergy by itself.
    const r055 = UX_SATURDAY_PLAN.find((r) => r.ref === "UX-SAT-055")!;
    expect(r055.notes).toMatch(/noten/i);
    expect((r055.critical ?? []).every((n) => n.resolved)).toBe(true);
  });
  it("deterministic search cases", () => {
    expect(UX_SATURDAY_PLAN.filter((r) => guestName(r).toLowerCase().includes("jansen")).map((r) => r.ref)).toEqual(["UX-SAT-029", "UX-SAT-046"]);
    expect(UX_SATURDAY_PLAN.find((r) => r.ref === "UX-SAT-046")!.phone).toBe(UX_SATURDAY_PLAN.find((r) => r.ref === "UX-SAT-029")!.phone); // shared family phone
    expect(UX_SATURDAY_PLAN.some((r) => r.surname === "Janssen")).toBe(true);
  });
});

describe("seating / capacity integrity of the plan", () => {
  it("validatePlan finds no violation (capacity per pool, no overlapping active resource claims, party fits resources)", () => {
    expect(validatePlan(UX_SATURDAY_PLAN)).toEqual([]);
  });
  it("validatePlan does catch an injected overlap and a capacity breach (the check is real)", () => {
    const overlap = [...UX_SATURDAY_PLAN, { ...UX_SATURDAY_PLAN.find((r) => r.ref === "UX-SAT-030")!, ref: "UX-SAT-061" }];
    expect(validatePlan(overlap).some((p) => p.includes("overlap on sushi-table-4"))).toBe(true);
    const tooMany = [...UX_SATURDAY_PLAN, { ref: "UX-SAT-062", surname: "Extra", time: "21:00", area: "Sushi" as const, partySize: 4, status: "Confirmed" as const, source: "Telephone" as const, phone: "0600000062" }];
    expect(validatePlan(tooMany).some((p) => p.startsWith(`Sushi: 55 covers at 21:00 exceed ${CAPACITY_POOLS.Sushi.maximumCapacity}`))).toBe(true);
  });
  it("Teppanyaki grills cover every occupancy level at 19:45 (empty-ish, partial, nearly full, full)", () => {
    const at = 19 * 60 + 45;
    const busy = (grill: string) =>
      UX_SATURDAY_PLAN.filter((r) => r.area === "Teppanyaki" && r.seating && r.seating.mode !== "noShow")
        .filter((r) => {
          const s = Number(r.time.slice(0, 2)) * 60 + Number(r.time.slice(3));
          return s <= at && at < s + CAPACITY_POOLS.Teppanyaki.durationMinutes;
        })
        .flatMap((r) => r.seating!.resources)
        .filter((id) => id.startsWith(`teppanyaki-${grill}-`)).length;
    expect({ C: busy("c"), D: busy("d"), E: busy("e"), F: busy("f") }).toEqual({ C: 5, D: 8, E: 10, F: 2 });
  });
});

describe("date helpers", () => {
  it("upcomingSaturday is always a future Saturday", () => {
    expect(upcomingSaturday(new Date("2026-10-07T10:00:00Z"))).toBe("2026-10-10"); // Wednesday
    expect(upcomingSaturday(new Date("2026-10-10T10:00:00Z"))).toBe("2026-10-17"); // on a Saturday → next week
    expect(upcomingSaturday(new Date("2026-10-09T23:30:00Z"))).toBe("2026-10-17"); // already Saturday in Amsterdam
  });
  it("amsterdamLocalToUtc is DST-correct", () => {
    expect(amsterdamLocalToUtc("2026-10-10", "19:45").toISOString()).toBe("2026-10-10T17:45:00.000Z"); // CEST
    expect(amsterdamLocalToUtc("2026-10-31", "19:45").toISOString()).toBe("2026-10-31T18:45:00.000Z"); // CET
  });
});
