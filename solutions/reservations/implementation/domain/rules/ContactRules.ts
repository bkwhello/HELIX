import { RuleViolation, violation } from "../shared/Result.js";
import { PhoneNumber } from "../value-objects/PhoneNumber.js";
import { EmailAddress } from "../value-objects/EmailAddress.js";

export interface ContactCreationInput {
  readonly displayName: string;
  readonly phone?: string;
  readonly email?: string;
}

/**
 * CAP-D05.01-R01 — A Contact Requires a Name and a Usable Contact
 * Method. Owner-confirmed (R1.3-I1 assignment §2 "Minimum reservation
 * contact requirement"): Name + Phone, Name + Email, and Name + Phone +
 * Email are all allowed; Name only, Phone only, Email only, and no name
 * are all rejected. A Contact never requires both phone and email.
 */
export function checkContactCreationRules(input: ContactCreationInput): RuleViolation[] {
  const violations: RuleViolation[] = [];

  if (!input.displayName || input.displayName.trim().length === 0) {
    violations.push(violation("CAP-D05.01-R01", "A Contact requires a display name."));
  }

  const hasPhone = Boolean(input.phone && input.phone.trim().length > 0);
  const hasEmail = Boolean(input.email && input.email.trim().length > 0);
  if (!hasPhone && !hasEmail) {
    violations.push(violation("CAP-D05.01-R01", "A Contact requires at least one contact method: phone or email."));
  }

  if (hasPhone) {
    const phoneResult = PhoneNumber.create(input.phone as string);
    if (!phoneResult.ok) violations.push(...phoneResult.violations);
  }
  if (hasEmail) {
    const emailResult = EmailAddress.create(input.email as string);
    if (!emailResult.ok) violations.push(...emailResult.violations);
  }

  return violations;
}
