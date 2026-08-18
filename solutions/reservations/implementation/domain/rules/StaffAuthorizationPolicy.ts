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
  ]),
  [ActorRole.AssistantManager]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationComplete,
    Permission.ReservationWalkinCreate,
  ]),
  [ActorRole.Supervisor]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationComplete,
    Permission.ReservationWalkinCreate,
  ]),
  [ActorRole.ReservationAgent]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationWalkinCreate,
    // No ReservationComplete — see R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §18.
  ]),
  [ActorRole.Reception]: new Set([
    Permission.ReservationView,
    Permission.ReservationCreate,
    Permission.ReservationModify,
    Permission.ReservationCancel,
    Permission.ReservationConfirm,
    Permission.ReservationWalkinCreate,
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
