/**
 * CAP-D04.01/CAP-D08.03-adjacent — the minimum floor read model (R1.5
 * final architecture §18/§26 "minimum floor read model"). Deliberately a
 * plain query function, not a UI/floorplan designer — authoritative
 * domain data (reservation, assignment, resource identity) is kept
 * separate from derived/presentation-only fields (conflict/at-risk
 * warnings), which are computed here at query time and never stored.
 */
import { PrismaClient } from "@prisma/client";
import { CriticalNoteStatus, CriticalNoteType } from "../../domain/value-objects/ReservationCriticalNote.js";

/**
 * R1.5-P7-C — the authoritative CURRENT seating of a reservation, for the
 * Reception list/detail reads. Derived only from its active (Assigned or
 * Seated) SeatingAssignment and that assignment's resources — never from
 * the legacy free-text Reservation.tableAssignment. A Released assignment
 * is not current seating. `tableLabel` is the resource's own label for a
 * Table, and the parent table's (e.g. Teppanyaki grill "C") for a Seat.
 */
export type ReservationSeatingStatus = "Unassigned" | "Assigned" | "Seated";
export interface ReservationSeatingResource {
  readonly kind: "Table" | "Seat";
  readonly label: string;
  readonly tableLabel: string;
}
export interface ReservationSeating {
  readonly status: ReservationSeatingStatus;
  readonly resources: readonly ReservationSeatingResource[];
}
export const UNASSIGNED_SEATING: ReservationSeating = { status: "Unassigned", resources: [] };

/**
 * Batched — a constant number of queries for any number of reservations
 * (active assignments + their resources, then the referenced seats, then
 * the referenced tables), never one per reservation. Reservations with no
 * active assignment are simply absent from the map (callers default to
 * UNASSIGNED_SEATING).
 */
export async function getActiveSeatingByReservationIds(
  prisma: PrismaClient,
  reservationIds: readonly string[]
): Promise<ReadonlyMap<string, ReservationSeating>> {
  if (reservationIds.length === 0) return new Map();
  const activeStatuses = ["Assigned", "Seated"];
  const assignments = await prisma.seatingAssignment.findMany({
    where: { reservationId: { in: [...reservationIds] }, status: { in: activeStatuses } },
    include: { resources: { where: { status: { in: activeStatuses } } } },
  });
  if (assignments.length === 0) return new Map();

  const resourceRows = assignments.flatMap((a) => a.resources);
  const seatIds = [...new Set(resourceRows.map((r) => r.seatId).filter((id): id is string => id !== null))];
  const seats = seatIds.length === 0 ? [] : await prisma.seat.findMany({ where: { id: { in: seatIds } }, select: { id: true, operationalLabel: true, tableId: true } });
  const seatById = new Map(seats.map((s) => [s.id, s]));
  const tableIds = [
    ...new Set([...resourceRows.map((r) => r.tableId).filter((id): id is string => id !== null), ...seats.map((s) => s.tableId)]),
  ];
  const tables = tableIds.length === 0 ? [] : await prisma.table.findMany({ where: { id: { in: tableIds } }, select: { id: true, operationalLabel: true } });
  const tableLabelById = new Map(tables.map((t) => [t.id, t.operationalLabel]));

  const byLabel = (a: ReservationSeatingResource, b: ReservationSeatingResource) =>
    a.tableLabel.localeCompare(b.tableLabel, "nl", { numeric: true }) || a.label.localeCompare(b.label, "nl", { numeric: true });

  const result = new Map<string, ReservationSeating>();
  for (const assignment of assignments) {
    const resources: ReservationSeatingResource[] = [];
    for (const r of assignment.resources) {
      if (r.tableId) {
        const label = tableLabelById.get(r.tableId);
        if (label !== undefined) resources.push({ kind: "Table", label, tableLabel: label });
      } else if (r.seatId) {
        const seat = seatById.get(r.seatId);
        if (seat) resources.push({ kind: "Seat", label: seat.operationalLabel, tableLabel: tableLabelById.get(seat.tableId) ?? "" });
      }
    }
    result.set(assignment.reservationId, { status: assignment.status as "Assigned" | "Seated", resources: resources.sort(byLabel) });
  }
  return result;
}

export interface FloorViewRow {
  readonly reservationId: string;
  readonly guestName: string | null;
  readonly reservationTime: Date;
  readonly expectedEndTime: Date;
  readonly partySize: number;
  readonly areaId: string | null;
  readonly assignedResources: readonly { readonly label: string; readonly kind: "Table" | "Seat" }[];
  readonly assignmentStatus: "Unassigned" | "Assigned" | "Seated";
  /** Derived, presentation-only — current time vs. reservationTime, never stored (final architecture §15/§18). */
  readonly lateArrivalRiskFlag: boolean;
  readonly hasAllergyNote: boolean;
  readonly hasContactWarning: boolean;
}

export async function getFloorView(
  prisma: PrismaClient,
  input: { readonly rangeStart: Date; readonly rangeEnd: Date; readonly areaId?: string; readonly now?: Date }
): Promise<readonly FloorViewRow[]> {
  const now = input.now ?? new Date();
  const reservations = await prisma.reservation.findMany({
    where: {
      reservationDate: { gte: input.rangeStart, lt: input.rangeEnd },
      status: { in: ["Proposed", "Confirmed"] },
      ...(input.areaId ? { preferredArea: input.areaId } : {}),
    },
    orderBy: { reservationDate: "asc" },
  });

  // R1.5-P7-C — allergy presence comes from the authoritative CAP-D05.02
  // record (an ACTIVE Allergy ReservationCriticalNote), never from the
  // general free-text `notes` field it used to be derived from. One
  // batched query for the whole range; Resolved notes do not count.
  const reservationIdsWithActiveAllergy = new Set(
    reservations.length === 0
      ? []
      : (
          await prisma.reservationCriticalNote.findMany({
            where: {
              reservationId: { in: reservations.map((r) => r.id) },
              noteType: CriticalNoteType.Allergy,
              status: CriticalNoteStatus.Active,
            },
            select: { reservationId: true },
          })
        ).map((n) => n.reservationId)
  );

  const rows: FloorViewRow[] = [];
  for (const reservation of reservations) {
    const assignment = await prisma.seatingAssignment.findFirst({
      where: { reservationId: reservation.id, status: { in: ["Assigned", "Seated"] } },
      include: { resources: true },
    });

    const assignedResources: { label: string; kind: "Table" | "Seat" }[] = [];
    if (assignment) {
      for (const resource of assignment.resources) {
        if (resource.tableId) {
          const table = await prisma.table.findUnique({ where: { id: resource.tableId } });
          if (table) assignedResources.push({ label: table.operationalLabel, kind: "Table" });
        } else if (resource.seatId) {
          const seat = await prisma.seat.findUnique({ where: { id: resource.seatId } });
          if (seat) assignedResources.push({ label: seat.operationalLabel, kind: "Seat" });
        }
      }
    }

    // Duration derived from the reservation's own capacity pool
    // (CAP-D02.03) — never a second duration authority inside seating
    // (final architecture §16).
    const durationMinutes = reservation.preferredArea === "Teppanyaki" ? 150 : 90;
    const expectedEndTime = new Date(reservation.reservationDate.getTime() + durationMinutes * 60_000);

    rows.push({
      reservationId: reservation.id,
      guestName: reservation.contactName,
      reservationTime: reservation.reservationDate,
      expectedEndTime,
      partySize: reservation.partySize,
      areaId: reservation.preferredArea,
      assignedResources,
      assignmentStatus: assignment ? (assignment.status as "Assigned" | "Seated") : "Unassigned",
      // Derived — final architecture §15: a busy-evening +20-minute
      // marker is presentation-only, never a stored state, and never
      // triggers an automatic action on its own.
      lateArrivalRiskFlag:
        !assignment || assignment.status !== "Seated"
          ? now.getTime() - reservation.reservationDate.getTime() >= 20 * 60_000 && now.getTime() < expectedEndTime.getTime()
          : false,
      hasAllergyNote: reservationIdsWithActiveAllergy.has(reservation.id),
      hasContactWarning: false, // R1.3's possible-match warning is a Contact-creation-time signal, not a stored Reservation field — left false pending a real integration point; never fabricated here.
    });
  }
  return rows;
}
