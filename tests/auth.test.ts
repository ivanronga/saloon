import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/lib/db";
import { users } from "@/lib/db/schema";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { isLockedOut, MAX_FAILURES, WINDOW_MS } from "@/lib/auth/ratelimit";
import { login } from "@/lib/auth/login";
import { destroySession, getSessionUser, SESSION_TTL_MS } from "@/lib/auth/session";

let db: Db;
const PW = "correct horse battery";
beforeAll(async () => {
  db = await createDb();
  await db.insert(users).values([
    { email: "a@x.hr", role: "admin", passwordHash: await hashPassword(PW) },
    { email: "off@x.hr", role: "editor", active: false, passwordHash: await hashPassword(PW) },
  ]);
});

describe("password", () => {
  it("hashes with argon2id and verifies", async () => {
    const h = await hashPassword("s3cret-password");
    expect(h.startsWith("$argon2id$")).toBe(true);
    expect(await verifyPassword(h, "s3cret-password")).toBe(true);
    expect(await verifyPassword(h, "wrong")).toBe(false);
    expect(await verifyPassword("garbage", "x")).toBe(false);
  });
});

describe("login + session", () => {
  it("logs in, resolves user, expires and logs out", async () => {
    const now = new Date("2026-11-27T10:00:00Z");
    const r = await login(db, " A@X.hr ", PW, now);
    if (!r.ok) throw new Error("expected ok");
    expect(await getSessionUser(db, r.token, now)).toMatchObject({ email: "a@x.hr", role: "admin" });
    expect(await getSessionUser(db, r.token, new Date(now.getTime() + SESSION_TTL_MS + 1000))).toBeNull();
    expect(await getSessionUser(db, "forged-token", now)).toBeNull();
    await destroySession(db, r.token);
    expect(await getSessionUser(db, r.token, now)).toBeNull();
  });
  it("rejects wrong password, unknown user and disabled user identically", async () => {
    for (const [e, p] of [["a@x.hr", "nope"], ["ghost@x.hr", PW], ["off@x.hr", PW]] as const) {
      expect(await login(db, e, p)).toEqual({ ok: false, reason: "invalid" });
    }
  });
  it("locks out after repeated failures, even with the right password, then recovers", async () => {
    const t0 = new Date("2026-11-27T12:00:00Z");
    for (let i = 0; i < MAX_FAILURES; i++) await login(db, "lock@x.hr", "bad", t0);
    expect(await isLockedOut(db, "lock@x.hr", t0)).toBe(true);
    expect((await login(db, "lock@x.hr", PW, t0)).ok).toBe(false);
    expect(await isLockedOut(db, "lock@x.hr", new Date(t0.getTime() + WINDOW_MS + 1000))).toBe(false);
  });
  it("does not store the raw token", async () => {
    const r = await login(db, "a@x.hr", PW);
    if (!r.ok) throw new Error("expected ok");
    const { sessions } = await import("@/lib/db/schema");
    const rows = await db.select().from(sessions);
    expect(rows.some((s) => s.tokenHash === r.token)).toBe(false);
  });
});
