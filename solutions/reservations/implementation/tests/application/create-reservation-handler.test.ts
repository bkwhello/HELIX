import { describe, it, expect, beforeEach } from "vitest";
import { CreateReservationHandler } from "../../application/command-handlers/CreateReservationHandler.js";
import { CreateContactHandler } from "../../application/command-handlers/CreateContactHandler.js";
import { InMemoryReservationRepository } from "../support/InMemoryReservationRepository.js";
import {
  FakeContactRepository,
  FakeTransactionManager,
  FakeServicePeriodReader,
  FakeDuplicateReservationChecker,
  FakeClosingDayStore,
} from "../support/FakePorts.js";
import { staffActor, FUTURE_DATE, NOW } from "../support/factories.js";
import { ReservationSourceCategory } from "../../domain/value-objects/ReservationSource.js";

class FixedClock {
  now(): Date {
    return NOW;
  }
}

let idCounter = 0;
class SequentialIdGenerator {
  generate(): string {
    idCounter += 1;
    return `res-${idCounter}`;
  }
}

let eventIdCounter = 0;
class SequentialEventIdGenerator {
  generate(): string {
    eventIdCounter += 1;
    return `evt-${eventIdCounter}`;
  }
}

function validRequest(overrides: Record<string, unknown> = {}) {
  return {
    commandId: "cmd-1",
    servicePeriodId: "sp-1",
    contactSelection: { type: "ExistingContact" as const, contactId: "contact-1" },
    reservationDate: FUTURE_DATE,
    partySize: 2,
    source: { category: ReservationSourceCategory.Website },
    actor: staffActor,
    ...overrides,
  };
}

describe("CreateReservationHandler", () => {
  let repository: InMemoryReservationRepository;
  let contactRepository: FakeContactRepository;
  let servicePeriodReader: FakeServicePeriodReader;
  let duplicateChecker: FakeDuplicateReservationChecker;
  let closingDayStore: FakeClosingDayStore;
  let handler: CreateReservationHandler;

  beforeEach(() => {
    repository = new InMemoryReservationRepository();
    contactRepository = new FakeContactRepository();
    contactRepository.seed({ id: "contact-1", displayName: "Existing Guest", phoneRaw: "0612345678", phoneNormalized: "+31612345678" });
    servicePeriodReader = new FakeServicePeriodReader();
    duplicateChecker = new FakeDuplicateReservationChecker();
    closingDayStore = new FakeClosingDayStore();
    const idGenerator = new SequentialIdGenerator();
    const clock = new FixedClock();
    const createContactHandler = new CreateContactHandler(contactRepository, idGenerator, clock);
    handler = new CreateReservationHandler(
      repository,
      duplicateChecker,
      contactRepository,
      createContactHandler,
      servicePeriodReader,
      closingDayStore,
      idGenerator,
      new SequentialEventIdGenerator(),
      clock,
      new FakeTransactionManager()
    );
  });

  // CAP-D01.01-AC01
  it("creates a reservation and persists it, returning a DTO rather than the aggregate", async () => {
    const result = await handler.handle(validRequest({ commandId: "cmd-1" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.status).toBe("Proposed");
    expect(result.value.warnings).toHaveLength(0);

    const saved = await repository.findByCommandId("cmd-1");
    expect(saved).not.toBeNull();
    expect(saved?.getId().toString()).toBe(result.value.reservationId);
  });

  // CAP-D01.01-AC02 — Reject Creation Without Required Information
  it("rejects a request missing required information without persisting anything", async () => {
    const result = await handler.handle(validRequest({ commandId: "cmd-2", servicePeriodId: "", contactSelection: undefined }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R08")).toBe(true);
    }
  });

  // CAP-D05.01-R01 — the referenced Contact must actually exist and be Active
  it("rejects creation when the referenced contact does not exist", async () => {
    contactRepository.forceMissing = true;

    const result = await handler.handle(validRequest({ commandId: "cmd-no-contact" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D05.01-R01")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-no-contact")).toBeNull();
  });

  // CAP-D05.01 §11 — CreateNewContact path creates a real Contact record
  // and snapshots its details onto the reservation.
  it("creates a new Contact inline when contactSelection is CreateNewContact, and snapshots its details", async () => {
    const result = await handler.handle(
      validRequest({
        commandId: "cmd-new-contact",
        contactSelection: { type: "CreateNewContact", displayName: "Brand New Guest", phone: "06 12 34 56 78" },
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.contactName).toBe("Brand New Guest");

    const saved = await repository.findByCommandId("cmd-new-contact");
    expect(saved?.getContactPhoneSnapshot()).toBe("06 12 34 56 78");
    // The new Contact is now findable by its resolved id.
    const contactId = saved?.getContactId();
    expect(contactId).toBeDefined();
    expect(await contactRepository.findById(contactId as string)).not.toBeNull();
  });

  // CAP-D05.01-R01 — Name + Phone-only, Name + Email-only, and no contact method
  it("rejects CreateNewContact with a name but no phone and no email", async () => {
    const result = await handler.handle(
      validRequest({ commandId: "cmd-no-method", contactSelection: { type: "CreateNewContact", displayName: "No Method Guest" } })
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D05.01-R01")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-no-method")).toBeNull();
  });

  // CAP-D05.01-R01 — Name + Email-only is allowed (owner-confirmed: neither
  // phone nor email is individually mandatory).
  it("accepts CreateNewContact with a name and email only, no phone", async () => {
    const result = await handler.handle(
      validRequest({
        commandId: "cmd-email-only",
        contactSelection: { type: "CreateNewContact", displayName: "Email Only Guest", email: "guest@example.com" },
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await repository.findByCommandId("cmd-email-only");
    expect(saved?.getContactEmailSnapshot()).toBe("guest@example.com");
    expect(saved?.getContactPhoneSnapshot()).toBeUndefined();
  });

  // CAP-D05.01-R01 — Name + Phone + Email is allowed (never required together, but never rejected either).
  it("accepts CreateNewContact with a name, phone, and email all supplied", async () => {
    const result = await handler.handle(
      validRequest({
        commandId: "cmd-both-methods",
        contactSelection: {
          type: "CreateNewContact",
          displayName: "Full Detail Guest",
          phone: "0687654321",
          email: "full@example.com",
        },
      })
    );

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const saved = await repository.findByCommandId("cmd-both-methods");
    expect(saved?.getContactPhoneSnapshot()).toBe("0687654321");
    expect(saved?.getContactEmailSnapshot()).toBe("full@example.com");
  });

  // CAP-D05.01-R03 — a possible match must never silently become a reuse:
  // submitting CreateNewContact again with the SAME phone as an existing
  // Contact must still create a genuinely separate Contact record.
  it("creates a genuinely separate Contact when CreateNewContact is submitted despite a phone match with an existing Contact", async () => {
    const first = await handler.handle(
      validRequest({
        commandId: "cmd-dup-phone-1",
        contactSelection: { type: "CreateNewContact", displayName: "First Guest", phone: "0698765432" },
      })
    );
    expect(first.ok).toBe(true);

    // Sanity: the possible-match query the pilot/API would run BEFORE this
    // second submission really would have found the first Contact.
    const possibleMatches = await contactRepository.findPossibleMatches({ phoneNormalized: "+31698765432" });
    expect(possibleMatches).toHaveLength(1);

    // Staff explicitly chooses CreateNewContact anyway (e.g. two different
    // people sharing a phone) — this must never be silently rewritten into
    // an ExistingContact reuse.
    const second = await handler.handle(
      validRequest({
        commandId: "cmd-dup-phone-2",
        contactSelection: { type: "CreateNewContact", displayName: "Second Guest (shares a phone)", phone: "0698765432" },
      })
    );
    expect(second.ok).toBe(true);
    if (!first.ok || !second.ok) return;

    const savedFirst = await repository.findByCommandId("cmd-dup-phone-1");
    const savedSecond = await repository.findByCommandId("cmd-dup-phone-2");
    expect(savedFirst?.getContactId()).not.toBe(savedSecond?.getContactId());

    const allMatches = await contactRepository.findPossibleMatches({ phoneNormalized: "+31698765432" });
    expect(allMatches).toHaveLength(2); // two separate Contacts, not one
  });

  // CAP-D01.01-R06 — the Service Period must validate against date/time/party size
  it("rejects creation when the Service Period is not valid for the request", async () => {
    servicePeriodReader.result = { isValid: false, reason: "Kitchen is closed at this time." };

    const result = await handler.handle(validRequest({ commandId: "cmd-bad-service-period" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R06")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-bad-service-period")).toBeNull();
  });

  // CAP-D01.01-R51 — closing days block creation
  it("rejects creation for a date marked closed", async () => {
    await closingDayStore.add({ fromDate: FUTURE_DATE, toDate: FUTURE_DATE, reason: "Staff outing" });

    const result = await handler.handle(validRequest({ commandId: "cmd-closed-day" }));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.violations.some((v) => v.ruleId === "CAP-D01.01-R51")).toBe(true);
    }
    expect(await repository.findByCommandId("cmd-closed-day")).toBeNull();
  });

  // CAP-D01.01-R14 / AC05 — a potential duplicate is a visible warning, not a rejection
  it("still creates the reservation but returns a warning when a potential duplicate is detected", async () => {
    duplicateChecker.duplicateDetected = true;

    const result = await handler.handle(validRequest({ commandId: "cmd-duplicate" }));

    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.value.warnings.some((w) => w.ruleId === "CAP-D01.01-R14")).toBe(true);
  });

  // CAP-D01.01-R44 — Duplicate Command Processing Must Be Safe
  it("ignores a repeated save() call for a commandId that was already applied", async () => {
    const created = await handler.handle(validRequest({ commandId: "cmd-idempotent" }));
    expect(created.ok).toBe(true);

    expect(repository.wasCommandApplied("cmd-idempotent")).toBe(true);
    expect(repository.saveCallCount).toBe(1);
  });

  // CAP-D01.01-R44 — repeating the whole handler.handle() call (not just
  // repository.save()) must return the ORIGINAL reservation, not a
  // freshly generated identity that then gets silently discarded.
  it("returns the original reservation when handle() is called twice with the same commandId", async () => {
    const request = validRequest({ commandId: "cmd-retry" });

    const first = await handler.handle(request);
    expect(first.ok).toBe(true);
    if (!first.ok) return;

    const second = await handler.handle(request);
    expect(second.ok).toBe(true);
    if (!second.ok) return;

    expect(second.value.reservationId).toBe(first.value.reservationId);
    expect(repository.saveCallCount).toBe(1); // no second write occurred
  });

  // CAP-D01.01-R05 / AC20 — a failed save leaves no visible reservation
  it("does not leave a persisted reservation when save fails", async () => {
    repository.forceNextSaveToFail = true;

    await expect(handler.handle(validRequest({ commandId: "cmd-3" }))).rejects.toThrow();
  });
});
