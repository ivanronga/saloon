import { beforeAll, describe, expect, it } from "vitest";
import { eq } from "drizzle-orm";
import { createDb, type Db } from "@/lib/db";
import { auditLog, groups, items, priceHistory, users } from "@/lib/db/schema";
import { parseEuroToCents, updateItem } from "@/lib/cms/items";

let db: Db;
let uid: number;
let iid: number;
const base = { nameHr: "Cola", nameEn: "Cola", noteHr: "", noteEn: "", qtyText: "0,10 l", price: "1,60", anchorPrice: "1,70" };

beforeAll(async () => {
  db = await createDb();
  [{ id: uid }] = await db.insert(users).values({ email: "e@x.hr", passwordHash: "x" }).returning({ id: users.id });
  const [g] = await db.insert(groups).values({ nameHr: "G", nameEn: "G" }).returning();
  [{ id: iid }] = await db
    .insert(items)
    .values({ groupId: g.id, nameHr: "Cola", nameEn: "Cola", qtyText: "0,10 l", priceCents: 160, anchorPriceCents: 170 })
    .returning({ id: items.id });
});

describe("parseEuroToCents", () => {
  it("parses valid and rejects invalid", () => {
    expect(parseEuroToCents("1,60")).toBe(160);
    expect(parseEuroToCents(" 2.5 € ")).toBe(250);
    for (const bad of ["", "-1", "abc", "1,555", "1e3", "100000"]) expect(parseEuroToCents(bad)).toBeNull();
  });
});

describe("updateItem", () => {
  it("no-op writes nothing", async () => {
    expect(await updateItem(db, uid, iid, base)).toEqual({ ok: true, changed: [] });
    expect(await db.select().from(auditLog)).toHaveLength(0);
  });
  it("updates, records price history and audit log", async () => {
    const r = await updateItem(db, uid, iid, { ...base, price: "1,80", nameEn: "Coke" });
    expect(r).toEqual({ ok: true, changed: ["nameEn", "priceCents"] });
    const [row] = await db.select().from(items).where(eq(items.id, iid));
    expect(row).toMatchObject({ nameEn: "Coke", priceCents: 180, anchorPriceCents: 170 });
    expect(await db.select().from(priceHistory)).toMatchObject([{ oldPriceCents: 160, newPriceCents: 180, userId: uid }]);
    expect(await db.select().from(auditLog)).toHaveLength(1);
  });
  it("clears anchor price and rejects bad input", async () => {
    await updateItem(db, uid, iid, { ...base, price: "1,80", nameEn: "Coke", anchorPrice: "" });
    const [row] = await db.select().from(items).where(eq(items.id, iid));
    expect(row.anchorPriceCents).toBeNull();
    expect(await updateItem(db, uid, iid, { ...base, price: "x" })).toEqual({ ok: false, error: "Invalid input" });
    expect(await updateItem(db, uid, 9999, base)).toEqual({ ok: false, error: "Not found" });
  });
});
