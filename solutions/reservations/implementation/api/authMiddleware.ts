import { Request, Response, NextFunction } from "express";
import { StaffUserRepository } from "../domain/repositories/StaffUserRepository.js";
import { SessionRepository } from "../domain/repositories/SessionRepository.js";
import { hashSessionToken } from "../domain/shared/hashSessionToken.js";
import { StaffUserStatus } from "../domain/value-objects/StaffUserStatus.js";
import { Actor, ActorKind, ActorRole } from "../domain/value-objects/Actor.js";
import { Permission, hasPermission } from "../domain/rules/StaffAuthorizationPolicy.js";
import { Clock } from "../application/ports/Clock.js";

/**
 * R1.2 — Identity & Access. The production trust boundary:
 * cookie -> session lookup -> StaffUser lookup -> status check ->
 * StaffPrincipal. Nothing here ever reads x-actor-* — see api/app.ts,
 * where resolveActor() has been deleted entirely, not merely bypassed.
 */
export const SESSION_COOKIE_NAME = "helix_session";
/**
 * R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §20 — SameSite=Lax alone is
 * deliberately not relied on. A cross-site request cannot set an
 * arbitrary custom header without triggering a CORS preflight, which a
 * correctly-configured same-origin deployment refuses — so the browser
 * never sends the real mutating request at all.
 */
export const CSRF_HEADER_NAME = "x-helix-client";

export interface StaffPrincipal {
  readonly staffUserId: string;
  readonly role: ActorRole;
  readonly displayName: string;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      staffPrincipal?: StaffPrincipal;
    }
  }
}

/** The server constructs this; the browser never does (§13/§22 of the architecture doc). */
export function principalToActor(principal: StaffPrincipal): Actor {
  return { id: principal.staffUserId, kind: ActorKind.AuthorizedUser, role: principal.role };
}

/** No cookie-parser dependency — reading one named cookie out of the raw header is a few lines, not worth a new dependency for. */
export function parseCookieHeader(header: string | undefined, name: string): string | undefined {
  if (!header) return undefined;
  for (const part of header.split(";")) {
    const eq = part.indexOf("=");
    if (eq === -1) continue;
    if (part.slice(0, eq).trim() === name) {
      try {
        return decodeURIComponent(part.slice(eq + 1).trim());
      } catch {
        return undefined;
      }
    }
  }
  return undefined;
}

const UNAUTHENTICATED = { message: "Authentication required." } as const;

export function createRequireStaffSession(deps: {
  readonly staffUserRepository: StaffUserRepository;
  readonly sessionRepository: SessionRepository;
  readonly clock: Clock;
}) {
  return async function requireStaffSession(req: Request, res: Response, next: NextFunction): Promise<void> {
    const rawToken = parseCookieHeader(req.headers.cookie, SESSION_COOKIE_NAME);
    if (!rawToken) {
      res.status(401).json(UNAUTHENTICATED);
      return;
    }

    const session = await deps.sessionRepository.findByHashedToken(hashSessionToken(rawToken));
    if (!session || session.revokedAt !== null || session.expiresAt.getTime() <= deps.clock.now().getTime()) {
      res.status(401).json(UNAUTHENTICATED);
      return;
    }

    // Live re-read, every request — see StaffSession's schema doc comment
    // and R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §9: no role/status is
    // ever cached in the session, so a disable or role change is
    // effective on the very next request, not the next login.
    const staffUser = await deps.staffUserRepository.findById(session.staffUserId);
    if (!staffUser || staffUser.status !== StaffUserStatus.Active) {
      res.status(401).json(UNAUTHENTICATED);
      return;
    }

    req.staffPrincipal = { staffUserId: staffUser.id, role: staffUser.role, displayName: staffUser.displayName };
    next();
  };
}

/**
 * A valid session alone is not enough (§16 of the implementation
 * assignment) — this is the separate, centralized permission check.
 * "Authenticated but forbidden" (403) is distinguished from
 * "unauthenticated" (401, from requireStaffSession above), without
 * leaking WHY a permission was denied beyond that it was.
 */
export function requirePermission(permission: Permission) {
  return function (req: Request, res: Response, next: NextFunction): void {
    const principal = req.staffPrincipal;
    if (!principal) {
      res.status(401).json(UNAUTHENTICATED);
      return;
    }
    if (!hasPermission(principal.role, permission)) {
      res.status(403).json({ message: "You do not have permission to perform this action." });
      return;
    }
    next();
  };
}

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);

/**
 * R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §20/§21 — applied globally
 * to every mutating request, including /auth/login itself (a stolen
 * ambient session isn't the only risk a cookie-based design introduces;
 * "login CSRF," logging a victim into an attacker's account, is a real,
 * separate pattern the same custom-header check also closes).
 *
 * `expectedOrigin` is null in dev/test by default — only the custom
 * header is enforced then. Production deployments should set it (see
 * api/server.ts) so the Origin check is also active.
 */
export function createCsrfGuard(expectedOrigin: string | null) {
  return function csrfGuard(req: Request, res: Response, next: NextFunction): void {
    if (!MUTATING_METHODS.has(req.method)) {
      next();
      return;
    }
    if (req.header(CSRF_HEADER_NAME) === undefined) {
      res.status(403).json({ message: "Missing required client header." });
      return;
    }
    const origin = req.header("origin");
    if (expectedOrigin !== null && origin !== null && origin !== undefined && origin !== expectedOrigin) {
      res.status(403).json({ message: "Cross-origin request rejected." });
      return;
    }
    next();
  };
}
