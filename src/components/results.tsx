"use client";
import { Check, AlertTriangle, FileCheck2, ChevronDown } from "lucide-react";
import type { Result, Parcel, State } from "@/lib/domain/reconciliation/types";
import { fraction, area } from "@/lib/domain/reconciliation/fraction";
import { partyName } from "@/lib/i18n";
import { usePreferences } from "./preferences";
export function Badge({ value }: { value: string }) {
  const { t } = usePreferences();
  return (
    <span
      className={`badge ${value === "MATCH" || value === "RESOLVED" ? "good" : value === "CONFLICT" ? "conflict" : "attention"}`}
    >
      {t(value)}
    </span>
  );
}
export function Ownership({ state, parcel }: { state: State; parcel: Parcel }) {
  const { t, n, lang } = usePreferences();
  return (
    <>
      <div className="ownership-bar" aria-hidden="true">
        {Object.entries(state).map(([key, value], i) => {
          const f = fraction(value);
          return (
            <span
              key={key}
              style={{
                flex: Math.max(0, Number(f.n) / Number(f.d)),
                background: [
                  "#177c6d",
                  "#cc9c53",
                  "#708cbd",
                  "#ad7097",
                  "#8ea36e",
                ][i % 5],
              }}
            />
          );
        })}
      </div>
      <div className="owner-list">
        {Object.entries(state)
          .filter(([, v]) => v !== "0")
          .map(([key, value], i) => (
            <div key={key}>
              <span className={`owner-dot color-${i % 5}`} />
              <strong>{partyName(parcel.parties[key] ?? key, lang)}</strong>
              <div>
                <b>{n(area(value, parcel.area))}</b> <span>{t("decimal")}</span>
                <small>
                  {n(value)} {t("share")}
                </small>
              </div>
            </div>
          ))}
      </div>
    </>
  );
}
export function ResultView({ result: r }: { result: Result }) {
  const { t, n, lang } = usePreferences(),
    p = r.input;
  const reliable = r.status === "MATCH" || r.status === "CONFLICT";
  return (
    <section className="result" data-testid="result">
      <div className={`result-intro ${r.status === "MATCH" ? "success" : ""}`}>
        {r.status === "MATCH" ? (
          <FileCheck2 size={27} />
        ) : (
          <AlertTriangle size={27} />
        )}
        <div>
          <h2>{t(r.status)}</h2>
          <p>
            {t(
              r.evidenceStatus === "COMPLETE_SUPPLIED"
                ? "complete"
                : r.evidenceStatus === "UNVERIFIED"
                  ? "unverified"
                  : "incomplete",
            )}
          </p>
        </div>
      </div>
      <div className="comparison-scroll">
        <table>
          <thead>
            <tr>
              <th>{t("party")}</th>
              <th>
                {t("expected")}
                <small>{t("decimal")}</small>
              </th>
              <th>
                {t("actual")}
                <small>{t("decimal")}</small>
              </th>
              <th>{t("difference")}</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(
              new Set([...Object.keys(r.expected), ...Object.keys(r.observed)]),
            ).map((id) => {
              const ex = r.expected[id] ?? "0",
                actual = r.observed[id] ?? "0",
                diff = fraction(actual).sub(fraction(ex)).toString();
              return (
                <tr key={id} className={diff !== "0" ? "changed" : ""}>
                  <td>{partyName(p.parties[id] ?? id, lang)}</td>
                  <td>
                    {n(area(ex, p.area))}
                    <small>{n(ex)}</small>
                  </td>
                  <td>
                    {n(area(actual, p.area))}
                    <small>{n(actual)}</small>
                  </td>
                  <td>
                    {diff === "0" ? (
                      <span className="matching">
                        <Check size={16} />
                        {t("match")}
                      </span>
                    ) : (
                      <strong className="delta">
                        {fraction(diff).n > 0n ? "+" : ""}
                        {n(area(diff, p.area))}
                      </strong>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="total-row">
              <td>{t("total")}</td>
              <td>{n(area(r.expectedTotal, p.area))}</td>
              <td>{n(area(r.observedTotal, p.area))}</td>
              <td>{r.expectedTotal === r.observedTotal ? "=" : "≠"}</td>
            </tr>
          </tbody>
        </table>
      </div>
      {!reliable && (
        <p className="notice warning">
          {t("REVIEW_REQUIRED")} {t("EVIDENCE_INCOMPLETE")}
        </p>
      )}
      <div className="findings">
        {r.findings.map((f, i) => (
          <article key={i}>
            <div className="finding-marker">{n(i + 1)}</div>
            <div>
              <h3>
                {f.party && f.difference
                  ? `${partyName(p.parties[f.party] ?? f.party, lang)}: ${n(area(f.difference, p.area))} ${t("decimal")}`
                  : t(f.code)}
              </h3>
              <p>{t(f.code)}</p>
              <details>
                <summary>
                  {t("details")} <ChevronDown size={14} />
                </summary>
                <dl>
                  <dt>{t("source")}</dt>
                  <dd>{f.documentIds.join(" · ")}</dd>
                  <dt>{t("events")}</dt>
                  <dd>{f.eventIds.join(" · ") || p.baselineDocument}</dd>
                  <dt>{t("rules")}</dt>
                  <dd>
                    {f.code} · {r.rulesVersion}
                  </dd>
                </dl>
              </details>
            </div>
          </article>
        ))}
      </div>
      {r.findings.length > 0 && (
        <div className="review-advice">
          <strong>{t("recommendation")}</strong>
          <p>{t("reviewAdvice")}</p>
        </div>
      )}
      <p className="legal-note">{t("noLegal")}</p>
    </section>
  );
}
