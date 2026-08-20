import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { Express, NextFunction, Request, Response } from "express";
import { ReservationRepository } from "../domain/repositories/ReservationRepository.js";
import { ReservationId } from "../domain/value-objects/ReservationId.js";
import { CompletionEvidence } from "../domain/value-objects/CompletionEvidence.js";
import { PreferredArea } from "../domain/value-objects/PreferredArea.js";
import { CreateReservationHandler } from "../application/command-handlers/CreateReservationHandler.js";
import { ModifyReservationHandler } from "../application/command-handlers/ModifyReservationHandler.js";
import { ConfirmReservationHandler } from "../application/command-handlers/ConfirmReservationHandler.js";
import { CancelReservationHandler } from "../application/command-handlers/CancelReservationHandler.js";
import { CompleteReservationHandler } from "../application/command-handlers/CompleteReservationHandler.js";
import { ContactRepository, ContactRecord } from "../application/ports/ContactRepository.js";
import { CreateContactHandler } from "../application/command-handlers/CreateContactHandler.js";
import { normalizePhone } from "../domain/value-objects/PhoneNumber.js";
import { normalizeEmail } from "../domain/value-objects/EmailAddress.js";
import { ServicePeriodReader } from "../application/ports/ServicePeriodReader.js";
import { DuplicateReservationChecker } from "../application/ports/DuplicateReservationChecker.js";
import { ClosingDayStore } from "../application/ports/ClosingDayStore.js";
import { IdGenerator } from "../application/ports/IdGenerator.js";
import { EventIdGenerator } from "../application/ports/EventIdGenerator.js";
import { Clock } from "../application/ports/Clock.js";
import { CapacityRepository } from "../domain/repositories/CapacityRepository.js";
import { TransactionManager } from "../application/ports/TransactionManager.js";
import { AvailabilityOrchestrator } from "../application/availability/AvailabilityOrchestrator.js";
import { isCapacityPoolId } from "../domain/availability/CapacityPool.js";
import { StaffUserRepository } from "../domain/repositories/StaffUserRepository.js";
import { SessionRepository } from "../domain/repositories/SessionRepository.js";
import { PasswordHasher } from "../application/ports/PasswordHasher.js";
import { SessionTokenGenerator } from "../application/ports/SessionTokenGenerator.js";
import { LoginHandler } from "../application/auth/LoginHandler.js";
import { LogoutHandler } from "../application/auth/LogoutHandler.js";
import { CreateStaffUserHandler } from "../application/auth/CreateStaffUserHandler.js";
import { LoginThrottleGuard, LoginThrottleConfig } from "../application/auth/LoginThrottleGuard.js";
import { LoginAttemptTracker } from "../application/ports/LoginAttemptTracker.js";
import { Permission } from "../domain/rules/StaffAuthorizationPolicy.js";
import { CommunicationLanguage, isCommunicationLanguage } from "../domain/value-objects/CommunicationLanguage.js";
import { CommunicationOutboxRepository } from "../application/ports/CommunicationOutboxRepository.js";
import { GuestManagementCredentialRepository } from "../application/ports/GuestManagementCredentialRepository.js";
import { SessionTokenGenerator as GuestTokenGenerator } from "../application/ports/SessionTokenGenerator.js";
import { CommunicationOutboxService } from "../application/communications/CommunicationOutboxService.js";
import { GuestManagementTokenService } from "../application/communications/GuestManagementTokenService.js";
import { ResendConfirmationHandler } from "../application/communications/ResendConfirmationHandler.js";
import {
  SESSION_COOKIE_NAME,
  createRequireStaffSession,
  requirePermission,
  createCsrfGuard,
  principalToActor,
  parseCookieHeader,
} from "./authMiddleware.js";

// R1.2 — configurable, not architectural (R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md
// §11: exact session duration is operational policy). 12 hours is a
// reasonable default for surviving a normal shift without forcing a
// mid-service re-login; override via SESSION_LIFETIME_MS if needed.
export const DEFAULT_SESSION_LIFETIME_MS = 12 * 60 * 60 * 1000;

export interface AppDependencies {
  repository: ReservationRepository;
  duplicateChecker: DuplicateReservationChecker;
  /** CAP-D05.01 — Reservation Contact Management. Replaces the old ContactReader placeholder boundary; see infrastructure/persistence/PrismaContactRepository.ts. */
  contactRepository: ContactRepository;
  servicePeriodReader: ServicePeriodReader;
  closingDayStore: ClosingDayStore;
  idGenerator: IdGenerator;
  eventIdGenerator: EventIdGenerator;
  clock: Clock;
  /**
   * CAP-D05.01 — required unconditionally (unlike `capacity.transactionManager`
   * below, which only governs the optional CAP-D02.03 routes): creating a
   * NEW Contact as part of a plain (non-capacity-aware) reservation create
   * must be atomic with the reservation write even when `capacity` is not
   * supplied at all — see CreateReservationHandler and the R1.3-I1 report,
   * "Transaction Boundary".
   */
  transactionManager: TransactionManager;
  /**
   * CAP-D02.03 — optional so tests that don't need capacity-aware
   * routes at all can omit it. When omitted, the /availability/* routes
   * below are not mounted — there is no degraded/fake capacity
   * behavior, only "not available in this deployment."
   */
  capacity?: {
    readonly capacityRepository: CapacityRepository;
    readonly transactionManager: TransactionManager;
  };
  /**
   * R1.6-B — optional, same "not available in this deployment" posture as
   * `capacity` above: when omitted, confirmation/reminder enqueue is a
   * no-op (CreateReservationHandler's own optional-dependency handling)
   * and the resend route below is not mounted at all.
   */
  communications?: {
    readonly outboxRepository: CommunicationOutboxRepository;
    readonly credentialRepository: GuestManagementCredentialRepository;
    readonly tokenGenerator: GuestTokenGenerator;
  };
  /**
   * R1.2 — Identity & Access. NOT optional: every deployment of this API
   * must authenticate staff, so there is no "insecure mode" to fall back
   * to the way CAP-D02.03's capacity block above legitimately has one.
   * `expectedOrigin`/`cookieSecure` are separated out because they are
   * genuinely environment-dependent (dev/test vs a real deployment),
   * unlike the repositories, which are always real.
   */
  auth: {
    readonly staffUserRepository: StaffUserRepository;
    readonly sessionRepository: SessionRepository;
    readonly passwordHasher: PasswordHasher;
    readonly sessionTokenGenerator: SessionTokenGenerator;
    readonly sessionLifetimeMs?: number;
    readonly cookieSecure: boolean;
    readonly expectedOrigin?: string | null;
    /** R1.2 final P1 closure — login abuse protection. Not optional, same reasoning as the rest of `auth`: every deployment must throttle /auth/login. */
    readonly loginAttemptTracker: LoginAttemptTracker;
    readonly loginThrottleConfig?: LoginThrottleConfig;
  };
}

/**
 * CAP-D01.01 API layer. This is the only place in the codebase that
 * knows about HTTP. It translates requests into commands and Results
 * into status codes — it does not contain business rules itself.
 */
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp(deps: AppDependencies): Express {
  const app = express();
  // R1.2 final P1 closure — login abuse protection, source dimension.
  // Explicitly set (Express's own default), not left implicit: `req.ip`
  // must be the actual TCP peer address, never a client-spoofable
  // `X-Forwarded-For` header. This deployment has no reverse proxy in
  // front of it today (api/server.ts serves both the static UI and the
  // API directly) — if one is ever introduced, `trust proxy` MUST be set
  // to the exact number of trusted hops (or a trusted CIDR list) at that
  // time, not simply flipped to `true`/`1`, which would let ANY caller
  // set X-Forwarded-For and forge their apparent source address,
  // defeating the per-source throttle entirely. See
  // R1_2_LOGIN_ABUSE_PROTECTION_REPORT.md §7/§8 — this is a documented
  // production deployment prerequisite, not something guessed at here.
  app.set("trust proxy", false);
  app.use(express.json());
  // R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §20 — applied globally,
  // before any route, so no mutating endpoint (including /auth/login
  // itself) can be added later without CSRF coverage by accident.
  app.use(createCsrfGuard(deps.auth.expectedOrigin ?? null));
  // Pilot-only staff interface (see PILOT.md) — plain static HTML/JS, no
  // build step. Talks to the JSON endpoints below via fetch().
  app.use(express.static(publicDir));
  // The bare root has no page of its own (no public/index.html) — without
  // this, visiting http://localhost:PORT/ gives Express's default
  // "Cannot GET /", which is exactly the confusing error a non-technical
  // pilot user hits by typing the URL without /pilot.html.
  app.get("/", (_req: Request, res: Response) => {
    res.redirect("/pilot.html");
  });

  // CAP-D05.01 — the bounded Contact creation operation, composed into
  // CreateReservationHandler (mirroring how AvailabilityOrchestrator
  // composes CreateReservationHandler itself).
  const createContactHandler = new CreateContactHandler(deps.contactRepository, deps.idGenerator, deps.clock);

  // R1.6-B — only constructed when the deployment supplies communications
  // infrastructure (see AppDependencies.communications doc comment above).
  const communicationOutboxService = deps.communications
    ? new CommunicationOutboxService(deps.communications.outboxRepository, deps.repository, deps.clock)
    : undefined;
  const guestManagementTokenService = deps.communications
    ? new GuestManagementTokenService(deps.communications.tokenGenerator, deps.communications.credentialRepository, deps.clock)
    : undefined;
  const resendHandler = deps.communications
    ? new ResendConfirmationHandler(deps.repository, deps.communications.outboxRepository, deps.idGenerator, deps.clock)
    : null;

  const createHandler = new CreateReservationHandler(
    deps.repository,
    deps.duplicateChecker,
    deps.contactRepository,
    createContactHandler,
    deps.servicePeriodReader,
    deps.closingDayStore,
    deps.idGenerator,
    deps.eventIdGenerator,
    deps.clock,
    deps.transactionManager,
    communicationOutboxService,
    guestManagementTokenService
  );
  const modifyHandler = new ModifyReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const confirmHandler = new ConfirmReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const cancelHandler = new CancelReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const completeHandler = new CompleteReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);

  // CAP-D02.03 — only constructed when the deployment supplies capacity
  // infrastructure (see AppDependencies.capacity doc comment above).
  const availabilityOrchestrator = deps.capacity
    ? new AvailabilityOrchestrator(
        deps.repository,
        deps.capacity.capacityRepository,
        deps.capacity.transactionManager,
        deps.closingDayStore,
        deps.idGenerator,
        deps.clock,
        createHandler,
        modifyHandler,
        cancelHandler
      )
    : null;

  // R1.2 — Identity & Access.
  const sessionLifetimeMs = deps.auth.sessionLifetimeMs ?? DEFAULT_SESSION_LIFETIME_MS;
  const loginHandler = new LoginHandler(
    deps.auth.staffUserRepository,
    deps.auth.sessionRepository,
    deps.auth.passwordHasher,
    deps.auth.sessionTokenGenerator,
    deps.clock,
    sessionLifetimeMs
  );
  const logoutHandler = new LogoutHandler(deps.auth.sessionRepository);
  const createStaffUserHandler = new CreateStaffUserHandler(deps.auth.staffUserRepository, deps.auth.passwordHasher, deps.idGenerator);
  const loginThrottleGuard = new LoginThrottleGuard(deps.auth.loginAttemptTracker, deps.clock, deps.auth.loginThrottleConfig);
  const requireStaffSession = createRequireStaffSession({
    staffUserRepository: deps.auth.staffUserRepository,
    sessionRepository: deps.auth.sessionRepository,
    clock: deps.clock,
  });

  function routeParam(req: Request, name: string): string {
    const value = req.params[name];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }

  function paramId(req: Request): string {
    return routeParam(req, "id");
  }

  const KNOWN_PREFERRED_AREAS: readonly string[] = Object.values(PreferredArea);

  /** CAP-D01.01-R48: reject a garbage preferredArea with a clear 400 rather than silently persisting a typo. Absent/undefined is fine — it's a Warning-severity preference, not a required field. */
  function parsePreferredArea(value: unknown, res: Response): { present: true; value: PreferredArea } | { present: false } | null {
    if (value === undefined || value === null || value === "") return { present: false };
    if (typeof value !== "string" || !KNOWN_PREFERRED_AREAS.includes(value)) {
      res.status(400).json({
        message: `Unknown preferredArea: "${String(value)}". Expected one of: ${KNOWN_PREFERRED_AREAS.join(", ")}.`,
      });
      return null;
    }
    return { present: true, value: value as PreferredArea };
  }

  /** R1.6-B — assignment §4: staff must be able to specify nl/en explicitly; a garbage value is rejected with a clear 400 rather than silently defaulted. Absent is fine — CreateReservationHandler/ReservationAggregate.create() apply DEFAULT_COMMUNICATION_LANGUAGE. */
  function parseCommunicationLanguage(value: unknown, res: Response): { present: true; value: CommunicationLanguage } | { present: false } | null {
    if (value === undefined || value === null || value === "") return { present: false };
    if (typeof value !== "string" || !isCommunicationLanguage(value)) {
      res.status(400).json({ message: `Unknown communicationLanguage: "${String(value)}". Expected "nl" or "en".` });
      return null;
    }
    return { present: true, value };
  }

  /**
   * CAP-D05.01 — parses the request body's `contactSelection` into the
   * discriminated union CreateReservationHandler expects (assignment
   * §13 "Explicit Reuse vs Explicit New"). Returns null (after writing a
   * 400) for any shape that is not unambiguously one or the other — this
   * boundary must never guess.
   */
  function parseContactSelection(
    value: unknown,
    res: Response
  ): { readonly type: "ExistingContact"; readonly contactId: string } | { readonly type: "CreateNewContact"; readonly displayName: string; readonly phone?: string; readonly email?: string } | null {
    if (!value || typeof value !== "object") {
      res.status(400).json({ message: "contactSelection is required and must be an object." });
      return null;
    }
    const selection = value as { type?: string; contactId?: string; displayName?: string; phone?: string; email?: string };
    if (selection.type === "ExistingContact") {
      if (!selection.contactId) {
        res.status(400).json({ message: "contactSelection of type ExistingContact requires contactId." });
        return null;
      }
      return { type: "ExistingContact", contactId: selection.contactId };
    }
    if (selection.type === "CreateNewContact") {
      if (!selection.displayName) {
        res.status(400).json({ message: "contactSelection of type CreateNewContact requires displayName." });
        return null;
      }
      return { type: "CreateNewContact", displayName: selection.displayName, phone: selection.phone, email: selection.email };
    }
    res.status(400).json({ message: `Unknown contactSelection.type: "${String(selection.type)}". Expected "ExistingContact" or "CreateNewContact".` });
    return null;
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  // R1.2 — Identity & Access. §8: identical response whether the
  // username doesn't exist or the password is wrong — see
  // LoginHandler's INVALID_CREDENTIALS variants, all mapped to the same
  // 401 body here. R1.2 final P1 closure adds the throttle check/record
  // calls around it — see application/auth/LoginThrottleGuard.ts.
  app.post("/auth/login", async (req: Request, res: Response) => {
    const body = req.body as { username?: string; password?: string };
    const sourceAddress = req.ip ?? "unknown";
    // Used for throttle bucketing even when missing/malformed — the
    // limiter must treat "" the same as any other attempted username, so
    // an empty-body probe doesn't get a free pass around the per-username
    // dimension.
    const usernameForThrottling = body.username ?? "";

    if (await loginThrottleGuard.isThrottled({ username: usernameForThrottling, sourceAddress })) {
      res.status(429).json({ message: "Too many attempts. Try again later." });
      return;
    }

    if (!body.username || !body.password) {
      await loginThrottleGuard.recordFailure({ username: usernameForThrottling, sourceAddress });
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }
    const result = await loginHandler.handle({ username: body.username, password: body.password });
    if (result.type === "INVALID_CREDENTIALS") {
      await loginThrottleGuard.recordFailure({ username: body.username, sourceAddress });
      res.status(401).json({ message: "Invalid username or password." });
      return;
    }
    await loginThrottleGuard.recordSuccess({ username: body.username });
    res.cookie(SESSION_COOKIE_NAME, result.sessionToken, {
      httpOnly: true,
      secure: deps.auth.cookieSecure,
      sameSite: "lax",
      path: "/",
      // maxAge (a relative duration), not `expires` (an absolute Date):
      // `result.expiresAt` is computed from `deps.clock`, which in tests
      // is often a FixedClock returning an arbitrary fixed instant —
      // using it as an absolute cookie Expires would make a real cookie
      // jar (this API's own real client, or supertest's agent in tests)
      // see an already-past expiry relative to actual wall-clock time and
      // discard the cookie immediately. maxAge is computed by the cookie
      // library from the REAL current time, independent of any injected
      // application clock — correct in both production and tests. The
      // server's own session-validity check (authMiddleware.ts) still
      // authoritatively uses `deps.clock` against the DB-stored
      // `expiresAt`; this only affects when the BROWSER stops sending
      // the cookie, a client-side hint, not the security boundary.
      maxAge: sessionLifetimeMs,
    });
    res.status(200).json({
      staffUser: { id: result.staffUser.id, username: result.staffUser.username, displayName: result.staffUser.displayName, role: result.staffUser.role },
    });
  });

  app.post("/auth/logout", async (req: Request, res: Response) => {
    const token = parseCookieHeader(req.headers.cookie, SESSION_COOKIE_NAME);
    if (token) {
      await logoutHandler.handle({ sessionToken: token });
    }
    res.clearCookie(SESSION_COOKIE_NAME, { path: "/" });
    res.status(204).send();
  });

  // R1.2 §19 — Owner-only (users.manage). The minimal necessary write
  // path for Identity & Access to be usable by more than one person —
  // see R1_2_IDENTITY_ACCESS_IMPLEMENTATION_REPORT.md for why disable/
  // role-change/reset-credential endpoints were deliberately NOT built
  // in this pass ("do not create dormant endpoints" cuts the other way
  // for those: no evidence they're needed yet).
  app.post("/staff-users", requireStaffSession, requirePermission(Permission.UsersManage), async (req: Request, res: Response) => {
    const body = req.body as { username?: string; displayName?: string; email?: string; password?: string; role?: string };
    const result = await createStaffUserHandler.handle({
      username: body.username ?? "",
      displayName: body.displayName ?? "",
      email: body.email,
      password: body.password ?? "",
      role: body.role ?? "",
    });
    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(201).json(result.value);
  });

  app.post("/reservations", requireStaffSession, requirePermission(Permission.ReservationCreate), async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      servicePeriodId: string;
      contactSelection: unknown;
      reservationDate: string;
      partySize: number;
      source: { category: string; externalReference?: string; importedBy?: string };
      preferredArea?: string;
      notes?: string;
      communicationLanguage?: string;
      isHistoricalCorrection?: boolean;
      historicalCorrectionReason?: string;
    };

    // requireStaffSession has already run and attached req.staffPrincipal
    // — this cannot be undefined here, but the check keeps this function
    // typed without a non-null assertion.
    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const preferredArea = parsePreferredArea(body.preferredArea, res);
    if (!preferredArea) return;
    const communicationLanguage = parseCommunicationLanguage(body.communicationLanguage, res);
    if (!communicationLanguage) return;
    const contactSelection = parseContactSelection(body.contactSelection, res);
    if (!contactSelection) return;

    const result = await createHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      servicePeriodId: body.servicePeriodId,
      contactSelection,
      reservationDate: new Date(body.reservationDate),
      partySize: body.partySize,
      source: body.source as never,
      preferredArea: preferredArea.present ? preferredArea.value : undefined,
      notes: body.notes,
      communicationLanguage: communicationLanguage.present ? communicationLanguage.value : undefined,
      actor,
      isHistoricalCorrection: body.isHistoricalCorrection,
      historicalCorrectionReason: body.historicalCorrectionReason,
    });

    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(201).json(result.value);
  });

  // CAP-D01.01-AC34 — Today's Active Reservations Are Operationally
  // Discoverable. Defaults to today (deps.clock.now()) so "what's on the
  // books today" is a bare GET with no query string required.
  app.get("/reservations", requireStaffSession, requirePermission(Permission.ReservationView), async (req: Request, res: Response) => {
    const dateParam = req.query["date"];
    const date = typeof dateParam === "string" && dateParam.length > 0 ? new Date(dateParam) : deps.clock.now();
    if (Number.isNaN(date.getTime())) {
      res.status(400).json({ message: "date must be a valid ISO date (e.g. 2026-08-20)." });
      return;
    }

    const aggregates = await deps.repository.findByDate(date);
    res.status(200).json({
      date: date.toISOString().slice(0, 10),
      reservations: aggregates.map(serializeReservation),
    });
  });

  app.get("/reservations/:id", requireStaffSession, requirePermission(Permission.ReservationView), async (req: Request, res: Response) => {
    const idResult = ReservationId.create(paramId(req));
    if (!idResult.ok) {
      res.status(400).json({ violations: idResult.violations });
      return;
    }
    const aggregate = await deps.repository.findById(idResult.value);
    if (!aggregate) {
      res.status(404).json({ message: "Reservation not found." });
      return;
    }
    res.status(200).json(serializeReservation(aggregate));
  });

  app.patch("/reservations/:id", requireStaffSession, requirePermission(Permission.ReservationModify), async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      changes: {
        reservationDate?: string;
        partySize?: number;
        contactId?: string;
        contactName?: string;
        contactPhoneSnapshot?: string;
        contactEmailSnapshot?: string;
        source?: { category: string; externalReference?: string; importedBy?: string };
        servicePeriodId?: string;
        tableAssignment?: string;
        notes?: string;
        preferredArea?: string;
        arrivedAt?: string | null;
      };
      isServicePeriodStillValid?: boolean;
      isAuthorizedCorrection?: boolean;
      correctionReason?: string;
    };

    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const preferredArea = parsePreferredArea(body.changes?.preferredArea, res);
    if (!preferredArea) return;

    const result = await modifyHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor,
      changes: {
        reservationDate: body.changes?.reservationDate ? new Date(body.changes.reservationDate) : undefined,
        partySize: body.changes?.partySize,
        contactId: body.changes?.contactId,
        contactName: body.changes?.contactName,
        contactPhoneSnapshot: body.changes?.contactPhoneSnapshot,
        contactEmailSnapshot: body.changes?.contactEmailSnapshot,
        source: body.changes?.source as never,
        servicePeriodId: body.changes?.servicePeriodId,
        tableAssignment: body.changes?.tableAssignment,
        notes: body.changes?.notes,
        preferredArea: preferredArea.present ? preferredArea.value : undefined,
        arrivedAt:
          body.changes?.arrivedAt === undefined ? undefined : body.changes.arrivedAt === null ? null : new Date(body.changes.arrivedAt),
      },
      isServicePeriodStillValid: body.isServicePeriodStillValid,
      isAuthorizedCorrection: body.isAuthorizedCorrection,
      correctionReason: body.correctionReason,
    });

    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(204).send();
  });

  app.post("/reservations/:id/confirm", requireStaffSession, requirePermission(Permission.ReservationConfirm), async (req: Request, res: Response) => {
    const body = req.body as { commandId: string; correlationId?: string; causationId?: string; isReservationDataValid?: boolean };
    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const result = await confirmHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor,
      isReservationDataValid: body.isReservationDataValid ?? true,
    });
    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(204).send();
  });

  app.post("/reservations/:id/cancel", requireStaffSession, requirePermission(Permission.ReservationCancel), async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      reason?: string;
      reasonRequiredByPolicy?: boolean;
    };
    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const result = await cancelHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor,
      reason: body.reason,
      reasonRequiredByPolicy: body.reasonRequiredByPolicy,
    });
    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(204).send();
  });

  app.post("/reservations/:id/complete", requireStaffSession, requirePermission(Permission.ReservationComplete), async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      evidence?: CompletionEvidence;
      isManualCompletion?: boolean;
      manualCompletionReason?: string;
    };
    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const result = await completeHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor,
      evidence: body.evidence ? { ...body.evidence, recordedAt: new Date(body.evidence.recordedAt) } : undefined,
      isManualCompletion: body.isManualCompletion,
      manualCompletionReason: body.manualCompletionReason,
    });
    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(204).send();
  });

  // CAP-D02.03 — capacity-aware Create/Modify/Cancel. Separate routes from
  // the plain /reservations ones above (which remain capacity-unaware,
  // unchanged CAP-D01.01 behavior) rather than branching inside them, so
  // a caller always knows explicitly whether it is asking for a capacity
  // decision. Mounted only when the deployment supplies capacity
  // infrastructure (see AppDependencies.capacity).
  if (availabilityOrchestrator) {
    app.post("/availability/reservations", requireStaffSession, requirePermission(Permission.ReservationCreate), async (req: Request, res: Response) => {
      const body = req.body as {
        commandId: string;
        correlationId?: string;
        causationId?: string;
        servicePeriodId: string;
        contactSelection: unknown;
        reservationDate: string;
        partySize: number;
        source: { category: string; externalReference?: string; importedBy?: string };
        preferredArea?: string;
        notes?: string;
        communicationLanguage?: string;
      };

      if (!req.staffPrincipal) return;
      const actor = principalToActor(req.staffPrincipal);

      if (!body.preferredArea || !isCapacityPoolId(body.preferredArea)) {
        res.status(422).json({ message: `preferredArea must be one of the capacity-managed areas for a capacity-aware create. Received: ${String(body.preferredArea)}.` });
        return;
      }
      const communicationLanguage = parseCommunicationLanguage(body.communicationLanguage, res);
      if (!communicationLanguage) return;
      const contactSelection = parseContactSelection(body.contactSelection, res);
      if (!contactSelection) return;

      const result = await availabilityOrchestrator.createWithCapacity({
        commandId: body.commandId,
        correlationId: body.correlationId,
        causationId: body.causationId,
        servicePeriodId: body.servicePeriodId,
        contactSelection,
        reservationDate: new Date(body.reservationDate),
        partySize: body.partySize,
        source: body.source as never,
        preferredArea: body.preferredArea,
        notes: body.notes,
        communicationLanguage: communicationLanguage.present ? communicationLanguage.value : undefined,
        actor,
      });

      switch (result.type) {
        case "CREATED":
          res.status(201).json(result.outcome);
          return;
        case "CAPACITY_UNAVAILABLE":
          res.status(409).json({ availability: result.availability });
          return;
        case "BOOKING_POLICY_REJECTED":
          res.status(422).json({ policy: result.policy });
          return;
        case "VALIDATION_FAILED":
          res.status(422).json({ violations: result.violations });
          return;
      }
    });

    app.patch("/availability/reservations/:id", requireStaffSession, requirePermission(Permission.ReservationModify), async (req: Request, res: Response) => {
      const body = req.body as {
        commandId: string;
        correlationId?: string;
        causationId?: string;
        changes: {
          reservationDate?: string;
          partySize?: number;
          preferredArea?: string;
          contactId?: string;
          contactName?: string;
          source?: { category: string; externalReference?: string; importedBy?: string };
          servicePeriodId?: string;
          tableAssignment?: string;
          notes?: string;
        };
        isServicePeriodStillValid?: boolean;
      };

      if (!req.staffPrincipal) return;
      const actor = principalToActor(req.staffPrincipal);

      const preferredArea = parsePreferredArea(body.changes?.preferredArea, res);
      if (!preferredArea) return;

      const result = await availabilityOrchestrator.modifyWithCapacity({
        commandId: body.commandId,
        correlationId: body.correlationId,
        causationId: body.causationId,
        reservationId: paramId(req),
        actor,
        changes: {
          reservationDate: body.changes?.reservationDate ? new Date(body.changes.reservationDate) : undefined,
          partySize: body.changes?.partySize,
          contactId: body.changes?.contactId,
          contactName: body.changes?.contactName,
          source: body.changes?.source as never,
          servicePeriodId: body.changes?.servicePeriodId,
          tableAssignment: body.changes?.tableAssignment,
          notes: body.changes?.notes,
          preferredArea: preferredArea.present ? preferredArea.value : undefined,
        },
        isServicePeriodStillValid: body.isServicePeriodStillValid,
      });

      switch (result.type) {
        case "MODIFIED":
          res.status(204).send();
          return;
        case "CAPACITY_UNAVAILABLE":
          res.status(409).json({ availability: result.availability });
          return;
        case "BOOKING_POLICY_REJECTED":
          res.status(422).json({ policy: result.policy });
          return;
        case "NO_ACTIVE_COMMITMENT":
          res.status(422).json({ message: "This reservation has no active CAP-D02.03 capacity commitment to modify (it may predate capacity tracking)." });
          return;
        case "VALIDATION_FAILED":
          res.status(422).json({ violations: result.violations });
          return;
      }
    });

    app.post("/availability/reservations/:id/cancel", requireStaffSession, requirePermission(Permission.ReservationCancel), async (req: Request, res: Response) => {
      const body = req.body as { commandId: string; correlationId?: string; causationId?: string; reason?: string; reasonRequiredByPolicy?: boolean };
      if (!req.staffPrincipal) return;
      const actor = principalToActor(req.staffPrincipal);

      const result = await availabilityOrchestrator.cancelWithCapacity({
        commandId: body.commandId,
        correlationId: body.correlationId,
        causationId: body.causationId,
        reservationId: paramId(req),
        actor,
        reason: body.reason,
        reasonRequiredByPolicy: body.reasonRequiredByPolicy,
      });

      switch (result.type) {
        case "CANCELLED":
          res.status(204).send();
          return;
        case "VALIDATION_FAILED":
          res.status(422).json({ violations: result.violations });
          return;
      }
    });
  }

  // CAP-D01.01-R51 — closing-days management. Not part of the Reservation
  // aggregate; this is the "line where we can add special closing days"
  // requested for the pilot. See rule-model.md §16b for why this lives
  // here as a stopgap instead of in Availability Management. A closure is
  // a fromDate..toDate range (inclusive); a single closed day is a range
  // where toDate is omitted or equals fromDate.
  app.post("/closing-days", requireStaffSession, requirePermission(Permission.CapacitySettingsManage), async (req: Request, res: Response) => {
    const body = req.body as { fromDate: string; toDate?: string; reason?: string };
    if (!req.staffPrincipal) return;
    const actor = principalToActor(req.staffPrincipal);

    const fromDate = new Date(body.fromDate);
    const toDate = body.toDate ? new Date(body.toDate) : fromDate;
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      res.status(400).json({ message: "fromDate and toDate must be valid ISO dates (e.g. 2026-12-25)." });
      return;
    }

    const saved = await deps.closingDayStore.add({ fromDate, toDate, reason: body.reason, createdBy: actor.id });
    res.status(201).json(saved);
  });

  // R1.2 — a read, available to any authenticated staff member (not
  // gated behind capacity.settings.manage, which governs mutation only)
  // — closing-day context is operationally relevant to everyone booking
  // reservations, not just whoever manages the calendar.
  app.get("/closing-days", requireStaffSession, async (_req: Request, res: Response) => {
    const closingDays = await deps.closingDayStore.list();
    res.status(200).json({ closingDays });
  });

  app.delete("/closing-days/:id", requireStaffSession, requirePermission(Permission.CapacitySettingsManage), async (req: Request, res: Response) => {
    await deps.closingDayStore.remove(routeParam(req, "id"));
    res.status(204).send();
  });

  // Teppanyaki occupancy dashboard: for each of the next `days` calendar
  // days (default 14), the fraction of the 40-seat Teppanyaki capacity
  // already booked, per Service Period (lunch and dinner reuse the same
  // physical seats, so they are tracked separately, never summed
  // together). 40 is hardcoded pending a real Capacity Management
  // capability — there is nowhere else this number could come from yet.
  const TEPPANYAKI_CAPACITY = 40;
  app.get("/teppanyaki-occupancy", requireStaffSession, async (req: Request, res: Response) => {
    const fromParam = req.query["from"];
    const from = typeof fromParam === "string" && fromParam.length > 0 ? new Date(fromParam) : deps.clock.now();
    if (Number.isNaN(from.getTime())) {
      res.status(400).json({ message: "from must be a valid ISO date (e.g. 2026-08-20)." });
      return;
    }
    const daysParam = req.query["days"];
    const days = typeof daysParam === "string" && daysParam.length > 0 ? Number(daysParam) : 14;
    if (!Number.isInteger(days) || days < 1 || days > 60) {
      res.status(400).json({ message: "days must be an integer between 1 and 60." });
      return;
    }

    const rows: { date: string; servicePeriodId: string; bookedSeats: number; capacity: number; percentage: number; level: "green" | "orange" | "red" }[] = [];
    for (let i = 0; i < days; i += 1) {
      const date = new Date(from);
      date.setDate(date.getDate() + i);
      const aggregates = await deps.repository.findByDate(date);

      const byServicePeriod = new Map<string, number>();
      for (const aggregate of aggregates) {
        if (aggregate.getPreferredArea() !== "Teppanyaki") continue;
        const key = aggregate.getServicePeriodId();
        byServicePeriod.set(key, (byServicePeriod.get(key) ?? 0) + aggregate.getPartySize());
      }

      for (const [servicePeriodId, bookedSeats] of byServicePeriod) {
        const percentage = Math.round((bookedSeats / TEPPANYAKI_CAPACITY) * 100);
        const level = percentage >= 90 ? "red" : percentage >= 70 ? "orange" : "green";
        rows.push({ date: date.toISOString().slice(0, 10), servicePeriodId, bookedSeats, capacity: TEPPANYAKI_CAPACITY, percentage, level });
      }
    }

    res.status(200).json({ capacity: TEPPANYAKI_CAPACITY, days: rows });
  });

  // CAP-D05.01 — possible-match discovery (assignment §12). Read-only,
  // non-blocking: returns every Active Contact with an exact normalized
  // phone or email match, for staff to review BEFORE explicitly choosing
  // ExistingContact or CreateNewContact (assignment §13) — this route
  // never creates, reuses, or merges anything itself.
  app.get("/contacts/possible-matches", requireStaffSession, async (req: Request, res: Response) => {
    const phoneParam = req.query["phone"];
    const emailParam = req.query["email"];
    const phoneNormalized = typeof phoneParam === "string" && phoneParam.length > 0 ? normalizePhone(phoneParam) : undefined;
    const emailNormalized = typeof emailParam === "string" && emailParam.length > 0 ? normalizeEmail(emailParam) : undefined;
    if (!phoneNormalized && !emailNormalized) {
      res.status(200).json({ possibleMatches: [] });
      return;
    }
    const matches = await deps.contactRepository.findPossibleMatches({ phoneNormalized, emailNormalized });
    res.status(200).json({
      possibleMatches: matches.map((c: ContactRecord) => ({ id: c.id, displayName: c.displayName, phone: c.phoneRaw, email: c.emailRaw })),
    });
  });

  // R1.6-B — assignment §22/§23: staff-authenticated confirmation resend.
  // Only mounted when the deployment supplies communications
  // infrastructure (see AppDependencies.communications doc comment) —
  // same "not available in this deployment" posture as the /availability/*
  // routes above. CSRF is already covered globally (createCsrfGuard,
  // applied before every route in this file) — no additional CSRF
  // handling needed here specifically.
  if (resendHandler) {
    app.post(
      "/reservations/:id/communications/confirmation/resend",
      requireStaffSession,
      requirePermission(Permission.CommunicationResend),
      async (req: Request, res: Response) => {
        if (!req.staffPrincipal) return;
        const result = await resendHandler.handle({ reservationId: paramId(req) });
        switch (result.type) {
          case "RESENT":
            res.status(202).json({ status: "queued", messageId: result.messageId });
            return;
          case "NO_USABLE_EMAIL":
            res.status(422).json({ message: "This reservation has no usable email address on file — confirmation cannot be resent." });
            return;
          case "RESERVATION_NOT_FOUND":
            res.status(404).json({ message: "Reservation not found." });
            return;
        }
      }
    );
  }

  // Express 5 forwards a rejected promise from any async handler above to
  // this error middleware automatically. Anything reaching here is an
  // infrastructure fault, not an expected domain rejection (those already
  // returned a 422 above) — a real client (POS, staff app) still needs
  // JSON back, not Express's default HTML error page.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  app.use((err: unknown, _req: Request, res: Response, _next: NextFunction) => {
    // eslint-disable-next-line no-console
    console.error("Unhandled error in CAP-D01.01 API:", err);
    res.status(500).json({ message: "An unexpected error occurred. The reservation was not affected unless you receive a success response." });
  });

  return app;
}

function serializeReservation(aggregate: {
  getId(): { toString(): string };
  getStatus(): string;
  getServicePeriodId(): string;
  getContactId(): string;
  getContactName(): string | undefined;
  getContactPhoneSnapshot(): string | undefined;
  getContactEmailSnapshot(): string | undefined;
  getPartySize(): number;
  getReservationDateTime(): Date;
  getSource(): { category: string };
  getPreferredArea(): string | undefined;
  getNotes(): string | undefined;
  getTableAssignment(): string | undefined;
  getArrivedAt(): Date | undefined;
}) {
  return {
    id: aggregate.getId().toString(),
    status: aggregate.getStatus(),
    servicePeriodId: aggregate.getServicePeriodId(),
    contactId: aggregate.getContactId(),
    contactName: aggregate.getContactName(),
    contactPhoneSnapshot: aggregate.getContactPhoneSnapshot(),
    contactEmailSnapshot: aggregate.getContactEmailSnapshot(),
    partySize: aggregate.getPartySize(),
    reservationDate: aggregate.getReservationDateTime().toISOString(),
    sourceCategory: aggregate.getSource().category,
    preferredArea: aggregate.getPreferredArea(),
    notes: aggregate.getNotes(),
    tableAssignment: aggregate.getTableAssignment(),
    arrivedAt: aggregate.getArrivedAt()?.toISOString(),
  };
}
