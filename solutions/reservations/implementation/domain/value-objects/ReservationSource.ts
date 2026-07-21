import { Result, ok, fail, violation } from "../shared/Result.js";

/**
 * CAP-D01.01-R12 — Source Must Be Known
 *
 * The source category never becomes or replaces the authoritative
 * internal Reservation Identity (CAP-D01.01-R13).
 */
export const ReservationSourceCategory = {
  Website: "Website",
  Telephone: "Telephone",
  WalkIn: "Walk-in",
  Google: "Google",
  TheFork: "TheFork",
  Staff: "Staff",
  ExternalImport: "External Import",
  OtherApprovedSource: "Other Approved Source",
} as const;

export type ReservationSourceCategory = (typeof ReservationSourceCategory)[keyof typeof ReservationSourceCategory];

export interface ReservationSourceProps {
  readonly category: ReservationSourceCategory;
  /** Present only when category is External Import (CAP-D01.01-E01 import context). */
  readonly externalReference?: string;
  readonly importedBy?: string;
}

export class ReservationSource {
  private constructor(private readonly props: ReservationSourceProps) {}

  static create(props: ReservationSourceProps): Result<ReservationSource> {
    if (!Object.values(ReservationSourceCategory).includes(props.category)) {
      return fail([violation("CAP-D01.01-R12", `Unknown reservation source category: ${props.category}`)]);
    }
    return ok(new ReservationSource({ ...props }));
  }

  get category(): ReservationSourceCategory {
    return this.props.category;
  }

  get externalReference(): string | undefined {
    return this.props.externalReference;
  }

  get importedBy(): string | undefined {
    return this.props.importedBy;
  }

  isExternalImport(): boolean {
    return this.props.category === ReservationSourceCategory.ExternalImport;
  }
}
