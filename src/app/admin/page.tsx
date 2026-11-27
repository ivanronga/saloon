import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { groups, items } from "@/lib/db/schema";
import ItemRow from "./item-row";

export default async function AdminHome() {
  const db = await getDb();
  const gs = await db.select().from(groups).orderBy(asc(groups.sort), asc(groups.id));
  const its = await db.select().from(items).orderBy(asc(items.sort), asc(items.id));
  return (
    <>
      <p className="muted">
        Svaki artikl ima tri bloka: hrvatski tekst, engleski tekst i cijene. / Each item has three blocks: Croatian text, English text and prices.
      </p>
      {gs.map((g) => {
        const list = its.filter((i) => i.groupId === g.id);
        return (
          <section key={g.id} className="admin-group">
            <h2>{g.nameHr} <span className="muted">/ {g.nameEn} · {list.length}</span></h2>
            {list.map((i) => (
              <details key={i.id} className="item-details">
                <summary>
                  <strong>{i.nameHr}</strong> <span className="muted">/ {i.nameEn}</span>
                  <span className="summary-meta">{i.qtyText} · {(i.priceCents / 100).toFixed(2).replace(".", ",")} €</span>
                </summary>
                <ItemRow item={i} />
              </details>
            ))}
          </section>
        );
      })}
    </>
  );
}
