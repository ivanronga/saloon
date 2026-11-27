import { beforeEach, describe, expect, it } from "vitest";
import { asc, eq } from "drizzle-orm";
import { createDb, type Db } from "@/lib/db";
import { auditLog, groups, items, users } from "@/lib/db/schema";
import {
  createGroup, createItem, deleteGroup, deleteItem, moveGroup, moveItem, renameGroup, setGroupVisible, setItemVisible,
} from "@/lib/cms/structure";
import { getPriceList } from "@/lib/queries";

let db: Db;
let uid: number;
const it1 = (n: string) => ({ nameHr: n, nameEn: n, noteHr: "", noteEn: "", qtyText: "0,1 l", price: "1,50", anchorPrice: "" });
const names = async (gid: number) =>
  (await db.select().from(items).where(eq(items.groupId, gid)).orderBy(asc(items.sort), asc(items.id))).map((i) => i.nameHr);

beforeEach(async () => {
  db = await createDb();
  [{ id: uid }] = await db.insert(users).values({ email: "e@x.hr", passwordHash: "x" }).returning({ id: users.id });
});

describe("items", () => {
  it("creates at the end, moves, hides and deletes (with audit)", async () => {
    const g = await createGroup(db, uid, { nameHr: "Pića", nameEn: "Drinks" });
    if (!g.ok || !g.id) throw new Error("group");
    const ids: number[] = [];
    for (const n of ["A", "B", "C"]) {
      const r = await createItem(db, uid, g.id, it1(n));
      if (!r.ok || !r.id) throw new Error("item");
      ids.push(r.id);
    }
    expect(await names(g.id)).toEqual(["A", "B", "C"]);

    await moveItem(db, uid, ids[2], "up");
    expect(await names(g.id)).toEqual(["A", "C", "B"]);
    await moveItem(db, uid, ids[0], "up"); // already first: no-op
    await moveItem(db, uid, ids[1], "down"); // already last: no-op
    expect(await names(g.id)).toEqual(["A", "C", "B"]);
    await moveItem(db, uid, ids[0], "down");
    expect(await names(g.id)).toEqual(["C", "A", "B"]);

    await setItemVisible(db, uid, ids[0], false);
    const list = await getPriceList(db);
    expect(list[0].items.map((i) => i.nameHr)).toEqual(["C", "B"]);

    expect(await deleteItem(db, uid, ids[1])).toEqual({ ok: true });
    expect(await names(g.id)).toEqual(["C", "A"]);
    expect(await deleteItem(db, uid, 9999)).toMatchObject({ ok: false });
    const actions = (await db.select().from(auditLog)).map((a) => a.action);
    expect(actions).toContain("item.delete");
    expect(actions).toContain("item.move");
  });

  it("rejects invalid items and unknown groups", async () => {
    expect(await createItem(db, uid, 1, it1("X"))).toEqual({ ok: false, error: "Group not found" });
    const g = await createGroup(db, uid, { nameHr: "G", nameEn: "G" });
    if (!g.ok || !g.id) throw new Error("group");
    expect(await createItem(db, uid, g.id, { ...it1("X"), price: "abc" })).toEqual({ ok: false, error: "Invalid input" });
    expect(await createItem(db, uid, g.id, { ...it1(""), nameHr: " " })).toEqual({ ok: false, error: "Invalid input" });
  });
});

describe("groups", () => {
  it("creates, renames, reorders, hides; deletes only when empty", async () => {
    const ids: number[] = [];
    for (const n of ["G1", "G2", "G3"]) {
      const r = await createGroup(db, uid, { nameHr: n, nameEn: n });
      if (!r.ok || !r.id) throw new Error("group");
      ids.push(r.id);
    }
    await moveGroup(db, uid, ids[2], "up");
    await moveGroup(db, uid, ids[0], "up"); // no-op
    const order = async () => (await db.select().from(groups).orderBy(asc(groups.sort))).map((g) => g.nameHr);
    expect(await order()).toEqual(["G1", "G3", "G2"]);

    expect(await renameGroup(db, uid, ids[0], { nameHr: "Novo", nameEn: "New" })).toEqual({ ok: true });
    expect(await renameGroup(db, uid, ids[0], { nameHr: "", nameEn: "New" })).toEqual({ ok: false, error: "Invalid input" });
    await setGroupVisible(db, uid, ids[1], false);

    await createItem(db, uid, ids[0], it1("A"));
    expect(await deleteGroup(db, uid, ids[0])).toEqual({ ok: false, error: "Group is not empty" });
    expect(await deleteGroup(db, uid, ids[1])).toEqual({ ok: true });
    expect(await order()).toEqual(["Novo", "G3"]);
  });
});
