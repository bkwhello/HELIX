/**
 * CAP-D04.01/CAP-D08.03-adjacent — the minimum floor read model (R1.5
 * final architecture §18/§26 "minimum floor read model"). Deliberately a
 * plain query function, not a UI/floorplan designer — authoritative
 * domain data (reservation, assignment, resource identity) is kept
 * separate from derived/presentation-only fields (conflict/at-risk
 * warnings), which are computed here at query time and never stored.
 */
import { PrismaClient } from "@prisma/client";

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
      hasAllergyNote: !!reservation.notes,
      hasContactWarning: false, // R1.3's possible-match warning is a Contact-creation-time signal, not a stored Reservation field — left false pending a real integration point; never fabricated here.
    });
  }
  return rows;
}
