import { and, asc, eq, ne } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { auditLog, users } from "../db/schema";
import { hashPassword, MIN_PASSWORD, verifyPassword } from "../auth/password";
import { destroyUserSessions } from "../auth/session";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type UserResult = { ok: true; id?: number } | { ok: false; error: UserError };
export type UserError =
  | "invalid" | "weak_password" | "email_taken" | "not_found" | "last_admin" | "wrong_password";

const role = z.enum(["admin", "editor"]);
const password = z.string().min(MIN_PASSWORD).max(200);
const createInput = z.object({
  email: z.string().trim().toLowerCase().email().max(254),
  name: z.string().trim().max(120),
  role,
  password,
});
export type CreateUserInput = z.input<typeof createInput>;

const log = (tx: Tx, actorId: number, action: string, targetId: number | null, detail: unknown = {}) =>
  tx.insert(auditLog).values({ userId: actorId, action, entity: "user", entityId: targetId, detail: JSON.stringify(detail) });

/** Public shape: never exposes the password hash. */
export async function listUsers(db: Db) {
  return db
    .select({ id: users.id, email: users.email, name: users.name, role: users.role, active: users.active, createdAt: users.createdAt })
    .from(users)
    .orderBy(asc(users.email));
}

/**
 * True if, after `changeId` stops being an active admin, at least one other active admin remains.
 * Locks the admin rows (FOR UPDATE) so two concurrent changes cannot both pass the check on Postgres.
 */
async function otherActiveAdminExists(tx: Tx, changeId: number) {
  const rows = await tx
    .select({ id: users.id })
    .from(users)
    .where(and(eq(users.role, "admin"), eq(users.active, true), ne(users.id, changeId)))
    .for("update");
  return rows.length > 0;
}

export async function createUser(db: Db, actorId: number, raw: CreateUserInput): Promise<UserResult> {
  const p = createInput.safeParse(raw);
  if (!p.success) {
    const weak = p.error.issues.some((i) => i.path[0] === "password");
    return { ok: false, error: weak ? "weak_password" : "invalid" };
  }
  const v = p.data;
  const passwordHash = await hashPassword(v.password);
  return db.transaction(async (tx) => {
    const [dupe] = await tx.select({ id: users.id }).from(users).where(eq(users.email, v.email));
    if (dupe) return { ok: false as const, error: "email_taken" as const };
    const [row] = await tx
      .insert(users)
      .values({ email: v.email, name: v.name, role: v.role, passwordHash })
      .returning({ id: users.id });
    await log(tx, actorId, "user.create", row.id, { email: v.email, role: v.role });
    return { ok: true as const, id: row.id };
  });
}

export async function setUserRole(db: Db, actorId: number, id: number, newRole: "admin" | "editor"): Promise<UserResult> {
  if (!role.safeParse(newRole).success) return { ok: false, error: "invalid" };
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(users).where(eq(users.id, id));
    if (!cur) return { ok: false as const, error: "not_found" as const };
    if (cur.role === newRole) return { ok: true as const };
    if (cur.role === "admin" && cur.active && !(await otherActiveAdminExists(tx, id))) {
      return { ok: false as const, error: "last_admin" as const };
    }
    await tx.update(users).set({ role: newRole }).where(eq(users.id, id));
    await log(tx, actorId, "user.role", id, { role: [cur.role, newRole] });
    return { ok: true as const };
  });
}

/** Disabling also revokes all of the user's sessions immediately. */
export async function setUserActive(db: Db, actorId: number, id: number, active: boolean): Promise<UserResult> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(users).where(eq(users.id, id));
    if (!cur) return { ok: false as const, error: "not_found" as const };
    if (cur.active === active) return { ok: true as const };
    if (!active && cur.role === "admin" && !(await otherActiveAdminExists(tx, id))) {
      return { ok: false as const, error: "last_admin" as const };
    }
    await tx.update(users).set({ active }).where(eq(users.id, id));
    if (!active) await destroyUserSessions(tx as unknown as Db, id);
    await log(tx, actorId, active ? "user.enable" : "user.disable", id);
    return { ok: true as const };
  });
}

/** Admin sets a new password for another (or their own) account; the target is signed out everywhere. */
export async function resetPassword(db: Db, actorId: number, id: number, newPassword: string): Promise<UserResult> {
  if (!password.safeParse(newPassword).success) return { ok: false, error: "weak_password" };
  const passwordHash = await hashPassword(newPassword);
  return db.transaction(async (tx) => {
    const r = await tx.update(users).set({ passwordHash }).where(eq(users.id, id)).returning({ id: users.id });
    if (r.length === 0) return { ok: false as const, error: "not_found" as const };
    await destroyUserSessions(tx as unknown as Db, id);
    await log(tx, actorId, "user.password_reset", id);
    return { ok: true as const };
  });
}

/** A user changes their own password: needs the current one; other sessions are revoked, this one kept. */
export async function changeOwnPassword(
  db: Db, userId: number, current: string, next: string, keepToken?: string,
): Promise<UserResult> {
  if (!password.safeParse(next).success) return { ok: false, error: "weak_password" };
  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return { ok: false, error: "not_found" };
  if (!(await verifyPassword(u.passwordHash, current))) return { ok: false, error: "wrong_password" };
  const passwordHash = await hashPassword(next);
  return db.transaction(async (tx) => {
    await tx.update(users).set({ passwordHash }).where(eq(users.id, userId));
    await destroyUserSessions(tx as unknown as Db, userId, keepToken);
    await log(tx, userId, "user.password_change", userId);
    return { ok: true as const };
  });
}
