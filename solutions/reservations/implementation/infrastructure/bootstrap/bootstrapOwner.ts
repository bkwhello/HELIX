/**
 * R1.2 §26/§29 — one-time Owner bootstrap. NOT an HTTP route: invoked
 * directly (`npm run bootstrap-owner`), reads credentials from
 * environment variables, and is safe to leave installed indefinitely
 * because its actual gate is the database, not "remembering to remove an
 * endpoint":
 *
 *   - A friendly pre-check (staffUserRepository.ownerExists()) reports a
 *     clear "an Owner already exists" outcome and exits without writing.
 *   - The AUTHORITATIVE gate is the partial UNIQUE index on
 *     staff_users(role) WHERE role = 'Owner' (see the migration) — even
 *     a raced second invocation (two processes started at once) cannot
 *     both succeed, because the second INSERT collides with that
 *     constraint regardless of what the pre-check saw.
 *
 * No hardcoded password: BOOTSTRAP_OWNER_PASSWORD must be supplied by
 * whoever runs this, at run time, never a source-code default. This is
 * also the designated Owner-recovery mechanism
 * (R1_2_IDENTITY_ACCESS_FINAL_ARCHITECTURE.md §28) for exactly the same
 * reason it works for first-run bootstrap: it is reachable only by
 * someone with deployment/environment access, never through any in-app
 * role, so a Manager can never use it to touch the Owner account
 * (§19's Owner-protection invariant, enforced here structurally by NOT
 * being an in-app code path at all, rather than by a permission check
 * that could be misconfigured).
 *
 * `bootstrapOwner()` is exported (not just run as a side effect of
 * importing this module) so it is directly integration-testable against
 * a real database — see tests/integration/identity-access.test.ts. The
 * auto-run guard at the bottom only fires when this file is executed
 * directly (`npm run bootstrap-owner`), never on import.
 */
import { pathToFileURL } from "node:url";
import { PrismaClient } from "@prisma/client";
import { PrismaStaffUserRepository } from "../persistence/PrismaStaffUserRepository.js";
import { ScryptPasswordHasher } from "../ScryptPasswordHasher.js";
import { RandomIdGenerator } from "../RandomIdGenerator.js";
import { Username } from "../../domain/value-objects/Username.js";
import { ActorRole } from "../../domain/value-objects/Actor.js";
import { StaffUserRepository } from "../../domain/repositories/StaffUserRepository.js";

export type BootstrapOwnerResult =
  | { readonly status: "CREATED"; readonly staffUserId: string; readonly username: string }
  | { readonly status: "ALREADY_EXISTS" }
  | { readonly status: "INVALID_INPUT"; readonly message: string }
  | { readonly status: "RACE_LOST" };

export async function bootstrapOwner(input: {
  readonly staffUserRepository: StaffUserRepository;
  readonly passwordHasher: ScryptPasswordHasher;
  readonly idGenerator: RandomIdGenerator;
  readonly recordSecurityEvent: (targetStaffUserId: string) => Promise<void>;
  readonly username: string | undefined;
  readonly password: string | undefined;
  readonly displayName: string | undefined;
  readonly email: string | undefined;
}): Promise<BootstrapOwnerResult> {
  if (!input.username || !input.password) {
    return { status: "INVALID_INPUT", message: "BOOTSTRAP_OWNER_USERNAME and BOOTSTRAP_OWNER_PASSWORD must both be set." };
  }
  const usernameResult = Username.create(input.username);
  if (!usernameResult.ok) {
    return { status: "INVALID_INPUT", message: `Invalid username: ${usernameResult.violations.map((v) => v.message).join(" ")}` };
  }
  if (input.password.length < 8) {
    return { status: "INVALID_INPUT", message: "Password must be at least 8 characters." };
  }

  if (await input.staffUserRepository.ownerExists()) {
    return { status: "ALREADY_EXISTS" };
  }

  const passwordHash = await input.passwordHasher.hash(input.password);
  try {
    const created = await input.staffUserRepository.create({
      id: input.idGenerator.generate(),
      username: usernameResult.value.toString(),
      displayName: input.displayName ?? usernameResult.value.toString(),
      email: input.email ?? null,
      passwordHash,
      role: ActorRole.Owner,
    });
    await input.recordSecurityEvent(created.id);
    return { status: "CREATED", staffUserId: created.id, username: created.username };
  } catch {
    // A raced second bootstrap collides with the database's own partial
    // unique index (P2002) even if the pre-check above raced past it —
    // that is the authoritative guard.
    return { status: "RACE_LOST" };
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient();
  try {
    const result = await bootstrapOwner({
      staffUserRepository: new PrismaStaffUserRepository(prisma),
      passwordHasher: new ScryptPasswordHasher(),
      idGenerator: new RandomIdGenerator(),
      recordSecurityEvent: async (targetStaffUserId) => {
        await prisma.securityEvent.create({ data: { type: "OwnerBootstrapped", targetStaffUserId } });
      },
      username: process.env["BOOTSTRAP_OWNER_USERNAME"],
      password: process.env["BOOTSTRAP_OWNER_PASSWORD"],
      displayName: process.env["BOOTSTRAP_OWNER_DISPLAY_NAME"],
      email: process.env["BOOTSTRAP_OWNER_EMAIL"],
    });

    switch (result.status) {
      case "CREATED":
        // eslint-disable-next-line no-console
        console.log(`bootstrapOwner: Owner account created — username "${result.username}", id ${result.staffUserId}.`);
        break;
      case "ALREADY_EXISTS":
        // eslint-disable-next-line no-console
        console.log("bootstrapOwner: an Owner already exists. Nothing was created. (Use the Owner-recovery path, not this script, to reset an existing Owner's credential.)");
        break;
      case "RACE_LOST":
        // eslint-disable-next-line no-console
        console.error("bootstrapOwner: failed — an Owner was created concurrently by another process (database constraint).");
        process.exitCode = 1;
        break;
      case "INVALID_INPUT":
        // eslint-disable-next-line no-console
        console.error(`bootstrapOwner: ${result.message} Nothing was created.`);
        process.exitCode = 1;
        break;
    }
  } finally {
    await prisma.$disconnect();
  }
}

// Only auto-run when this file is the actual entrypoint (`npm run
// bootstrap-owner`), never when imported (e.g. by tests). Compared via
// pathToFileURL rather than a manual `file://${...}` template — a plain
// template mismatches on Windows (backslash path separators, no leading
// slash), silently breaking the entrypoint guard.
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  main();
}
