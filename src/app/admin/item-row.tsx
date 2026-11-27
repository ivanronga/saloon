"use client";
import { useActionState } from "react";
import { saveItemAction } from "./actions";
import type { items } from "@/lib/db/schema";

const eur = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export default function ItemRow({ item }: { item: typeof items.$inferSelect }) {
  const [state, action, pending] = useActionState(saveItemAction, undefined);
  return (
    <form action={action} className="item-row">
      <input type="hidden" name="id" value={item.id} />
      <input name="nameHr" defaultValue={item.nameHr} aria-label="Naziv HR" required maxLength={120} />
      <input name="nameEn" defaultValue={item.nameEn} aria-label="Name EN" required maxLength={120} />
      <input name="qtyText" defaultValue={item.qtyText} aria-label="Količina / Quantity" maxLength={40} size={8} />
      <input name="price" defaultValue={eur(item.priceCents)} aria-label="Aktualna cijena / Current price" inputMode="decimal" required size={7} />
      <input name="anchorPrice" defaultValue={eur(item.anchorPriceCents)} aria-label="Sidrena cijena / Anchored price" inputMode="decimal" size={7} />
      <input name="noteHr" defaultValue={item.noteHr} aria-label="Napomena HR" maxLength={300} />
      <input name="noteEn" defaultValue={item.noteEn} aria-label="Note EN" maxLength={300} />
      <button disabled={pending}>Spremi / Save</button>
      <span role="status">
        {state?.ok ? "✓" : ""}
        {state?.error ? <span className="error">{state.error}</span> : null}
      </span>
    </form>
  );
}
