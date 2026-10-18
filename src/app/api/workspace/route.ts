import { NextResponse } from "next/server";
import { z } from "zod";
import {
  workspace,
  runReconciliation,
  createReview,
  updateReview,
  appendSnapshot,
} from "@/lib/db";
import { isReviewer, sameOrigin, configured } from "@/lib/auth";
import { holdingSchema } from "@/lib/domain/reconciliation/types";
export const dynamic = "force-dynamic";
const note = z.string().trim().min(5).max(2000);
const action = z.discriminatedUnion("action", [
  z.object({
    action: z.literal("run"),
    parcelId: z.string(),
    snapshotId: z.string().optional(),
  }),
  z.object({ action: z.literal("createReview"), runId: z.string(), note }),
  z.object({
    action: z.literal("review"),
    id: z.string(),
    status: z.enum(["UNDER_REVIEW", "NEEDS_EVIDENCE", "RESOLVED", "ESCALATED"]),
    note,
  }),
  z.object({
    action: z.literal("snapshot"),
    parcelId: z.string(),
    holdings: z.array(holdingSchema).min(1).max(100),
    note,
  }),
]);
export async function GET() {
  return NextResponse.json({
    ...(await workspace()),
    reviewer: await isReviewer(),
    authConfigured: configured(),
  });
}
export async function POST(request: Request) {
  if (!sameOrigin(request) || !(await isReviewer()))
    return NextResponse.json(
      { error: "Reviewer authorization required" },
      { status: 403 },
    );
  try {
    const raw = await request.text();
    if (raw.length > 30000)
      return NextResponse.json({ error: "Request too large" }, { status: 413 });
    const a = action.parse(JSON.parse(raw));
    let id: string | undefined;
    if (a.action === "run")
      id = await runReconciliation(a.parcelId, a.snapshotId);
    if (a.action === "createReview") await createReview(a.runId, a.note);
    if (a.action === "review") await updateReview(a.id, a.status, a.note);
    if (a.action === "snapshot")
      id = await appendSnapshot(a.parcelId, a.holdings, a.note);
    return NextResponse.json({ ok: true, id });
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof z.ZodError
            ? "Invalid input: check fractions and provide a note of at least 5 characters."
            : e instanceof Error &&
                [
                  "Invalid review transition",
                  "Review not found",
                  "Parcel not found",
                  "Duplicate or unknown party",
                  "A run with findings is required",
                  "Snapshot not found",
                ].includes(e.message)
              ? e.message
              : "Unable to complete this action.",
      },
      { status: 400 },
    );
  }
}
