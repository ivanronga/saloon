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
      <p>Stupci / Columns: naziv HR, name EN, količina, aktualna cijena, sidrena cijena, napomena HR, note EN</p>
      {gs.map((g) => (
        <section key={g.id}>
          <h2>{g.nameHr} / {g.nameEn}</h2>
          {its.filter((i) => i.groupId === g.id).map((i) => <ItemRow key={i.id} item={i} />)}
        </section>
      ))}
    </>
  );
}
