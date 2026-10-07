/**
 * R1.5-P7-D — set a new password for the synthetic `ux-reception` account in
 * the UX database only (`npm run ux:set-password`, loads .env.ux), e.g. for a
 * manual browser session on http://127.0.0.1:3002. The new password comes
 * from HELIX_UX_RECEPTION_PASSWORD (environment only; never printed/stored).
 * Same UX gates as teardown (URL + live identity + sentinel); touches exactly
 * one row (UPDATE_COUNT must be 1).
 */
import { PrismaClient } from "@prisma/client";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { ScryptPasswordHasher } from "../../infrastructure/ScryptPasswordHasher.js";
import { assertProvisionedUxDatabase, assertUxDatabaseUrl, createPrismaUxIdentityReader, UxSafetyError } from "./uxSafety.js";
import { UX_RECEPTION_USERNAME } from "./uxSaturdayPlan.js";

export async function setUxReceptionPassword(databaseUrl: string, password: string): Promise<void> {
  assertUxDatabaseUrl(databaseUrl);
  if (!password || password.length < 16) throw new UxSafetyError("HELIX_UX_RECEPTION_PASSWORD must be set (at least 16 characters).");
  const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
  try {
    await assertProvisionedUxDatabase(createPrismaUxIdentityReader(prisma));
    const passwordHash = await new ScryptPasswordHasher().hash(password);
    const result = await prisma.staffUser.updateMany({ where: { username: UX_RECEPTION_USERNAME, role: "Reception", status: "Active" }, data: { passwordHash } });
    if (result.count !== 1) throw new Error(`expected to update exactly 1 ${UX_RECEPTION_USERNAME} row, updated ${result.count}.`);
  } finally {
    await prisma.$disconnect();
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  setUxReceptionPassword(process.env["DATABASE_URL"] ?? "", process.env["HELIX_UX_RECEPTION_PASSWORD"] ?? "")
    .then(() => console.log(`ux:set-password OK — ${UX_RECEPTION_USERNAME} password updated (UX database only).`))
    .catch((err) => {
      console.error(err instanceof Error ? err.message : err);
      process.exitCode = 1;
    });
}
