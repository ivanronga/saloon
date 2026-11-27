import { beforeEach, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/lib/db";
import { auditLog, sessions, users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, getSessionUser } from "@/lib/auth/session";
import { login } from "@/lib/auth/login";
import {
  changeOwnPassword, createUser, listUsers, resetPassword, setUserActive, setUserRole,
} from "@/lib/cms/users";

let db: Db;
let admin: number;
const PW = "correct horse battery";

beforeEach(async () => {
  db = await createDb();
  [{ id: admin }] = await db
    .insert(users)
    .values({ email: "root@x.hr", role: "admin", passwordHash: await hashPassword(PW) })
    .returning({ id: users.id });
});

const mk = async (email: string, role: "admin" | "editor" = "editor") => {
  const r = await createUser(db, admin, { email, name: "N", role, password: PW });
  if (!r.ok || !r.id) throw new Error("create failed");
  return r.id;
};

describe("createUser", () => {
  it("creates a user who can log in; hash is argon2id and never listed", async () => {
    await mk(" New@X.hr ");
    expect((await login(db, "new@x.hr", PW)).ok).toBe(true);
    const list = await listUsers(db);
    expect(list.map((u) => u.email)).toContain("new@x.hr");
    expect(JSON.stringify(list)).not.toContain("argon2");
  });
  it("rejects bad email, weak password and duplicates", async () => {
    expect(await createUser(db, admin, { email: "nope", name: "", role: "editor", password: PW })).toEqual({ ok: false, error: "invalid" });
    expect(await createUser(db, admin, { email: "a@x.hr", name: "", role: "editor", password: "short" })).toEqual({ ok: false, error: "weak_password" });
    expect(await createUser(db, admin, { email: "a@x.hr", name: "", role: "root" as never, password: PW })).toEqual({ ok: false, error: "invalid" });
    await mk("dup@x.hr");
    expect(await createUser(db, admin, { email: "DUP@x.hr", name: "", role: "editor", password: PW })).toEqual({ ok: false, error: "email_taken" });
  });
});

describe("never remove the last admin", () => {
  it("blocks demoting or disabling the only admin", async () => {
    expect(await setUserRole(db, admin, admin, "editor")).toEqual({ ok: false, error: "last_admin" });
    expect(await setUserActive(db, admin, admin, false)).toEqual({ ok: false, error: "last_admin" });
  });
  it("allows it once another active admin exists, then blocks again", async () => {
    const b = await mk("b@x.hr", "admin");
    expect(await setUserRole(db, admin, admin, "editor")).toEqual({ ok: true });
    expect(await setUserActive(db, admin, b, false)).toEqual({ ok: false, error: "last_admin" });
    expect(await setUserRole(db, b, b, "editor")).toEqual({ ok: false, error: "last_admin" });
  });
  it("a disabled admin does not count as a remaining admin", async () => {
    const b = await mk("b@x.hr", "admin");
    await setUserActive(db, admin, b, false);
    expect(await setUserRole(db, admin, admin, "editor")).toEqual({ ok: false, error: "last_admin" });
  });
});

describe("disable / enable", () => {
  it("revokes sessions immediately and blocks login; re-enabling restores it", async () => {
    const e = await mk("ed@x.hr");
    const { token } = await createSession(db, e);
    expect(await getSessionUser(db, token)).not.toBeNull();
    await setUserActive(db, admin, e, false);
    expect(await getSessionUser(db, token)).toBeNull();
    expect((await db.select().from(sessions).where(eq(sessions.userId, e))).length).toBe(0);
    expect((await login(db, "ed@x.hr", PW)).ok).toBe(false);
    await setUserActive(db, admin, e, true);
    expect((await login(db, "ed@x.hr", PW)).ok).toBe(true);
  });
});

describe("passwords", () => {
  it("admin reset changes the password and signs the user out", async () => {
    const e = await mk("ed@x.hr");
    const { token } = await createSession(db, e);
    expect(await resetPassword(db, admin, e, "short")).toEqual({ ok: false, error: "weak_password" });
    expect(await resetPassword(db, admin, 9999, "another long password")).toEqual({ ok: false, error: "not_found" });
    expect(await resetPassword(db, admin, e, "another long password")).toEqual({ ok: true });
    expect(await getSessionUser(db, token)).toBeNull();
    expect((await login(db, "ed@x.hr", PW)).ok).toBe(false);
    expect((await login(db, "ed@x.hr", "another long password")).ok).toBe(true);
  });
  it("self-change needs the current password and keeps only the current session", async () => {
    const e = await mk("ed@x.hr");
    const keep = await createSession(db, e);
    const other = await createSession(db, e);
    expect(await changeOwnPassword(db, e, "wrong password!!", "brand new password", keep.token)).toEqual({ ok: false, error: "wrong_password" });
    expect(await changeOwnPassword(db, e, PW, "tiny", keep.token)).toEqual({ ok: false, error: "weak_password" });
    expect(await changeOwnPassword(db, e, PW, "brand new password", keep.token)).toEqual({ ok: true });
    expect(await getSessionUser(db, keep.token)).not.toBeNull();
    expect(await getSessionUser(db, other.token)).toBeNull();
    const [u] = await db.select().from(users).where(eq(users.id, e));
    expect(await verifyPassword(u.passwordHash, "brand new password")).toBe(true);
  });
});

describe("audit", () => {
  it("records actions without any password material", async () => {
    const e = await mk("ed@x.hr");
    await resetPassword(db, admin, e, "another long password");
    const rows = JSON.stringify(await db.select().from(auditLog));
    expect(rows).toContain("user.create");
    expect(rows).toContain("user.password_reset");
    expect(rows).not.toContain("another long password");
    expect(rows).not.toContain("argon2");
  });
});
