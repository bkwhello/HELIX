import { ActorRole } from "../value-objects/Actor.js";

/**
 * R1.2 — Identity & Access. Centralized static permission policy (Model B
 * from R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §16) — role checks live
 * here, once, not scattered through route handlers. Mirrors the existing
 * domain/rules/*.ts convention: pure, no I/O, exhaustively unit-testable.
 *
 * Only permissions with an actual, live endpoint are enforced anywhere
 * (§14 of the implementation assignment: "do not create dormant
 * endpoints merely because permissions exist"). capacity.settings.manage
 * maps to the existing closing-days endpoints; system.settings.manage
 * and audit.view are named because the owner's role matrix names them,
 * but no route exists for either yet — they are defined here so the
 * matrix is complete and testable, not because anything currently checks
 * them.
 */
export const Permission = {
  ReservationView: "reservation.view",
  ReservationCreate: "reservation.create",
  ReservationModify: "reservation.modify",
  ReservationCancel: "reservation.cancel",
  ReservationConfirm: "reservation.confirm",
  ReservationComplete: "reservation.complete",
  ReservationWalkinCreate: "reservation.walkin.create",
  CapacitySettingsManage: "capacity.settings.manage",
  SystemSettingsManage: "system.settings.manage",
  UsersManage: "users.manage",
  AuditView: "audit.view",
  // R1.5 — CAP-D04.01/CAP-D02.03(ResourceBlock). Smallest required set
  // (assignment §30: "avoid unnecessary RBAC expansion") — no separate
  // seating.markSeated/seating.preAssign permission, since those are the
  // same underlying action (assign/move) at a different point in time,
  // per the final architecture §12/§14 "no new workflow states" posture.
  SeatingView: "seating.view",
  SeatingAssign: "seating.assign",
  SeatingMove: "seating.move",
  SeatingRelease: "seating.release",
  ResourceBlock: "resource.block",
  // R1.6-B — CAP-D06.01-adjacent (assignment §22/§23). Its own dedicated
  // permission, not folded into ReservationModify: a resend touches no
  // Reservation business state at all (assignment §42 S7) — it is an
  // operationally distinct action from modifying a reservation, matching
  // this policy's own existing granularity (e.g. separate Confirm/Cancel/
  // Complete permissions for actions that are all "do something to a
  // reservation" but distinct in kind).
  CommunicationResend: "communication.resend",
} as const;

export type Permission = (typeof Permission)[keyof typeof Permission];

/**
 * Owner-approved role matrix — R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md
 * §18, as confirmed unchanged by the implementation assignment's §15.
 * reservation.walkin.create is included as its own permission per the
 * assignment's explicit matrix (the architecture proposal had argued for
 * collapsing it into reservation.create; the assignment's approved
 * matrix lists it separately, so it is implemented separately here —
 * the assignment is the more authoritative, later input).
 */
const ROLE_PERMISSIONS: Readonly<Record<ActorRole, ReadonlySet<Permission>>> = {
  [ActorRole.Owner]: new Set(Object.values(Permission)),
  [ActorRole.Manager]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationComplete,
    Permission.ReservationWalkinCreate,
    Permission.CapacitySettingsManage,
    Permission.AuditView,
    Permission.SeatingView,
    Permission.SeatingAssign,
    Permission.SeatingMove,
    Permission.SeatingRelease,
    // ResourceBlock mirrors CapacitySettingsManage's own distribution
    // (Owner + Manager only) — a bigger operational decision than an
    // ordinary seating action, per assignment §30.
    Permission.ResourceBlock,
    Permission.CommunicationResend,
  ]),
  [ActorRole.AssistantManager]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationComplete,
    Permission.ReservationWalkinCreate,
    Permission.SeatingView,
    Permission.SeatingAssign,
    Permission.SeatingMove,
    Permission.SeatingRelease,
    Permission.CommunicationResend,
  ]),
  [ActorRole.Supervisor]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationComplete,
    Permission.ReservationWalkinCreate,
    Permission.SeatingView,
    Permission.SeatingAssign,
    Permission.SeatingMove,
    Permission.SeatingRelease,
    Permission.CommunicationResend,
  ]),
  [ActorRole.ReservationAgent]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationWalkinCreate,
    Permission.SeatingView,
    Permission.SeatingAssign,
    Permission.SeatingMove,
    Permission.SeatingRelease,
    Permission.CommunicationResend,
    // No ReservationComplete — see R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §18.
  ]),
  [ActorRole.Reception]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.SeatingView,
    Permission.SeatingAssign,
    Permission.SeatingMove,
    Permission.SeatingRelease,
    Permission.ReservationWalkinCreate,
    Permission.CommunicationResend,
    // No ReservationComplete — see R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §18.
  ]),
};

export function hasPermission(role: ActorRole, permission: Permission): boolean {
  return ROLE_PERMISSIONS[role]?.has(permission) ?? false;
}

/**
 * Owner-protection invariant (R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md
 * §19) — independent of the permission grid above, checked separately by
 * any users.manage action so it holds even if the grid above were ever
 * misconfigured to grant users.manage more broadly. Not itself a
 * Permission: it is a rule about WHICH user a users.manage action may
 * target, not whether the actor holds users.manage at all.
 *
 *   - Only the Owner may act on the StaffUser account that currently
 *     holds the Owner role (including acting on themselves).
 *   - No users.manage action may ever set a target's role to Owner —
 *     Owner assignment is not a self-service admin action in this MVA
 *     (see bootstrap, application/auth/BootstrapOwner.ts).
 */
export function canManageTargetUser(input: {
  readonly actingRole: ActorRole;
  readonly actingUserId: string;
  readonly targetRole: ActorRole;
  readonly targetUserId: string;
  readonly requestedRole?: ActorRole;
}): boolean {
  if (input.requestedRole === ActorRole.Owner) {
    return false;
  }
  if (input.targetRole === ActorRole.Owner) {
    return input.actingRole === ActorRole.Owner && input.actingUserId === input.targetUserId;
  }
  return true;
}
