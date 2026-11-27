import { migratePgDb } from "../src/lib/db";

/** Usage: DATABASE_URL=postgres://... npm run migrate  — creates/updates tables on the hosted database. */
const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Set DATABASE_URL first.");
  process.exit(1);
}
migratePgDb(url)
  .then(() => { console.log("Migrations applied."); process.exit(0); })
  .catch((e) => { console.error(e.message); process.exit(1); });
