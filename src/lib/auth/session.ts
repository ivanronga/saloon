import { createHash, randomBytes } from "node:crypto";
import { and, eq, gt } from "drizzle-orm";
import type { Db } from "../db";
import { sessions, users } from "../db/schema";

export const SESSION_COOKIE = "saloon_session";
export const SESSION_TTL_MS = 7 * 24 * 60 * 60 * 1000;

const sha = (s: string) => createHash("sha256").update(s).digest("hex");

export async function createSession(db: Db, userId: number, now = new Date()) {
  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await db.insert(sessions).values({ tokenHash: sha(token), userId, expiresAt });
  return { token, expiresAt };
}

export async function getSessionUser(db: Db, token: string | undefined, now = new Date()) {
  if (!token) return null;
  const [r] = await db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.userId))
    .where(and(eq(sessions.tokenHash, sha(token)), gt(sessions.expiresAt, now), eq(users.active, true)));
  return r ?? null;
}

export async function destroySession(db: Db, token: string | undefined) {
  if (token) await db.delete(sessions).where(eq(sessions.tokenHash, sha(token)));
}
