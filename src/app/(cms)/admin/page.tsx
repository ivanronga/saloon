import { asc } from "drizzle-orm";
import { getDb } from "@/lib/db";
import { groups, items } from "@/lib/db/schema";
import ItemRow, { ConfirmButton, GroupRename, NewGroup, NewItem } from "./forms";
import {
  deleteGroupAction, deleteItemAction, moveGroupAction, moveItemAction, toggleGroupAction, toggleItemAction,
} from "./actions";

function Move({ id, dir, action, label }: { id: number; dir: "up" | "down"; action: (f: FormData) => Promise<void>; label: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="dir" value={dir} />
      <button className="btn-small" aria-label={label} title={label}>{dir === "up" ? "↑" : "↓"}</button>
    </form>
  );
}

function Toggle({ id, visible, action }: { id: number; visible: boolean; action: (f: FormData) => Promise<void> }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="visible" value={visible ? "0" : "1"} />
      <button className="btn-small">{visible ? "Sakrij / Hide" : "Prikaži / Show"}</button>
    </form>
  );
}

function Remove({ id, action, message }: { id: number; action: (f: FormData) => Promise<void>; message: string }) {
  return (
    <form action={action}>
      <input type="hidden" name="id" value={id} />
      <ConfirmButton className="btn-small btn-danger" message={message}>Obriši / Delete</ConfirmButton>
    </form>
  );
}

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
          <section key={g.id} className={`admin-group${g.visible ? "" : " is-hidden"}`}>
            <h2>
              {g.nameHr} <span className="muted">/ {g.nameEn} · {list.length}</span>
              {!g.visible && <span className="badge">skriveno / hidden</span>}
            </h2>
            <details className="group-tools">
              <summary>Uredi grupu / Edit group</summary>
              <div className="toolbar">
                <Move id={g.id} dir="up" action={moveGroupAction} label="Pomakni grupu gore / Move group up" />
                <Move id={g.id} dir="down" action={moveGroupAction} label="Pomakni grupu dolje / Move group down" />
                <Toggle id={g.id} visible={g.visible} action={toggleGroupAction} />
                {list.length === 0 && (
                  <Remove id={g.id} action={deleteGroupAction} message={`Obrisati grupu „${g.nameHr}”? / Delete group "${g.nameEn}"?`} />
                )}
              </div>
              <GroupRename group={g} />
              {list.length > 0 && <p className="muted">Grupu možete obrisati kad je prazna; inače je sakrijte. / A group can be deleted when empty; otherwise hide it.</p>}
            </details>

            {list.map((i) => (
              <details key={i.id} className={`item-details${i.visible ? "" : " is-hidden"}`}>
                <summary>
                  <strong>{i.nameHr}</strong> <span className="muted">/ {i.nameEn}</span>
                  {!i.visible && <span className="badge">skriveno / hidden</span>}
                  <span className="summary-meta">{i.qtyText} · {(i.priceCents / 100).toFixed(2).replace(".", ",")} €</span>
                </summary>
                <div className="toolbar">
                  <Move id={i.id} dir="up" action={moveItemAction} label="Pomakni gore / Move up" />
                  <Move id={i.id} dir="down" action={moveItemAction} label="Pomakni dolje / Move down" />
                  <Toggle id={i.id} visible={i.visible} action={toggleItemAction} />
                  <Remove id={i.id} action={deleteItemAction} message={`Obrisati „${i.nameHr}”? Ovo se ne može poništiti. / Delete "${i.nameEn}"? This cannot be undone.`} />
                </div>
                <ItemRow item={i} />
              </details>
            ))}
            <NewItem groupId={g.id} />
          </section>
        );
      })}
      <NewGroup />
    </>
  );
}
