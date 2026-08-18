import { StaffUserRepository } from "../../domain/repositories/StaffUserRepository.js";
import { Username } from "../../domain/value-objects/Username.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { RuleViolation, Result, ok, fail, violation } from "../../domain/shared/Result.js";
import { PasswordHasher } from "../ports/PasswordHasher.js";
import { IdGenerator } from "../ports/IdGenerator.js";

const MIN_PASSWORD_LENGTH = 8;
const KNOWN_ROLES: readonly ActorRole[] = Object.values(ActorRole);

export interface CreateStaffUserRequest {
  readonly username: string;
  readonly displayName: string;
  readonly email?: string;
  readonly password: string;
  readonly role: string;
}

export interface CreateStaffUserOutcome {
  readonly id: string;
  readonly username: string;
  readonly displayName: string;
  readonly role: ActorRole;
}

/**
 * R1.2 §19 — Owner-only in practice (enforced by the caller's route-level
 * permission check, users.manage), but the "never create a second Owner"
 * rule is enforced HERE too, independent of who is allowed to call this
 * at all — so it holds even if users.manage were ever misconfigured to
 * grant more broadly than intended. See
 * domain/rules/StaffAuthorizationPolicy.ts's canManageTargetUser, which
 * this mirrors for the creation case (no existing target user to check
 * against yet, so only the "requested role is Owner" half applies).
 */
export class CreateStaffUserHandler {
  constructor(
    private readonly staffUserRepository: StaffUserRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly idGenerator: IdGenerator
  ) {}

  async handle(request: CreateStaffUserRequest): Promise<Result<CreateStaffUserOutcome>> {
    const violations: RuleViolation[] = [];

    const usernameResult = Username.create(request.username);
    if (!usernameResult.ok) violations.push(...usernameResult.violations);

    if (!request.displayName || request.displayName.trim().length === 0) {
      violations.push(violation("R1.2-IA-02", "displayName is required."));
    }

    if (!KNOWN_ROLES.includes(request.role as ActorRole)) {
      violations.push(violation("R1.2-IA-03", `Unknown role: "${request.role}".`));
    } else if (request.role === ActorRole.Owner) {
      // R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §19 — Owner is never
      // assigned via ordinary user management, at creation or otherwise.
      violations.push(violation("R1.2-IA-04", "The Owner role cannot be assigned through staff user creation."));
    }

    if (!request.password || request.password.length < MIN_PASSWORD_LENGTH) {
      violations.push(violation("R1.2-IA-05", `Password must be at least ${MIN_PASSWORD_LENGTH} characters.`));
    }

    if (violations.length > 0) return fail(violations);
    if (!usernameResult.ok) return fail(violations); // unreachable given the push above, but narrows the type for TS

    const existing = await this.staffUserRepository.findByUsername(usernameResult.value.toString());
    if (existing) {
      return fail([violation("R1.2-IA-06", `Username "${usernameResult.value.toString()}" is already taken.`)]);
    }

    const passwordHash = await this.passwordHasher.hash(request.password);
    const created = await this.staffUserRepository.create({
      id: this.idGenerator.generate(),
      username: usernameResult.value.toString(),
      displayName: request.displayName.trim(),
      email: request.email?.trim() || null,
      passwordHash,
      role: request.role as ActorRole,
    });

    return ok({ id: created.id, username: created.username, displayName: created.displayName, role: created.role });
  }
}
