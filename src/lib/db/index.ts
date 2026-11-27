import { PGlite } from "@electric-sql/pglite";
import { drizzle, type PgliteDatabase } from "drizzle-orm/pglite";
import { migrate } from "drizzle-orm/pglite/migrator";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

export type Db = PgliteDatabase<typeof schema>;

/** Create a migrated database. `dataDir` undefined => in-memory (tests). */
export async function createDb(dataDir?: string): Promise<Db> {
  if (dataDir) mkdirSync(path.dirname(dataDir), { recursive: true });
  const client = new PGlite(dataDir);
  const db = drizzle(client, { schema });
  await migrate(db, { migrationsFolder: path.join(process.cwd(), "drizzle") });
  return db;
}

const g = globalThis as unknown as { __saloonDb?: Promise<Db> };

/** Singleton for the app (survives Next dev HMR). Prod swaps in Neon in Phase 7. */
export function getDb(): Promise<Db> {
  g.__saloonDb ??= createDb(process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pg"));
  return g.__saloonDb;
}
