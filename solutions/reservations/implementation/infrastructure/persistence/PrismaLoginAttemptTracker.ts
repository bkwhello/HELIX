import { PrismaClient } from "@prisma/client";
import { LoginAttemptTracker } from "../../application/ports/LoginAttemptTracker.js";

export class PrismaLoginAttemptTracker implements LoginAttemptTracker {
  constructor(private readonly prisma: PrismaClient) {}

  async isThrottled(key: string, now: Date, windowMs: number, maxAttempts: number): Promise<boolean> {
    const row = await this.prisma.loginAttemptWindow.findUnique({ where: { key } });
    if (!row) return false;
    const windowExpired = now.getTime() - row.windowStart.getTime() >= windowMs;
    if (windowExpired) return false;
    return row.count >= maxAttempts;
  }

  /**
   * Raw SQL `INSERT ... ON CONFLICT DO UPDATE`, not a read-then-write
   * (Prisma `upsert()` with application-computed values) — a naive
   * "read the row, decide reset-vs-increment in JS, then write" would
   * under-count under genuine concurrent failures (two attackers, or one
   * attacker firing requests in parallel, both reading count=N before
   * either write lands, both writing N+1 instead of the true N+2) —
   * exactly the scenario a rate limiter exists to hold up under. The
   * CASE expressions make the reset-if-expired-else-increment decision
   * inside the single atomic statement, using PostgreSQL's own
   * row-level locking for the UPDATE branch.
   */
  async recordFailure(key: string, now: Date, windowMs: number): Promise<void> {
    const cutoff = new Date(now.getTime() - windowMs);
    await this.prisma.$executeRaw`
      INSERT INTO "login_attempt_windows" ("key", "window_start", "count", "updated_at")
      VALUES (${key}, ${now}, 1, ${now})
      ON CONFLICT ("key") DO UPDATE SET
        "window_start" = CASE WHEN "login_attempt_windows"."window_start" <= ${cutoff} THEN ${now} ELSE "login_attempt_windows"."window_start" END,
        "count" = CASE WHEN "login_attempt_windows"."window_start" <= ${cutoff} THEN 1 ELSE "login_attempt_windows"."count" + 1 END,
        "updated_at" = ${now}
    `;
  }

  async reset(key: string): Promise<void> {
    await this.prisma.loginAttemptWindow.deleteMany({ where: { key } });
  }
}
