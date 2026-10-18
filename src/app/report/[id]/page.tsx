import { notFound } from "next/navigation";
import { workspace } from "@/lib/db";
import { ResultView } from "@/components/workspace";
import PrintButton from "@/components/print-button";
export const dynamic = "force-dynamic";
export default async function Report({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await workspace();
  const run = data.runs.find((r) => r.id === id);
  if (!run) notFound();
  const review = data.reviews.find((r) => r.run_id === id);
  return (
    <main className="print-page">
      <div className="eyebrow">BHUMI / SYNTHETIC EVIDENCE REPORT</div>
      <h1>{run.parcel_id} · Reconciliation record</h1>
      <p>
        Run {run.id} · {String(run.created_at)} · Rules{" "}
        {run.result.rulesVersion}
      </p>
      <PrintButton />
      <ResultView result={run.result} />
      <section className="panel padded">
        <h2>Source documents captured with this run</h2>
        {run.result.input.documents.map((d) => (
          <p key={d.id}>
            <strong>
              {d.id} — {d.reference}
            </strong>{" "}
            · {d.status} · {d.date}
            <br />
            {d.notes}
          </p>
        ))}
      </section>
      <section className="panel padded">
        <h2>Event sequence and reconstructed states</h2>
        {run.result.timeline.map((t) => (
          <div key={t.event.id}>
            <h3>
              {t.event.id} · {t.event.effectiveDate}
            </h3>
            <p>{t.event.notes}</p>
            <pre>
              {JSON.stringify(
                {
                  before: t.before,
                  allocations: t.event.allocations,
                  after: t.after,
                },
                null,
                2,
              )}
            </pre>
          </div>
        ))}
      </section>
      <section className="panel padded">
        <h2>Review outcome</h2>
        <p>
          {review
            ? `${review.status} — ${review.note}`
            : "No review case recorded for this run."}
        </p>
        {data.audit
          .filter((a) => a.entity_id === review?.id)
          .map((a) => (
            <p key={a.id}>
              {String(a.created_at)} · {a.actor} · {a.action} — {a.reason}
            </p>
          ))}
      </section>
      <p>
        All records are fictional. Supplied evidence is not legal verification.
        Area equivalents do not establish surveyed boundaries or legal title.
        BhuMi does not approve mutations; consult an authorized land office.
      </p>
    </main>
  );
}
