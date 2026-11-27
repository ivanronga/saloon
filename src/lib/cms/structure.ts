import { and, asc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { auditLog, groups, items } from "../db/schema";
import { itemInput, type ItemInput } from "./items";

type Tx = Parameters<Parameters<Db["transaction"]>[0]>[0];
export type Result = { ok: true; id?: number } | { ok: false; error: string };

const groupInput = z.object({
  nameHr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
});
export type GroupInput = z.input<typeof groupInput>;

const log = (tx: Tx, userId: number, action: string, entity: string, entityId: number | null, detail: unknown) =>
  tx.insert(auditLog).values({ userId, action, entity, entityId, detail: JSON.stringify(detail) });

/** Rewrite sort values of a group's items to 0..n-1 (stable), returning the ordered ids. */
async function normalizeItems(tx: Tx, groupId: number) {
  const rows = await tx.select({ id: items.id }).from(items).where(eq(items.groupId, groupId)).orderBy(asc(items.sort), asc(items.id));
  for (let i = 0; i < rows.length; i++) await tx.update(items).set({ sort: i }).where(eq(items.id, rows[i].id));
  return rows.map((r) => r.id);
}
async function normalizeGroups(tx: Tx) {
  const rows = await tx.select({ id: groups.id }).from(groups).orderBy(asc(groups.sort), asc(groups.id));
  for (let i = 0; i < rows.length; i++) await tx.update(groups).set({ sort: i }).where(eq(groups.id, rows[i].id));
  return rows.map((r) => r.id);
}

/* ---------- items ---------- */

export async function createItem(db: Db, userId: number, groupId: number, raw: ItemInput): Promise<Result> {
  const p = itemInput.safeParse(raw);
  if (!p.success) return { ok: false, error: "Invalid input" };
  const v = p.data;
  return db.transaction(async (tx) => {
    const [g] = await tx.select({ id: groups.id }).from(groups).where(eq(groups.id, groupId));
    if (!g) return { ok: false as const, error: "Group not found" };
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${items.sort}), -1)` }).from(items).where(eq(items.groupId, groupId));
    const [row] = await tx
      .insert(items)
      .values({
        groupId, nameHr: v.nameHr, nameEn: v.nameEn, noteHr: v.noteHr, noteEn: v.noteEn, qtyText: v.qtyText,
        priceCents: v.price, anchorPriceCents: v.anchorPrice, sort: Number(max) + 1,
      })
      .returning({ id: items.id });
    await log(tx, userId, "item.create", "item", row.id, { groupId, nameHr: v.nameHr, priceCents: v.price });
    return { ok: true as const, id: row.id };
  });
}

export async function deleteItem(db: Db, userId: number, id: number): Promise<Result> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(items).where(eq(items.id, id));
    if (!cur) return { ok: false as const, error: "Not found" };
    await tx.delete(items).where(eq(items.id, id)); // price_history rows cascade
    await log(tx, userId, "item.delete", "item", id, cur);
    return { ok: true as const };
  });
}

export async function setItemVisible(db: Db, userId: number, id: number, visible: boolean): Promise<Result> {
  return db.transaction(async (tx) => {
    const r = await tx.update(items).set({ visible }).where(eq(items.id, id)).returning({ id: items.id });
    if (r.length === 0) return { ok: false as const, error: "Not found" };
    await log(tx, userId, "item.visibility", "item", id, { visible });
    return { ok: true as const };
  });
}

/** Move an item one step up/down within its group. No-op at the ends. */
export async function moveItem(db: Db, userId: number, id: number, dir: "up" | "down"): Promise<Result> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select({ groupId: items.groupId }).from(items).where(eq(items.id, id));
    if (!cur) return { ok: false as const, error: "Not found" };
    const order = await normalizeItems(tx, cur.groupId);
    const i = order.indexOf(id);
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= order.length) return { ok: true as const };
    await tx.update(items).set({ sort: j }).where(eq(items.id, id));
    await tx.update(items).set({ sort: i }).where(and(eq(items.id, order[j])));
    await log(tx, userId, "item.move", "item", id, { dir });
    return { ok: true as const };
  });
}

/* ---------- groups ---------- */

export async function createGroup(db: Db, userId: number, raw: GroupInput): Promise<Result> {
  const p = groupInput.safeParse(raw);
  if (!p.success) return { ok: false, error: "Invalid input" };
  return db.transaction(async (tx) => {
    const [{ max }] = await tx.select({ max: sql<number>`coalesce(max(${groups.sort}), -1)` }).from(groups);
    const [row] = await tx
      .insert(groups)
      .values({ ...p.data, sort: Number(max) + 1 })
      .returning({ id: groups.id });
    await log(tx, userId, "group.create", "group", row.id, p.data);
    return { ok: true as const, id: row.id };
  });
}

export async function renameGroup(db: Db, userId: number, id: number, raw: GroupInput): Promise<Result> {
  const p = groupInput.safeParse(raw);
  if (!p.success) return { ok: false, error: "Invalid input" };
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(groups).where(eq(groups.id, id));
    if (!cur) return { ok: false as const, error: "Not found" };
    await tx.update(groups).set(p.data).where(eq(groups.id, id));
    await log(tx, userId, "group.rename", "group", id, { nameHr: [cur.nameHr, p.data.nameHr], nameEn: [cur.nameEn, p.data.nameEn] });
    return { ok: true as const };
  });
}

export async function setGroupVisible(db: Db, userId: number, id: number, visible: boolean): Promise<Result> {
  return db.transaction(async (tx) => {
    const r = await tx.update(groups).set({ visible }).where(eq(groups.id, id)).returning({ id: groups.id });
    if (r.length === 0) return { ok: false as const, error: "Not found" };
    await log(tx, userId, "group.visibility", "group", id, { visible });
    return { ok: true as const };
  });
}

/** Only empty groups can be deleted (hide a group instead if it still has items). */
export async function deleteGroup(db: Db, userId: number, id: number): Promise<Result> {
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(groups).where(eq(groups.id, id));
    if (!cur) return { ok: false as const, error: "Not found" };
    const [{ n }] = await tx.select({ n: sql<number>`count(*)` }).from(items).where(eq(items.groupId, id));
    if (Number(n) > 0) return { ok: false as const, error: "Group is not empty" };
    await tx.delete(groups).where(eq(groups.id, id));
    await log(tx, userId, "group.delete", "group", id, cur);
    return { ok: true as const };
  });
}

export async function moveGroup(db: Db, userId: number, id: number, dir: "up" | "down"): Promise<Result> {
  return db.transaction(async (tx) => {
    const order = await normalizeGroups(tx);
    const i = order.indexOf(id);
    if (i < 0) return { ok: false as const, error: "Not found" };
    const j = dir === "up" ? i - 1 : i + 1;
    if (j < 0 || j >= order.length) return { ok: true as const };
    await tx.update(groups).set({ sort: j }).where(eq(groups.id, id));
    await tx.update(groups).set({ sort: i }).where(eq(groups.id, order[j]));
    await log(tx, userId, "group.move", "group", id, { dir });
    return { ok: true as const };
  });
}
