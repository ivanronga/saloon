"use client";
import { useActionState, useEffect, useRef, type ReactNode } from "react";
import {
  createGroupAction, createItemAction, renameGroupAction, saveItemAction,
} from "./actions";
import type { groups, items } from "@/lib/db/schema";

type Item = typeof items.$inferSelect;
type Group = typeof groups.$inferSelect;
type State = { ok?: boolean; error?: string } | undefined;

const eur = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

function Status({ state }: { state: State }) {
  return (
    <span role="status">
      {state?.ok ? <span className="ok">✓ Spremljeno / Saved</span> : null}
      {state?.error ? <span className="error">{state.error}</span> : null}
    </span>
  );
}

/** Button that asks for confirmation before submitting its form (used for deletes). */
export function ConfirmButton({ message, children, className }: { message: string; children: ReactNode; className?: string }) {
  return (
    <button
      className={className}
      onClick={(e) => {
        if (!window.confirm(message)) e.preventDefault();
      }}
    >
      {children}
    </button>
  );
}

function ItemFields({ item }: { item?: Item }) {
  return (
    <>
      <fieldset>
        <legend>🇭🇷 Hrvatski</legend>
        <label>Naziv<input name="nameHr" defaultValue={item?.nameHr} required maxLength={120} /></label>
        <label>Napomena<input name="noteHr" defaultValue={item?.noteHr} maxLength={300} /></label>
      </fieldset>
      <fieldset>
        <legend>🇬🇧 English</legend>
        <label>Name<input name="nameEn" defaultValue={item?.nameEn} required maxLength={120} /></label>
        <label>Note<input name="noteEn" defaultValue={item?.noteEn} maxLength={300} /></label>
      </fieldset>
      <fieldset className="fs-price">
        <legend>€ Količina i cijene / Quantity &amp; prices</legend>
        <label>Količina / Quantity<input name="qtyText" defaultValue={item?.qtyText} maxLength={40} placeholder="0,10 l" /></label>
        <label>Aktualna cijena / Current price (€)<input name="price" defaultValue={item ? eur(item.priceCents) : ""} inputMode="decimal" required placeholder="1,60" /></label>
        <label>Sidrena cijena / Anchored price (€)<input name="anchorPrice" defaultValue={item ? eur(item.anchorPriceCents) : ""} inputMode="decimal" placeholder="1,70" /></label>
      </fieldset>
    </>
  );
}

export default function ItemRow({ item }: { item: Item }) {
  const [state, action, pending] = useActionState(saveItemAction, undefined);
  return (
    <form action={action} className="item-card">
      <input type="hidden" name="id" value={item.id} />
      <ItemFields item={item} />
      <div className="item-actions">
        <button disabled={pending}>{pending ? "Spremam… / Saving…" : "Spremi / Save"}</button>
        <Status state={state} />
      </div>
    </form>
  );
}

export function NewItem({ groupId }: { groupId: number }) {
  const [state, action, pending] = useActionState(createItemAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <details className="item-details new">
      <summary><strong>+ Novi artikl / Add item</strong></summary>
      <form ref={ref} action={action} className="item-card">
        <input type="hidden" name="groupId" value={groupId} />
        <ItemFields />
        <div className="item-actions">
          <button disabled={pending}>{pending ? "Dodajem… / Adding…" : "Dodaj / Add"}</button>
          <Status state={state} />
        </div>
      </form>
    </details>
  );
}

export function GroupRename({ group }: { group: Group }) {
  const [state, action, pending] = useActionState(renameGroupAction, undefined);
  return (
    <form action={action} className="group-rename">
      <input type="hidden" name="id" value={group.id} />
      <label>🇭🇷 Naziv grupe<input name="nameHr" defaultValue={group.nameHr} required maxLength={120} /></label>
      <label>🇬🇧 Group name<input name="nameEn" defaultValue={group.nameEn} required maxLength={120} /></label>
      <button disabled={pending}>Preimenuj / Rename</button>
      <Status state={state} />
    </form>
  );
}

export function NewGroup() {
  const [state, action, pending] = useActionState(createGroupAction, undefined);
  const ref = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (state?.ok) ref.current?.reset();
  }, [state]);
  return (
    <form ref={ref} action={action} className="group-rename new-group">
      <strong>+ Nova grupa / New group</strong>
      <label>🇭🇷 Naziv<input name="nameHr" required maxLength={120} /></label>
      <label>🇬🇧 Name<input name="nameEn" required maxLength={120} /></label>
      <button disabled={pending}>Dodaj / Add</button>
      <Status state={state} />
    </form>
  );
}
