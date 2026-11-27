import { eq } from "drizzle-orm";
import type { Db } from "../db";
import { users } from "../db/schema";
import { verifyPassword, hashPassword } from "./password";
import { clearFailures, isLockedOut, recordFailure } from "./ratelimit";
import { createSession } from "./session";

export type LoginResult =
  | { ok: true; token: string; expiresAt: Date }
  | { ok: false; reason: "invalid" | "locked" };

// Pre-computed hash so unknown emails cost the same time as wrong passwords (no user enumeration).
let dummy: Promise<string> | undefined;

export async function login(db: Db, rawEmail: string, password: string, now = new Date()): Promise<LoginResult> {
  const email = rawEmail.trim().toLowerCase();
  if (await isLockedOut(db, email, now)) return { ok: false, reason: "locked" };

  const [u] = await db.select().from(users).where(eq(users.email, email));
  dummy ??= hashPassword("not-a-real-password-for-timing");
  const valid = await verifyPassword(u?.passwordHash ?? (await dummy), password);

  if (!u || !u.active || !valid) {
    await recordFailure(db, email, now);
    return { ok: false, reason: "invalid" };
  }
  await clearFailures(db, email);
  const s = await createSession(db, u.id, now);
  return { ok: true, ...s };
}
