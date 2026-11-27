import { eq } from "drizzle-orm";
import { z } from "zod";
import type { Db } from "../db";
import { auditLog, items, priceHistory } from "../db/schema";

/** "1,60" | "1.60" | "1" -> 160 cents; null if invalid or negative/too large. */
export function parseEuroToCents(raw: string): number | null {
  const s = raw.trim().replace(/\s|€/g, "").replace(",", ".");
  if (!/^\d{1,5}(\.\d{1,2})?$/.test(s)) return null;
  return Math.round(parseFloat(s) * 100);
}

const money = z.string().transform((v, ctx) => {
  const c = parseEuroToCents(v);
  if (c === null) ctx.addIssue({ code: "custom", message: "Invalid price" });
  return c as number;
});
const optMoney = z.string().transform((v, ctx) => {
  if (v.trim() === "") return null;
  const c = parseEuroToCents(v);
  if (c === null) ctx.addIssue({ code: "custom", message: "Invalid price" });
  return c;
});

export const itemInput = z.object({
  nameHr: z.string().trim().min(1).max(120),
  nameEn: z.string().trim().min(1).max(120),
  noteHr: z.string().trim().max(300),
  noteEn: z.string().trim().max(300),
  qtyText: z.string().trim().max(40),
  price: money,
  anchorPrice: optMoney,
});
export type ItemInput = z.input<typeof itemInput>;

export type UpdateResult = { ok: true; changed: string[] } | { ok: false; error: string };

export async function updateItem(db: Db, userId: number, id: number, raw: ItemInput): Promise<UpdateResult> {
  const p = itemInput.safeParse(raw);
  if (!p.success) return { ok: false, error: "Invalid input" };
  const v = p.data;
  return db.transaction(async (tx) => {
    const [cur] = await tx.select().from(items).where(eq(items.id, id));
    if (!cur) return { ok: false as const, error: "Not found" };
    const next = {
      nameHr: v.nameHr, nameEn: v.nameEn, noteHr: v.noteHr, noteEn: v.noteEn, qtyText: v.qtyText,
      priceCents: v.price, anchorPriceCents: v.anchorPrice,
    };
    const diff: Record<string, [unknown, unknown]> = {};
    for (const k of Object.keys(next) as (keyof typeof next)[]) {
      if (cur[k] !== next[k]) diff[k] = [cur[k], next[k]];
    }
    const changed = Object.keys(diff);
    if (changed.length === 0) return { ok: true as const, changed };
    await tx.update(items).set(next).where(eq(items.id, id));
    if (diff.priceCents || diff.anchorPriceCents) {
      await tx.insert(priceHistory).values({
        itemId: id, oldPriceCents: cur.priceCents, newPriceCents: next.priceCents,
        oldAnchorCents: cur.anchorPriceCents, newAnchorCents: next.anchorPriceCents, userId,
      });
    }
    await tx.insert(auditLog).values({
      userId, action: "item.update", entity: "item", entityId: id, detail: JSON.stringify(diff),
    });
    return { ok: true as const, changed };
  });
}
