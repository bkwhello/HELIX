import path from "node:path";
import { fileURLToPath } from "node:url";
import express, { Express, NextFunction, Request, Response } from "express";
import { ReservationRepository } from "../domain/repositories/ReservationRepository.js";
import { ReservationId } from "../domain/value-objects/ReservationId.js";
import { Actor, ActorKind, ActorRole } from "../domain/value-objects/Actor.js";
import { CompletionEvidence } from "../domain/value-objects/CompletionEvidence.js";
import { PreferredArea } from "../domain/value-objects/PreferredArea.js";
import { CreateReservationHandler } from "../application/command-handlers/CreateReservationHandler.js";
import { ModifyReservationHandler } from "../application/command-handlers/ModifyReservationHandler.js";
import { ConfirmReservationHandler } from "../application/command-handlers/ConfirmReservationHandler.js";
import { CancelReservationHandler } from "../application/command-handlers/CancelReservationHandler.js";
import { CompleteReservationHandler } from "../application/command-handlers/CompleteReservationHandler.js";
import { ContactReader } from "../application/ports/ContactReader.js";
import { ServicePeriodReader } from "../application/ports/ServicePeriodReader.js";
import { DuplicateReservationChecker } from "../application/ports/DuplicateReservationChecker.js";
import { ClosingDayStore } from "../application/ports/ClosingDayStore.js";
import { IdGenerator } from "../application/ports/IdGenerator.js";
import { EventIdGenerator } from "../application/ports/EventIdGenerator.js";
import { Clock } from "../application/ports/Clock.js";

export interface AppDependencies {
  repository: ReservationRepository;
  duplicateChecker: DuplicateReservationChecker;
  contactReader: ContactReader;
  servicePeriodReader: ServicePeriodReader;
  closingDayStore: ClosingDayStore;
  idGenerator: IdGenerator;
  eventIdGenerator: EventIdGenerator;
  clock: Clock;
}

/**
 * CAP-D01.01 API layer. This is the only place in the codebase that
 * knows about HTTP. It translates requests into commands and Results
 * into status codes — it does not contain business rules itself.
 */
const publicDir = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "public");

export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.use(express.json());
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

  const createHandler = new CreateReservationHandler(
    deps.repository,
    deps.duplicateChecker,
    deps.contactReader,
    deps.servicePeriodReader,
    deps.closingDayStore,
    deps.idGenerator,
    deps.eventIdGenerator,
    deps.clock
  );
  const modifyHandler = new ModifyReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const confirmHandler = new ConfirmReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const cancelHandler = new CancelReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const completeHandler = new CompleteReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);

  function routeParam(req: Request, name: string): string {
    const value = req.params[name];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }

  function paramId(req: Request): string {
    return routeParam(req, "id");
  }

  const KNOWN_ACTOR_KINDS: readonly string[] = Object.values(ActorKind);
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

  /**
   * Placeholder actor resolution. A real deployment resolves this from an
   * authenticated session (see capability.md, Security) — not implemented
   * here, since authentication is a separate capability.
   *
   * Validates x-actor-kind against the known ActorKind values and fails
   * fast with a clear 400 if it's unrecognized, rather than letting a
   * typo (e.g. "Human" instead of "AuthorizedUser") silently fall through
   * to a confusing CAP-D01.01-R32/R33/... "unauthorized" rejection deep in
   * the domain layer. Returns null after already writing the response.
   */
  function resolveActor(req: Request, res: Response): Actor | null {
    const kindHeader = req.header("x-actor-kind");
    if (kindHeader !== undefined && !KNOWN_ACTOR_KINDS.includes(kindHeader)) {
      res.status(400).json({
        message: `Unknown x-actor-kind header: "${kindHeader}". Expected one of: ${KNOWN_ACTOR_KINDS.join(", ")}.`,
      });
      return null;
    }
    return {
      id: req.header("x-actor-id") ?? "unknown",
      kind: (kindHeader as ActorKind) ?? ActorKind.AuthorizedUser,
      role: req.header("x-actor-role") as ActorRole | undefined,
    };
  }

  app.get("/health", (_req: Request, res: Response) => {
    res.status(200).json({ status: "ok" });
  });

  app.post("/reservations", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      servicePeriodId: string;
      contactId: string;
      contactName?: string;
      reservationDate: string;
      partySize: number;
      source: { category: string; externalReference?: string; importedBy?: string };
      preferredArea?: string;
      notes?: string;
      isHistoricalCorrection?: boolean;
      historicalCorrectionReason?: string;
    };

    const actor = resolveActor(req, res);
    if (!actor) return;

    const preferredArea = parsePreferredArea(body.preferredArea, res);
    if (!preferredArea) return;

    const result = await createHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      servicePeriodId: body.servicePeriodId,
      contactId: body.contactId,
      contactName: body.contactName,
      reservationDate: new Date(body.reservationDate),
      partySize: body.partySize,
      source: body.source as never,
      preferredArea: preferredArea.present ? preferredArea.value : undefined,
      notes: body.notes,
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
  app.get("/reservations", async (req: Request, res: Response) => {
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

  app.get("/reservations/:id", async (req: Request, res: Response) => {
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

  app.patch("/reservations/:id", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      changes: { reservationDate?: string; partySize?: number; contactId?: string; servicePeriodId?: string; tableAssignment?: string; notes?: string };
      isServicePeriodStillValid?: boolean;
      isAuthorizedCorrection?: boolean;
      correctionReason?: string;
    };

    const actor = resolveActor(req, res);
    if (!actor) return;

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
        servicePeriodId: body.changes?.servicePeriodId,
        tableAssignment: body.changes?.tableAssignment,
        notes: body.changes?.notes,
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

  app.post("/reservations/:id/confirm", async (req: Request, res: Response) => {
    const body = req.body as { commandId: string; correlationId?: string; causationId?: string; isReservationDataValid?: boolean };
    const actor = resolveActor(req, res);
    if (!actor) return;

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

  app.post("/reservations/:id/cancel", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      reason?: string;
      reasonRequiredByPolicy?: boolean;
    };
    const actor = resolveActor(req, res);
    if (!actor) return;

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

  app.post("/reservations/:id/complete", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      evidence?: CompletionEvidence;
      isManualCompletion?: boolean;
      manualCompletionReason?: string;
    };
    const actor = resolveActor(req, res);
    if (!actor) return;

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

  // CAP-D01.01-R51 — closing-days management. Not part of the Reservation
  // aggregate; this is the "line where we can add special closing days"
  // requested for the pilot. See rule-model.md §16b for why this lives
  // here as a stopgap instead of in Availability Management. A closure is
  // a fromDate..toDate range (inclusive); a single closed day is a range
  // where toDate is omitted or equals fromDate.
  app.post("/closing-days", async (req: Request, res: Response) => {
    const body = req.body as { fromDate: string; toDate?: string; reason?: string };
    const actor = resolveActor(req, res);
    if (!actor) return;

    const fromDate = new Date(body.fromDate);
    const toDate = body.toDate ? new Date(body.toDate) : fromDate;
    if (Number.isNaN(fromDate.getTime()) || Number.isNaN(toDate.getTime())) {
      res.status(400).json({ message: "fromDate and toDate must be valid ISO dates (e.g. 2026-12-25)." });
      return;
    }

    const saved = await deps.closingDayStore.add({ fromDate, toDate, reason: body.reason, createdBy: actor.id });
    res.status(201).json(saved);
  });

  app.get("/closing-days", async (_req: Request, res: Response) => {
    const closingDays = await deps.closingDayStore.list();
    res.status(200).json({ closingDays });
  });

  app.delete("/closing-days/:id", async (req: Request, res: Response) => {
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
  app.get("/teppanyaki-occupancy", async (req: Request, res: Response) => {
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
  getPartySize(): number;
  getReservationDateTime(): Date;
  getSource(): { category: string };
  getPreferredArea(): string | undefined;
  getNotes(): string | undefined;
  getTableAssignment(): string | undefined;
}) {
  return {
    id: aggregate.getId().toString(),
    status: aggregate.getStatus(),
    servicePeriodId: aggregate.getServicePeriodId(),
    contactId: aggregate.getContactId(),
    contactName: aggregate.getContactName(),
    partySize: aggregate.getPartySize(),
    reservationDate: aggregate.getReservationDateTime().toISOString(),
    sourceCategory: aggregate.getSource().category,
    preferredArea: aggregate.getPreferredArea(),
    notes: aggregate.getNotes(),
    tableAssignment: aggregate.getTableAssignment(),
  };
}
