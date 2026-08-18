import { describe, it, expect } from "vitest";
import { Permission, hasPermission, canManageTargetUser } from "../../domain/rules/StaffAuthorizationPolicy.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";

/**
 * R1.2 §15 — the owner-approved role matrix, exhaustively, so any future
 * edit to StaffAuthorizationPolicy.ts that silently changes a grant is
 * caught here rather than discovered at a live endpoint.
 */
const EXPECTED_MATRIX: Record<ActorRole, Partial<Record<Permission, boolean>>> = {
  [ActorRole.Owner]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: true,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: true,
    [Permission.SystemSettingsManage]: true,
    [Permission.UsersManage]: true,
    [Permission.AuditView]: true,
  },
  [ActorRole.Manager]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: true,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: true,
    [Permission.SystemSettingsManage]: false,
    [Permission.UsersManage]: false,
    [Permission.AuditView]: true,
  },
  [ActorRole.AssistantManager]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: true,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: false,
    [Permission.SystemSettingsManage]: false,
    [Permission.UsersManage]: false,
  },
  [ActorRole.Supervisor]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: true,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: false,
    [Permission.SystemSettingsManage]: false,
    [Permission.UsersManage]: false,
  },
  [ActorRole.ReservationAgent]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: false,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: false,
    [Permission.SystemSettingsManage]: false,
    [Permission.UsersManage]: false,
  },
  [ActorRole.Reception]: {
    [Permission.ReservationView]: true,
    [Permission.ReservationCreate]: true,
    [Permission.ReservationModify]: true,
    [Permission.ReservationCancel]: true,
    [Permission.ReservationConfirm]: true,
    [Permission.ReservationComplete]: false,
    [Permission.ReservationWalkinCreate]: true,
    [Permission.CapacitySettingsManage]: false,
    [Permission.SystemSettingsManage]: false,
    [Permission.UsersManage]: false,
  },
};

describe("hasPermission — exhaustive owner-approved role matrix", () => {
  for (const role of Object.values(ActorRole)) {
    for (const permission of Object.values(Permission)) {
      const expected = EXPECTED_MATRIX[role]?.[permission] ?? false;
      it(`${role} ${expected ? "HAS" : "does NOT have"} ${permission}`, () => {
        expect(hasPermission(role, permission)).toBe(expected);
      });
    }
  }
});

describe("canManageTargetUser — Owner-protection invariant (R1.2 §19)", () => {
  it("allows a non-Owner action targeting a non-Owner user", () => {
    expect(
      canManageTargetUser({ actingRole: ActorRole.Owner, actingUserId: "owner-1", targetRole: ActorRole.Reception, targetUserId: "u-1" })
    ).toBe(true);
  });

  it("denies any action targeting the Owner account when the actor is not the Owner", () => {
    expect(
      canManageTargetUser({ actingRole: ActorRole.Manager, actingUserId: "mgr-1", targetRole: ActorRole.Owner, targetUserId: "owner-1" })
    ).toBe(false);
  });

  it("allows the Owner to act on their own account", () => {
    expect(
      canManageTargetUser({ actingRole: ActorRole.Owner, actingUserId: "owner-1", targetRole: ActorRole.Owner, targetUserId: "owner-1" })
    ).toBe(true);
  });

  it("denies setting a target's role to Owner, even when the actor IS the Owner acting on a different user", () => {
    expect(
      canManageTargetUser({
        actingRole: ActorRole.Owner,
        actingUserId: "owner-1",
        targetRole: ActorRole.Manager,
        targetUserId: "mgr-1",
        requestedRole: ActorRole.Owner,
      })
    ).toBe(false);
  });

  it("denies a Manager attempting to disable/reset/role-change the Owner even if users.manage were ever misconfigured to grant Manager access", () => {
    // This models the defense-in-depth property directly: even granting
    // the action past a (hypothetically misconfigured) permission check,
    // this independent invariant still says no.
    expect(
      canManageTargetUser({ actingRole: ActorRole.Manager, actingUserId: "mgr-1", targetRole: ActorRole.Owner, targetUserId: "owner-1" })
    ).toBe(false);
  });
});
