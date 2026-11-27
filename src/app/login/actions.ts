"use server";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { login } from "@/lib/auth/login";
import { destroySession, SESSION_COOKIE } from "@/lib/auth/session";

const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(200) });

export async function loginAction(_: { error?: string } | undefined, form: FormData) {
  const parsed = schema.safeParse({ email: form.get("email"), password: form.get("password") });
  if (!parsed.success) return { error: "Neispravan unos / Invalid input" };
  const r = await login(await getDb(), parsed.data.email, parsed.data.password);
  if (!r.ok) {
    return { error: r.reason === "locked" ? "Previše pokušaja, pokušajte kasnije / Too many attempts, try later" : "Neispravni podaci / Invalid credentials" };
  }
  (await cookies()).set(SESSION_COOKIE, r.token, {
    httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", expires: r.expiresAt,
  });
  redirect("/admin");
}

export async function logoutAction() {
  const jar = await cookies();
  await destroySession(await getDb(), jar.get(SESSION_COOKIE)?.value);
  jar.delete(SESSION_COOKIE);
  redirect("/login");
}
