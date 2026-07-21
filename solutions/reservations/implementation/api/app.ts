import express, { Express, Request, Response } from "express";
import { ReservationRepository } from "../domain/repositories/ReservationRepository.js";
import { ReservationId } from "../domain/value-objects/ReservationId.js";
import { Actor, ActorKind, ActorRole } from "../domain/value-objects/Actor.js";
import { CompletionEvidence } from "../domain/value-objects/CompletionEvidence.js";
import { CreateReservationHandler } from "../application/command-handlers/CreateReservationHandler.js";
import { ModifyReservationHandler } from "../application/command-handlers/ModifyReservationHandler.js";
import { ConfirmReservationHandler } from "../application/command-handlers/ConfirmReservationHandler.js";
import { CancelReservationHandler } from "../application/command-handlers/CancelReservationHandler.js";
import { CompleteReservationHandler } from "../application/command-handlers/CompleteReservationHandler.js";
import { ContactReader } from "../application/ports/ContactReader.js";
import { ServicePeriodReader } from "../application/ports/ServicePeriodReader.js";
import { DuplicateReservationChecker } from "../application/ports/DuplicateReservationChecker.js";
import { IdGenerator } from "../application/ports/IdGenerator.js";
import { EventIdGenerator } from "../application/ports/EventIdGenerator.js";
import { Clock } from "../application/ports/Clock.js";

export interface AppDependencies {
  repository: ReservationRepository;
  duplicateChecker: DuplicateReservationChecker;
  contactReader: ContactReader;
  servicePeriodReader: ServicePeriodReader;
  idGenerator: IdGenerator;
  eventIdGenerator: EventIdGenerator;
  clock: Clock;
}

/**
 * CAP-D01.01 API layer. This is the only place in the codebase that
 * knows about HTTP. It translates requests into commands and Results
 * into status codes — it does not contain business rules itself.
 */
export function createApp(deps: AppDependencies): Express {
  const app = express();
  app.use(express.json());

  const createHandler = new CreateReservationHandler(
    deps.repository,
    deps.duplicateChecker,
    deps.contactReader,
    deps.servicePeriodReader,
    deps.idGenerator,
    deps.eventIdGenerator,
    deps.clock
  );
  const modifyHandler = new ModifyReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const confirmHandler = new ConfirmReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const cancelHandler = new CancelReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);
  const completeHandler = new CompleteReservationHandler(deps.repository, deps.eventIdGenerator, deps.clock);

  function paramId(req: Request): string {
    const value = req.params["id"];
    return Array.isArray(value) ? (value[0] ?? "") : (value ?? "");
  }

  function actorFromHeader(req: Request): Actor {
    // Placeholder actor resolution. A real deployment resolves this from
    // an authenticated session (see capability.md, Security) — not
    // implemented here, since authentication is a separate capability.
    return {
      id: (req.header("x-actor-id") as string) ?? "unknown",
      kind: (req.header("x-actor-kind") as ActorKind) ?? ActorKind.AuthorizedUser,
      role: req.header("x-actor-role") as ActorRole | undefined,
    };
  }

  app.post("/reservations", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      servicePeriodId: string;
      contactId: string;
      reservationDate: string;
      partySize: number;
      source: { category: string; externalReference?: string; importedBy?: string };
      isHistoricalCorrection?: boolean;
      historicalCorrectionReason?: string;
    };

    const result = await createHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      servicePeriodId: body.servicePeriodId,
      contactId: body.contactId,
      reservationDate: new Date(body.reservationDate),
      partySize: body.partySize,
      source: body.source as never,
      actor: actorFromHeader(req),
      isHistoricalCorrection: body.isHistoricalCorrection,
      historicalCorrectionReason: body.historicalCorrectionReason,
    });

    if (!result.ok) {
      res.status(422).json({ violations: result.violations });
      return;
    }
    res.status(201).json(result.value);
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
    res.status(200).json({
      id: aggregate.getId().toString(),
      status: aggregate.getStatus(),
      servicePeriodId: aggregate.getServicePeriodId(),
      contactId: aggregate.getContactId(),
      partySize: aggregate.getPartySize(),
      reservationDate: aggregate.getReservationDateTime().toISOString(),
    });
  });

  app.patch("/reservations/:id", async (req: Request, res: Response) => {
    const body = req.body as {
      commandId: string;
      correlationId?: string;
      causationId?: string;
      changes: { reservationDate?: string; partySize?: number; contactId?: string; servicePeriodId?: string };
      isServicePeriodStillValid?: boolean;
      isAuthorizedCorrection?: boolean;
      correctionReason?: string;
    };

    const result = await modifyHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor: actorFromHeader(req),
      changes: {
        reservationDate: body.changes?.reservationDate ? new Date(body.changes.reservationDate) : undefined,
        partySize: body.changes?.partySize,
        contactId: body.changes?.contactId,
        servicePeriodId: body.changes?.servicePeriodId,
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
    const result = await confirmHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor: actorFromHeader(req),
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
    const result = await cancelHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor: actorFromHeader(req),
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
    const result = await completeHandler.handle({
      commandId: body.commandId,
      correlationId: body.correlationId,
      causationId: body.causationId,
      reservationId: paramId(req),
      actor: actorFromHeader(req),
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

  return app;
}
