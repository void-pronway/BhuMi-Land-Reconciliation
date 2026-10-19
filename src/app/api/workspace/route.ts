import { z } from "zod";
import {
  workspace,
  runReconciliation,
  createReview,
  updateReview,
  appendSnapshot,
  getRun,
} from "@/lib/db";
import { requireUser, limit } from "@/lib/auth";
import { holdingSchema } from "@/lib/domain/reconciliation/types";
import {
  assertOrigin,
  json,
  failure,
  readJson,
  pageSchema,
} from "@/lib/server/http";
export const dynamic = "force-dynamic";
const id = z
  .string()
  .min(1)
  .max(100)
  .regex(/^[a-zA-Z0-9_-]+$/);
const note = z.string().trim().min(5).max(2000);
const action = z.discriminatedUnion("action", [
  z
    .object({
      action: z.literal("run"),
      parcelId: id,
      snapshotId: id.optional(),
    })
    .strict(),
  z
    .object({ action: z.literal("createReview"), runId: z.uuid(), note })
    .strict(),
  z
    .object({
      action: z.literal("review"),
      id: z.uuid(),
      status: z.enum([
        "UNDER_REVIEW",
        "NEEDS_EVIDENCE",
        "RESOLVED",
        "ESCALATED",
      ]),
      note,
      version: z.number().int().positive(),
    })
    .strict(),
  z
    .object({
      action: z.literal("snapshot"),
      parcelId: id,
      holdings: z.array(holdingSchema.strict()).min(1).max(100),
      note,
      effectiveDate: z.iso.date(),
      previousSnapshotId: id.nullable(),
    })
    .strict(),
]);
export async function GET(request: Request) {
  try {
    const user = await requireUser();
    await limit(`read:${user.id}`, 120, 60);
    const params = new URL(request.url).searchParams;
    if (params.has("run"))
      return json({
        run: await getRun(user, z.uuid().parse(params.get("run"))),
      });
    const offset = pageSchema.parse(params.get("offset") ?? 0),
      parcelId = params.has("parcel")
        ? id.parse(params.get("parcel"))
        : undefined;
    return json({ ...(await workspace(user, offset, parcelId)), user });
  } catch (e) {
    return failure(e);
  }
}
export async function POST(request: Request) {
  try {
    assertOrigin(request);
    const user = await requireUser();
    await limit(`write:${user.id}`, 30, 60);
    const a = action.parse(await readJson(request));
    let id: string | undefined;
    if (a.action === "run")
      id = await runReconciliation(user, a.parcelId, a.snapshotId);
    if (a.action === "createReview") await createReview(user, a.runId, a.note);
    if (a.action === "review")
      await updateReview(user, a.id, a.status, a.note, a.version);
    if (a.action === "snapshot")
      id = await appendSnapshot(
        user,
        a.parcelId,
        a.holdings,
        a.note,
        a.effectiveDate,
        a.previousSnapshotId,
      );
    return json({ ok: true, id });
  } catch (e) {
    return failure(e);
  }
}
