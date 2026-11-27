"use client";
import { useActionState } from "react";
import { saveItemAction } from "./actions";
import type { items } from "@/lib/db/schema";

const eur = (c: number | null) => (c == null ? "" : (c / 100).toFixed(2).replace(".", ","));

export default function ItemRow({ item }: { item: typeof items.$inferSelect }) {
  const [state, action, pending] = useActionState(saveItemAction, undefined);
  return (
    <form action={action} className="item-card">
      <input type="hidden" name="id" value={item.id} />

      <fieldset>
        <legend>🇭🇷 Hrvatski</legend>
        <label>Naziv<input name="nameHr" defaultValue={item.nameHr} required maxLength={120} /></label>
        <label>Napomena<input name="noteHr" defaultValue={item.noteHr} maxLength={300} /></label>
      </fieldset>

      <fieldset>
        <legend>🇬🇧 English</legend>
        <label>Name<input name="nameEn" defaultValue={item.nameEn} required maxLength={120} /></label>
        <label>Note<input name="noteEn" defaultValue={item.noteEn} maxLength={300} /></label>
      </fieldset>

      <fieldset className="fs-price">
        <legend>€ Količina i cijene / Quantity &amp; prices</legend>
        <label>Količina / Quantity<input name="qtyText" defaultValue={item.qtyText} maxLength={40} placeholder="0,10 l" /></label>
        <label>Aktualna cijena / Current price (€)<input name="price" defaultValue={eur(item.priceCents)} inputMode="decimal" required placeholder="1,60" /></label>
        <label>Sidrena cijena / Anchored price (€)<input name="anchorPrice" defaultValue={eur(item.anchorPriceCents)} inputMode="decimal" placeholder="1,70" /></label>
      </fieldset>

      <div className="item-actions">
        <button disabled={pending}>{pending ? "Spremam… / Saving…" : "Spremi / Save"}</button>
        <span role="status">
          {state?.ok ? <span className="ok">✓ Spremljeno / Saved</span> : null}
          {state?.error ? <span className="error">{state.error}</span> : null}
        </span>
      </div>
    </form>
  );
}
