import { PrismaClient } from "@prisma/client";
import { DuplicateCandidate, DuplicateReservationChecker } from "../../application/ports/DuplicateReservationChecker.js";
import { ReservationStatus } from "../../domain/value-objects/ReservationStatus.js";

export class PrismaDuplicateReservationChecker implements DuplicateReservationChecker {
  constructor(private readonly prisma: PrismaClient) {}

  async check(candidate: DuplicateCandidate): Promise<boolean> {
    // CAP-D01.01-R14 — a same-day, same-contact, same-party-size match is
    // treated as a plausible duplicate. Matching strategy is an
    // infrastructure concern, not a domain one.
    const startOfDay = new Date(candidate.reservationDate);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    const match = await this.prisma.reservation.findFirst({
      where: {
        contactId: candidate.contactId,
        partySize: candidate.partySize,
        reservationDate: { gte: startOfDay, lt: endOfDay },
        status: { in: [ReservationStatus.Proposed, ReservationStatus.Confirmed] },
      },
    });
    return match !== null;
  }
}
