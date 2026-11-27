import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { getDb } from "../db";
import { getSessionUser, SESSION_COOKIE } from "./session";

export async function getCurrentUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value;
  return getSessionUser(await getDb(), token);
}

/** Server-side authorization check: call at the top of every admin page and action. */
export async function requireUser(role?: "admin") {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (role && u.role !== role) redirect("/admin");
  return u;
}
