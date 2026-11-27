import { beforeAll, describe, expect, it } from "vitest";
import { createDb, type Db } from "@/lib/db";
import { getPriceList } from "@/lib/queries";
import { groups } from "../seed/data";
import { counts, seed } from "../scripts/seed";

let db: Db;
beforeAll(async () => {
  db = await createDb();
  await seed(db);
});

describe("seed", () => {
  it("loads every group and item", async () => {
    const expectedItems = groups.reduce((n, g) => n + g.items.length, 0);
    expect(await counts(db)).toEqual({ groups: groups.length, items: expectedItems });
    expect(expectedItems).toBe(125); // 135 "€" in PDF minus 10 wine quantities misprinted with €
  });
  it("keeps per-group counts and valid prices", async () => {
    const list = await getPriceList(db);
    expect(list.map((g) => g.items.length)).toEqual(groups.map((g) => g.items.length));
    for (const g of list) for (const i of g.items) {
      expect(Number.isInteger(i.priceCents) && i.priceCents > 0).toBe(true);
      expect(i.anchorPriceCents).toBe(i.priceCents);
    }
  });
  it("has Coca-Cola 0,10 l at 1,70 €", async () => {
    const [g] = await getPriceList(db);
    expect(g.nameHr).toBe("Gazirana pića");
    expect(g.items[0]).toMatchObject({ nameHr: "Coca-Cola", qtyText: "0,10 l", anchorPriceCents: 170 });
  });
});
