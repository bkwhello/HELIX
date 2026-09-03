import { Result, ok, fail } from "../../domain/shared/Result.js";
import { Actor } from "../../domain/value-objects/Actor.js";
import { PhoneNumber } from "../../domain/value-objects/PhoneNumber.js";
import { EmailAddress } from "../../domain/value-objects/EmailAddress.js";
import { checkContactCreationRules } from "../../domain/rules/ContactRules.js";
import { ContactRepository, ContactRecord } from "../ports/ContactRepository.js";
import { IdGenerator } from "../ports/IdGenerator.js";
import { Clock } from "../ports/Clock.js";
import { TransactionContext } from "../../domain/shared/TransactionContext.js";

export interface CreateContactRequest {
  readonly displayName: string;
  readonly phone?: string;
  readonly email?: string;
  /** P1-B2 — internal-only; see ContactRules.ts's ContactCreationInput.contactMethodRequired doc comment. Never set from an HTTP request body. */
  readonly contactMethodRequired?: boolean;
  /** CAP-D05.01-I1 assignment §11: staff attribution via a trusted R1.2 actor. */
  readonly actor: Actor;
  readonly tx?: TransactionContext;
}

/**
 * CAP-D05.01 — the bounded Contact creation operation (assignment §11).
 * Deliberately narrow: validate name + at least one contact method,
 * normalize, persist. No possible-match discovery here — that is a
 * separate, non-blocking query the caller runs BEFORE deciding to reach
 * this operation at all (see ContactRepository.findPossibleMatches and
 * the /contacts/possible-matches route), so staff's choice to create a
 * new Contact rather than reuse an existing one is always explicit
 * (assignment §13), never made by this handler.
 */
export class CreateContactHandler {
  constructor(
    private readonly contactRepository: ContactRepository,
    private readonly idGenerator: IdGenerator,
    private readonly clock: Clock
  ) {}

  async handle(request: CreateContactRequest): Promise<Result<ContactRecord>> {
    const violations = checkContactCreationRules(request);
    if (violations.length > 0) return fail(violations);

    const now = this.clock.now();
    const phone = request.phone ? PhoneNumber.create(request.phone) : undefined;
    const email = request.email ? EmailAddress.create(request.email) : undefined;
    // checkContactCreationRules already validated these — safe to assume ok here.
    const phoneNumber = phone && phone.ok ? phone.value : undefined;
    const emailAddress = email && email.ok ? email.value : undefined;

    const created = await this.contactRepository.create({
      id: this.idGenerator.generate(),
      displayName: request.displayName.trim(),
      phoneRaw: phoneNumber?.getRaw(),
      phoneNormalized: phoneNumber?.getNormalized(),
      emailRaw: emailAddress?.getRaw(),
      emailNormalized: emailAddress?.getNormalized(),
      createdBy: request.actor.id,
      now,
      tx: request.tx,
    });

    return ok(created);
  }
}
