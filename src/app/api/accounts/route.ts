import { z } from "zod";
import { sql } from "drizzle-orm";
import { requireUser, createAccount, disableAccount, limit } from "@/lib/auth";
import { database } from "@/lib/db";
import {
  assertOrigin,
  json,
  failure,
  readJson,
  pageSchema,
  ApiError,
} from "@/lib/server/http";
const schema = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("create"),
      email: z
        .email()
        .max(254)
        .transform((s) => s.toLowerCase()),
      name: z.string().trim().min(2).max(100),
      password: z.string().min(12).max(128),
      parcelIds: z.array(z.string().min(1).max(100)).min(1).max(100),
    })
    .strict(),
  z.object({ action: z.literal("disable"), id: z.uuid() }).strict(),
]);
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    if (user.role !== "ADMIN") throw new ApiError("FORBIDDEN", 403);
    const db = await database(),
      offset = pageSchema.parse(
        new URL(request.url).searchParams.get("offset") ?? 0,
      );
    return json({
      accounts: (
        await db.execute(
          sql`select id,email,display_name,role,disabled from app_users order by created_at,id limit 10 offset ${offset}`,
        )
      ).rows,
    });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    if (user.role !== "ADMIN") throw new ApiError("FORBIDDEN", 403);
    await limit(`accounts:${user.id}`, 10, 60);
    const a = schema.parse(await readJson(request, 12000));
    if (a.action === "create")
      await createAccount(user, a.email, a.name, a.password, a.parcelIds);
    else await disableAccount(user, a.id);
    return json({ ok: true });
  } catch (e) {
    return failure(e);
  }
}
