import { createInterface } from "node:readline/promises";
import { eq } from "drizzle-orm";
import { getDb } from "../src/lib/db";
import { users } from "../src/lib/db/schema";
import { hashPassword, MIN_PASSWORD } from "../src/lib/auth/password";

/** Usage: npm run create-admin  (prompts)  |  ADMIN_EMAIL=.. ADMIN_PASSWORD=.. npm run create-admin */
async function main() {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const email = (process.env.ADMIN_EMAIL ?? (await rl.question("Admin email: "))).trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD ?? (await rl.question(`Password (min ${MIN_PASSWORD} chars): `));
  rl.close();
  if (!/^\S+@\S+\.\S+$/.test(email)) throw new Error("Invalid email");
  if (password.length < MIN_PASSWORD) throw new Error(`Password must be at least ${MIN_PASSWORD} characters`);
  const db = await getDb();
  const passwordHash = await hashPassword(password);
  const [existing] = await db.select().from(users).where(eq(users.email, email));
  if (existing) await db.update(users).set({ passwordHash, role: "admin", active: true }).where(eq(users.id, existing.id));
  else await db.insert(users).values({ email, name: "Admin", role: "admin", passwordHash });
  console.log(`Admin ${email} ready.`);
  process.exit(0);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
