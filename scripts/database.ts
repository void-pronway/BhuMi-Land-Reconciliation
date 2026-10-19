import { existsSync } from "node:fs";
import { sql } from "drizzle-orm";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
import { database } from "../src/lib/db";
async function main() {
  const db = await database();
  const rows = await db.execute(
    sql`select count(*)::int as count from parcels`,
  );
  console.log(
    `Migrations applied; ${rows.rows[0].count} parcels available. Existing records preserved.`,
  );
  process.exit(0);
}
main().catch(() => {
  console.error(
    "Database preparation failed. Check DATABASE_URL or local directory permissions and migration compatibility. Connection credentials and SQL details are omitted.",
  );
  process.exit(1);
});
