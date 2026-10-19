import { redirect, notFound } from "next/navigation";
import { sql } from "drizzle-orm";
import { currentUser } from "@/lib/auth";
import { database, getRun, type Audit, type Review } from "@/lib/db";
import { ApiError } from "@/lib/server/http";
import Report from "@/components/report";
export const dynamic = "force-dynamic";
export default async function ReportPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/?view=login");
  const { id } = await params;
  let run;
  try {
    run = await getRun(user, id);
  } catch (e) {
    if (e instanceof ApiError && [403, 404].includes(e.status)) notFound();
    throw e;
  }
  const db = await database();
  const review = (
    await db.execute(sql`select * from review_cases where run_id=${id}`)
  ).rows[0] as unknown as Review | undefined;
  const audit = review
    ? ((
        await db.execute(
          sql`select * from audit_log where entity_id=${review.id} and parcel_id=${run.parcel_id} order by created_at desc limit 100`,
        )
      ).rows as unknown as Audit[])
    : [];
  return (
    <Report
      run={JSON.parse(JSON.stringify(run))}
      review={review ? JSON.parse(JSON.stringify(review)) : null}
      audit={JSON.parse(JSON.stringify(audit))}
    />
  );
}
