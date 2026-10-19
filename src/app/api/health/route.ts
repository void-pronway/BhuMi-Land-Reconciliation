import { sql } from "drizzle-orm";
import { database } from "@/lib/db";
import { json, failure } from "@/lib/server/http";
export const dynamic = "force-dynamic";
export async function GET() {
  try {
    await (await database()).execute(sql`select 1`);
    return json({ status: "ok" });
  } catch (e) {
    return failure(e);
  }
}
