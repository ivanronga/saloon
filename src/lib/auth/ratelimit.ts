import { and, eq, gt, sql } from "drizzle-orm";
import type { Db } from "../db";
import { loginAttempts } from "../db/schema";

export const MAX_FAILURES = 5;
export const WINDOW_MS = 15 * 60 * 1000;

const since = (now: Date) => new Date(now.getTime() - WINDOW_MS);

/** True when this email has too many recent failed logins (lockout for WINDOW_MS). */
export async function isLockedOut(db: Db, email: string, now = new Date()): Promise<boolean> {
  const [r] = await db.select({ n: sql<number>`count(*)::int` }).from(loginAttempts)
    .where(and(eq(loginAttempts.email, email), gt(loginAttempts.at, since(now))));
  return r.n >= MAX_FAILURES;
}

export async function recordFailure(db: Db, email: string, now = new Date()) {
  await db.insert(loginAttempts).values({ email, at: now });
}

export async function clearFailures(db: Db, email: string) {
  await db.delete(loginAttempts).where(eq(loginAttempts.email, email));
}
