"use client";
import { Brand, PreferenceControls } from "./workspace";
import { ResultView, Badge } from "./results";
import { usePreferences } from "./preferences";
import { partyName } from "@/lib/i18n";
import type { Run, Review, Audit } from "@/lib/db";
export default function Report({
  run,
  review,
  audit,
}: {
  run: Run;
  review: Review | null;
  audit: Audit[];
}) {
  const { t, n, lang } = usePreferences();
  return (
    <main className="print-page">
      <div className="print-top">
        <Brand />
        <PreferenceControls />
      </div>
      <div className="eyebrow">{run.parcel_id}</div>
      <h1>{t("reportTitle")}</h1>
      <p>{t("reportNotice")}</p>
      <p>
        {new Date(run.created_at).toLocaleString(
          lang === "bn" ? "bn-BD" : "en-GB",
        )}{" "}
        · {run.id}
      </p>
      <button
        className="button no-print"
        style={{ marginTop: 20 }}
        onClick={() => window.print()}
      >
        {t("print")}
      </button>
      <ResultView result={run.result} />
      <section className="panel">
        <h2>{t("documents")}</h2>
        <p>{t("recordText")}</p>
        {run.result.input.documents.map((d) => (
          <div key={d.id} className="note-entry">
            <strong>{d.reference}</strong> <Badge value={d.status} />
            <p>{d.notes}</p>
            <small>
              {n(d.date)} · {d.id}
            </small>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>{t("events")}</h2>
        {run.result.timeline.map((entry) => (
          <div key={entry.event.id} className="note-entry">
            <h3>
              {t(entry.event.type)} · {entry.event.id}
            </h3>
            <small>
              {n(entry.event.effectiveDate)} · {entry.event.documentId}
            </small>
            <div className="comparison-scroll">
              <table>
                <thead>
                  <tr>
                    <th>{t("party")}</th>
                    <th>{t("before")}</th>
                    <th>{t("after")}</th>
                  </tr>
                </thead>
                <tbody>
                  {Array.from(
                    new Set([
                      ...Object.keys(entry.before),
                      ...Object.keys(entry.after),
                    ]),
                  ).map((id) => (
                    <tr key={id}>
                      <td>
                        {partyName(run.result.input.parties[id] ?? id, lang)}
                      </td>
                      <td>{n(entry.before[id] ?? "0")}</td>
                      <td>{n(entry.after[id] ?? "0")}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </section>
      <section className="panel">
        <h2>{t("reviews")}</h2>
        {review ? (
          <>
            <Badge value={review.status} />
            <p>{review.note}</p>
          </>
        ) : (
          <p>{t("noReview")}</p>
        )}
        {audit.map((a) => (
          <div className="note-entry" key={a.id}>
            <strong>{t(a.action)}</strong>
            <p>{a.reason}</p>
            <small>
              {a.actor} ·{" "}
              {new Date(a.created_at).toLocaleString(
                lang === "bn" ? "bn-BD" : "en-GB",
              )}
            </small>
          </div>
        ))}
      </section>
      <p>{t("noLegal")}</p>
    </main>
  );
}
