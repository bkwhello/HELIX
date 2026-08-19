/**
 * CAP-D02.03-owned concept (capability-registry.yaml.md already registers
 * "Resource Block" under Availability Management — R1_5 final architecture
 * §9 confirms this as the correct, pre-existing owner, not CAP-D03.03).
 *
 * A time-bounded, reasoned, attributed exclusion — distinct from
 * Table.status: physical existence and operational availability are
 * separate concepts (owner's own chef-shortage framing). Always
 * Table-scoped (a whole grill/table goes offline) — never Seat-scoped;
 * blocking a Table's id is read as "every seat under this Table is
 * unavailable for the blocked interval," satisfying the "one parent-level
 * block, not ten duplicate blocks" requirement structurally.
 */
export interface ResourceBlock {
  readonly id: string;
  readonly tableId: string;
  readonly startTime: Date;
  readonly endTime: Date;
  readonly reason: string | null;
  readonly createdBy: string;
  readonly createdAt: Date;
}
