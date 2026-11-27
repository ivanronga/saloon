import { drizzle as drizzlePg } from "drizzle-orm/node-postgres";
import { migrate as migratePg } from "drizzle-orm/node-postgres/migrator";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";
import { mkdirSync } from "node:fs";
import path from "node:path";
import * as schema from "./schema";

/** Driver-agnostic Postgres database: PGlite locally and in tests, node-postgres (Neon) in production. */
export type Db = PgDatabase<PgQueryResultHKT, typeof schema>;

const migrationsFolder = () => path.join(process.cwd(), "drizzle");

/** Embedded PGlite, migrated on open. `dataDir` undefined => in-memory (tests). */
export async function createDb(dataDir?: string): Promise<Db> {
  const [{ PGlite }, { drizzle }, { migrate }] = await Promise.all([
    import("@electric-sql/pglite"),
    import("drizzle-orm/pglite"),
    import("drizzle-orm/pglite/migrator"),
  ]);
  if (dataDir) mkdirSync(path.dirname(dataDir), { recursive: true });
  const db = drizzle(new PGlite(dataDir), { schema });
  await migrate(db, { migrationsFolder: migrationsFolder() });
  return db;
}

/** Hosted Postgres (Neon etc.) via DATABASE_URL. Migrations are a deploy step (`npm run migrate`), not run per request. */
export async function createPgDb(url: string): Promise<Db> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 3 });
  return drizzlePg(pool, { schema });
}

/** Apply pending migrations to the DATABASE_URL database. */
export async function migratePgDb(url: string): Promise<void> {
  const { Pool } = await import("pg");
  const pool = new Pool({ connectionString: url, max: 1 });
  try {
    await migratePg(drizzlePg(pool, { schema }), { migrationsFolder: migrationsFolder() });
  } finally {
    await pool.end();
  }
}

const g = globalThis as unknown as { __saloonDb?: Promise<Db> };

/** Singleton for the app (survives Next dev HMR). DATABASE_URL => hosted Postgres, else local PGlite files. */
export function getDb(): Promise<Db> {
  g.__saloonDb ??= process.env.DATABASE_URL
    ? createPgDb(process.env.DATABASE_URL)
    : createDb(process.env.PGLITE_DIR ?? path.join(process.cwd(), ".data", "pg"));
  return g.__saloonDb;
}
