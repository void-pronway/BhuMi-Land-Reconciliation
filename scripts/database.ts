import { existsSync } from "node:fs";
if (existsSync(".env.local")) process.loadEnvFile(".env.local");
import { database, loadParcels } from "../src/lib/db";
async function main() {
  await database();
  console.log(
    `Migrations applied; ${(await loadParcels()).length} synthetic parcels available. Existing records preserved.`,
  );
  process.exit(0);
}
main().catch((e) => {
  console.error(e);
  process.exit(1);
});
