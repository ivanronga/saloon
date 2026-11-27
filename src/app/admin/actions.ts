"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth/current";
import { updateItem } from "@/lib/cms/items";

const id = z.coerce.number().int().positive();
const str = (n: string, f: FormData) => String(f.get(n) ?? "");

export async function saveItemAction(_: { ok?: boolean; error?: string } | undefined, form: FormData) {
  const user = await requireUser();
  const itemId = id.safeParse(form.get("id"));
  if (!itemId.success) return { error: "Neispravan unos / Invalid input" };
  const r = await updateItem(await getDb(), user.id, itemId.data, {
    nameHr: str("nameHr", form), nameEn: str("nameEn", form), noteHr: str("noteHr", form), noteEn: str("noteEn", form),
    qtyText: str("qtyText", form), price: str("price", form), anchorPrice: str("anchorPrice", form),
  });
  if (!r.ok) return { error: "Neispravan unos / Invalid input" };
  if (r.changed.length) {
    revalidatePath("/hr");
    revalidatePath("/en");
  }
  return { ok: true };
}
