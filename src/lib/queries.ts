import { asc, eq } from "drizzle-orm";
import type { Db } from "./db";
import { groups, items, settings } from "./db/schema";

export async function getPriceList(db: Db) {
  const gs = await db.select().from(groups).where(eq(groups.visible, true)).orderBy(asc(groups.sort), asc(groups.id));
  const its = await db.select().from(items).where(eq(items.visible, true)).orderBy(asc(items.sort), asc(items.id));
  return gs.map((g) => ({ ...g, items: its.filter((i) => i.groupId === g.id) })).filter((g) => g.items.length > 0);
}

export async function getSetting(db: Db, key: string): Promise<string | undefined> {
  const r = await db.select().from(settings).where(eq(settings.key, key));
  return r[0]?.value;
}
