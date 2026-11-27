"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth/current";
import { updateItem } from "@/lib/cms/items";
import {
  createGroup, createItem, deleteGroup, deleteItem, moveGroup, moveItem, renameGroup, setGroupVisible, setItemVisible,
  type Result,
} from "@/lib/cms/structure";

type State = { ok?: boolean; error?: string } | undefined;
const INVALID = "Neispravan unos / Invalid input";

const id = z.coerce.number().int().positive();
const dir = z.enum(["up", "down"]);
const flag = z.enum(["0", "1"]);
const str = (n: string, f: FormData) => String(f.get(n) ?? "");

function refresh() {
  revalidatePath("/hr");
  revalidatePath("/en");
  revalidatePath("/admin");
}
const itemFields = (f: FormData) => ({
  nameHr: str("nameHr", f), nameEn: str("nameEn", f), noteHr: str("noteHr", f), noteEn: str("noteEn", f),
  qtyText: str("qtyText", f), price: str("price", f), anchorPrice: str("anchorPrice", f),
});
const groupFields = (f: FormData) => ({ nameHr: str("nameHr", f), nameEn: str("nameEn", f) });

/** Shared tail: turn a Result into form state and refresh pages on success. */
function done(r: Result): State {
  if (!r.ok) return { error: INVALID };
  refresh();
  return { ok: true };
}

/* ---------- items ---------- */

export async function saveItemAction(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const itemId = id.safeParse(form.get("id"));
  if (!itemId.success) return { error: INVALID };
  const r = await updateItem(await getDb(), user.id, itemId.data, itemFields(form));
  if (!r.ok) return { error: INVALID };
  if (r.changed.length) refresh();
  return { ok: true };
}

export async function createItemAction(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const gid = id.safeParse(form.get("groupId"));
  if (!gid.success) return { error: INVALID };
  return done(await createItem(await getDb(), user.id, gid.data, itemFields(form)));
}

export async function moveItemAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  const d = dir.safeParse(form.get("dir"));
  if (i.success && d.success) done(await moveItem(await getDb(), user.id, i.data, d.data));
}

export async function toggleItemAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  const v = flag.safeParse(form.get("visible"));
  if (i.success && v.success) done(await setItemVisible(await getDb(), user.id, i.data, v.data === "1"));
}

export async function deleteItemAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  if (i.success) done(await deleteItem(await getDb(), user.id, i.data));
}

/* ---------- groups ---------- */

export async function createGroupAction(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  return done(await createGroup(await getDb(), user.id, groupFields(form)));
}

export async function renameGroupAction(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  if (!i.success) return { error: INVALID };
  return done(await renameGroup(await getDb(), user.id, i.data, groupFields(form)));
}

export async function moveGroupAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  const d = dir.safeParse(form.get("dir"));
  if (i.success && d.success) done(await moveGroup(await getDb(), user.id, i.data, d.data));
}

export async function toggleGroupAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  const v = flag.safeParse(form.get("visible"));
  if (i.success && v.success) done(await setGroupVisible(await getDb(), user.id, i.data, v.data === "1"));
}

export async function deleteGroupAction(form: FormData) {
  const user = await requireUser();
  const i = id.safeParse(form.get("id"));
  if (i.success) done(await deleteGroup(await getDb(), user.id, i.data));
}
