import { count } from "drizzle-orm";
import { getDb, type Db } from "../src/lib/db";
import { groups as gT, items as iT, settings } from "../src/lib/db/schema";
import { groups, siteTexts } from "../seed/data";

export async function seed(db: Db) {
  await db.delete(iT);
  await db.delete(gT);
  await db.delete(settings);
  let gi = 0;
  for (const g of groups) {
    const [row] = await db.insert(gT).values({ nameHr: g.hr, nameEn: g.en, sort: gi++ }).returning();
    let ii = 0;
    for (const [hr, en, qty, price, nh, ne] of g.items) {
      await db.insert(iT).values({
        groupId: row.id, nameHr: hr, nameEn: en, qtyText: qty, noteHr: nh ?? "", noteEn: ne ?? "",
        priceCents: price, anchorPriceCents: price, sort: ii++,
      });
    }
  }
  await db.insert(settings).values({ key: "site_texts", value: JSON.stringify(siteTexts) });
}

export async function counts(db: Db) {
  const [g] = await db.select({ n: count() }).from(gT);
  const [i] = await db.select({ n: count() }).from(iT);
  return { groups: g.n, items: i.n };
}

if (process.argv[1]?.endsWith("seed.ts")) {
  (async () => {
    const db = await getDb();
    await seed(db);
    console.log("Seeded", await counts(db));
    process.exit(0);
  })();
}
