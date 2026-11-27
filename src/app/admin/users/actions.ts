"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { requireUser } from "@/lib/auth/current";
import { SESSION_COOKIE } from "@/lib/auth/session";
import { MIN_PASSWORD } from "@/lib/auth/password";
import {
  changeOwnPassword, createUser, resetPassword, setUserActive, setUserRole, type UserError, type UserResult,
} from "@/lib/cms/users";

export type State = { ok?: boolean; error?: string } | undefined;

const MESSAGES: Record<UserError, string> = {
  invalid: "Neispravan unos / Invalid input",
  weak_password: `Lozinka mora imati najmanje ${MIN_PASSWORD} znakova / Password must be at least ${MIN_PASSWORD} characters`,
  email_taken: "Email je već u upotrebi / Email already in use",
  not_found: "Korisnik nije pronađen / User not found",
  last_admin: "Ne možete ukloniti zadnjeg administratora / You cannot remove the last administrator",
  wrong_password: "Trenutna lozinka nije točna / Current password is incorrect",
};

const id = z.coerce.number().int().positive();
const str = (n: string, f: FormData) => String(f.get(n) ?? "");

function done(r: UserResult): State {
  if (!r.ok) return { error: MESSAGES[r.error] };
  revalidatePath("/admin/users");
  return { ok: true };
}

// Every action below re-checks authorization on the server (the UI hiding links is not a control).

export async function createUserAction(_: State, form: FormData): Promise<State> {
  const actor = await requireUser("admin");
  return done(
    await createUser(await getDb(), actor.id, {
      email: str("email", form), name: str("name", form), role: str("role", form) as "admin" | "editor", password: str("password", form),
    }),
  );
}

export async function setRoleAction(_: State, form: FormData): Promise<State> {
  const actor = await requireUser("admin");
  const i = id.safeParse(form.get("id"));
  const role = z.enum(["admin", "editor"]).safeParse(form.get("role"));
  if (!i.success || !role.success) return { error: MESSAGES.invalid };
  return done(await setUserRole(await getDb(), actor.id, i.data, role.data));
}

export async function setActiveAction(_: State, form: FormData): Promise<State> {
  const actor = await requireUser("admin");
  const i = id.safeParse(form.get("id"));
  const v = z.enum(["0", "1"]).safeParse(form.get("active"));
  if (!i.success || !v.success) return { error: MESSAGES.invalid };
  return done(await setUserActive(await getDb(), actor.id, i.data, v.data === "1"));
}

export async function resetPasswordAction(_: State, form: FormData): Promise<State> {
  const actor = await requireUser("admin");
  const i = id.safeParse(form.get("id"));
  if (!i.success) return { error: MESSAGES.invalid };
  return done(await resetPassword(await getDb(), actor.id, i.data, str("password", form)));
}

export async function changeOwnPasswordAction(_: State, form: FormData): Promise<State> {
  const user = await requireUser();
  const next = str("next", form);
  if (next !== str("confirm", form)) return { error: "Lozinke se ne podudaraju / Passwords do not match" };
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  const r = await changeOwnPassword(await getDb(), user.id, str("current", form), next, token);
  return r.ok ? { ok: true } : { error: MESSAGES[r.error] };
}
