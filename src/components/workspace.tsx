"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  LayoutDashboard,
  Layers3,
  GitBranch,
  ClipboardCheck,
  ArrowUpRight,
  ArrowRight,
  Search,
  ShieldCheck,
  LogOut,
  Landmark,
  FileText,
  Check,
  AlertTriangle,
  Plus,
  Play,
  Menu,
} from "lucide-react";
import type { Parcel, Result, State } from "@/lib/domain/reconciliation/types";
import type { Run, Review, Audit } from "@/lib/db";
import { area, fraction } from "@/lib/domain/reconciliation/fraction";
type Data = {
  parcels: Parcel[];
  runs: Run[];
  reviews: Review[];
  audit: Audit[];
  reviewer: boolean;
  authConfigured: boolean;
};
const label = (s: string) => s.toLowerCase().replaceAll("_", " ");
function Badge({ value }: { value: string }) {
  return (
    <span
      className={`badge ${value === "MATCH" || value === "RESOLVED" ? "green" : value === "CONFLICT" ? "red" : "amber"}`}
    >
      {label(value)}
    </span>
  );
}
function ShareBar({
  state,
  parties,
}: {
  state: State;
  parties: Record<string, string>;
}) {
  return (
    <div className="sharebar">
      {Object.entries(state).map(([id, share], i) => {
        const f = fraction(share);
        return (
          <div
            key={id}
            title={`${parties[id]}: ${share}`}
            style={{
              width: `${Math.max(0, (Number(f.n) / Number(f.d)) * 100)}%`,
              background: [
                "#153d50",
                "#148779",
                "#7bbdb0",
                "#df9a54",
                "#8494ad",
              ][i % 5],
            }}
          />
        );
      })}
    </div>
  );
}
export default function Workspace() {
  const [data, setData] = useState<Data>(),
    [error, setError] = useState(""),
    [message, setMessage] = useState(""),
    [busy, setBusy] = useState(false),
    [tab, setTab] = useState("Overview"),
    [selected, setSelected] = useState("DEMO-P4-001"),
    [query, setQuery] = useState(""),
    [password, setPassword] = useState(""),
    [login, setLogin] = useState(false),
    [editing, setEditing] = useState(false),
    [shares, setShares] = useState<Record<string, string>>({}),
    [note, setNote] = useState(""),
    [runId, setRunId] = useState(""),
    [snapshotId, setSnapshotId] = useState("");
  async function refresh() {
    const r = await fetch("/api/workspace");
    if (!r.ok) throw new Error("Could not load workspace");
    setData(await r.json());
  }
  useEffect(() => {
    let active = true;
    fetch("/api/workspace")
      .then((r) => {
        if (!r.ok) throw new Error("Could not load workspace");
        return r.json();
      })
      .then((body) => {
        if (active) setData(body);
      })
      .catch((e) => {
        if (active) setError(e.message);
      });
    return () => {
      active = false;
    };
  }, []);
  async function action(body: object) {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const r = await fetch("/api/workspace", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const result = await r.json();
      if (!r.ok) throw new Error(result.error);
      await refresh();
      setMessage("Saved to the record and audit history.");
      return result as { id?: string };
    } catch (e) {
      setError(e instanceof Error ? e.message : "Action failed");
    } finally {
      setBusy(false);
    }
  }
  async function signIn(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    try {
      const r = await fetch("/api/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const body = await r.json();
      if (!r.ok) throw new Error(body.error);
      setPassword("");
      setLogin(false);
      setError("");
      await refresh();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const p = data?.parcels.find((p) => p.id === selected),
    runs = data?.runs.filter((r) => r.parcel_id === selected) ?? [],
    run = runs.find((r) => r.id === runId) ?? runs[0],
    result = run?.result;
  function select(id: string) {
    setSelected(id);
    setTab("Reconciliation");
    setRunId("");
    setSnapshotId("");
    setEditing(false);
    setMessage("");
  }
  async function execute() {
    const r = await action({
      action: "run",
      parcelId: selected,
      ...(snapshotId ? { snapshotId } : {}),
    });
    if (r?.id) {
      setRunId(r.id);
      setTab("Reconciliation");
    }
  }
  const buttons = [
    "Overview",
    "Parcel explorer",
    "Reconciliation",
    "Review queue",
  ];
  const icons = [LayoutDashboard, Layers3, GitBranch, ClipboardCheck];
  return (
    <div className="shell">
      <aside className="sidebar">
        <Link className="brand" href="/">
          <span className="brand-icon">
            <Layers3 size={26} />
          </span>
          <span>
            BhuMi<small>RECORDS. RECONCILED.</small>
          </span>
        </Link>
        <div className="workspace-label">REVIEWER WORKSPACE</div>
        <nav>
          {buttons.map((b, i) => {
            const Icon = icons[i];
            return (
              <button
                key={b}
                className={tab === b ? "active" : ""}
                onClick={() => setTab(b)}
              >
                <Icon size={19} />
                {b}
                {b === "Review queue" && (
                  <span className="nav-count">
                    {data?.reviews.filter((r) => r.status !== "RESOLVED")
                      .length ?? 0}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        <div className="side-bottom">
          <div className="demo-label">
            <span />
            SYNTHETIC DATA ONLY
          </div>
          <p>
            Built for clearer records.
            <br />
            Designed for human review.
          </p>
          <div className="profile">
            <div className="avatar">{data?.reviewer ? "RO" : "PV"}</div>
            <div>
              <strong>
                {data?.reviewer ? "Review officer" : "Public visitor"}
              </strong>
              <small>
                {data?.reviewer
                  ? "Simulated reviewer"
                  : "Read-only demonstration"}
              </small>
            </div>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span>
            <Menu size={17} /> Workspace <span className="slash">/</span>{" "}
            <strong>{tab}</strong>
          </span>
          <div className="top-actions">
            <span className="prototype">P4 · Prototype</span>
            {data?.reviewer ? (
              <button
                className="text-button"
                onClick={async () => {
                  await fetch("/api/session", { method: "DELETE" });
                  await refresh();
                }}
              >
                <LogOut size={16} /> Sign out
              </button>
            ) : (
              <button className="text-button" onClick={() => setLogin(!login)}>
                Reviewer sign in <ArrowUpRight size={16} />
              </button>
            )}
          </div>
        </header>
        <main>
          <div className="eyebrow">
            <span /> LAND OWNERSHIP RECONCILIATION
          </div>
          <div className="heading-row">
            <div>
              <h1>
                {tab === "Overview"
                  ? "Ownership Reconciliation Dashboard"
                  : tab === "Parcel explorer"
                    ? "Every parcel has a story."
                    : tab === "Review queue"
                      ? "A clear path to resolution."
                      : "Follow the share. Find the difference."}
              </h1>
              <p className="subtitle">
                {tab === "Overview"
                  ? "A consistent record starts with checking who owns what."
                  : tab === "Review queue"
                    ? "Review the evidence. Record the decision. Preserve the history."
                    : "Reconstruct documented interests, then compare the mutation owner by owner."}
              </p>
            </div>
            <span className="synthetic-tag">
              <ShieldCheck size={16} /> Fictional records
            </span>
          </div>
          {error && (
            <div role="alert" className="notice error">
              {error}
            </div>
          )}
          {message && (
            <div role="status" className="notice">
              {message}
            </div>
          )}
          {login && (
            <form className="panel login-form" onSubmit={signIn}>
              <div>
                <h3>Simulated reviewer access</h3>
                <p>
                  {data?.authConfigured
                    ? "Enter the password configured by your demo administrator."
                    : "Reviewer access is not configured. Follow the README local setup instructions."}
                </p>
              </div>
              <label>
                Password
                <input
                  aria-label="Reviewer password"
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </label>
              <button className="primary" disabled={busy}>
                Sign in
              </button>
            </form>
          )}
          {!data ? (
            <div className="panel">Loading the record workspace…</div>
          ) : (
            <>
              {tab === "Overview" && (
                <>
                  <div className="stats">
                    {[
                      [
                        data.parcels.length,
                        "Fictional parcels",
                        "Structured demo records",
                      ],
                      [
                        data.runs.length,
                        "Reconciliation runs",
                        "Saved, reproducible results",
                      ],
                      [
                        data.runs.filter((r) => r.result.status === "CONFLICT")
                          .length,
                        "Runs with discrepancies",
                        "Owner-level differences",
                      ],
                      [
                        data.reviews.filter((r) => r.status !== "RESOLVED")
                          .length,
                        "Open review cases",
                        "Awaiting a human decision",
                      ],
                    ].map(([number, title, sub]) => (
                      <div className="stat" key={title}>
                        <span>{title}</span>
                        <strong>
                          {number}
                          <span className="stat-icon">
                            <ArrowUpRight size={20} />
                          </span>
                        </strong>
                        <small>{sub}</small>
                      </div>
                    ))}
                  </div>
                  <div className="feature">
                    <div>
                      <div className="feature-kicker">
                        THE SIGNATURE SCENARIO <span>DEMO-P4-001</span>
                      </div>
                      <h2>
                        The total is right.
                        <br />
                        The ownership isn’t.
                      </h2>
                      <p>
                        A registered sale transfers 30 decimals equivalent.
                        <br />
                        The mutation quietly takes 15 from an uninvolved
                        co-owner.
                      </p>
                      <button
                        className="light-button"
                        onClick={() => select("DEMO-P4-001")}
                      >
                        Explore the discrepancy <ArrowRight size={17} />
                      </button>
                    </div>
                    <div className="feature-visual">
                      <div className="visual-title">
                        SAME TOTAL. DIFFERENT OWNERS.
                      </div>
                      <div className="mini-row">
                        <span>Expected</span>
                        <strong>
                          120 <small>decimals</small>
                        </strong>
                      </div>
                      <ShareBar
                        state={{ A: "1/4", B: "1/3", C: "1/6", D: "1/4" }}
                        parties={{}}
                      />
                      <div className="mini-row">
                        <span>Mutation</span>
                        <strong>
                          120 <small>decimals</small>
                        </strong>
                      </div>
                      <ShareBar
                        state={{ A: "1/4", B: "5/24", C: "1/6", D: "3/8" }}
                        parties={{}}
                      />
                      <div className="visual-note">
                        <AlertTriangle size={17} /> Owner B −15 <span>→</span>{" "}
                        Buyer D +15
                      </div>
                      <small>
                        Illustrative seeded input · run the engine to verify
                      </small>
                    </div>
                  </div>
                  <div className="section-title">
                    <div>
                      <h2>Explore the supplied records</h2>
                      <p>
                        Eleven scenarios. Exact calculations. Traceable
                        evidence.
                      </p>
                    </div>
                    <button
                      className="text-button"
                      onClick={() => setTab("Parcel explorer")}
                    >
                      View all parcels <ArrowRight size={16} />
                    </button>
                  </div>
                  <div className="scenario-grid">
                    {data.parcels.slice(0, 3).map((parcel, i) => (
                      <button
                        className="scenario-card"
                        key={parcel.id}
                        onClick={() => select(parcel.id)}
                      >
                        <span className="scenario-number">
                          0{i + 1}
                          <ArrowUpRight size={20} />
                        </span>
                        <small>{parcel.id}</small>
                        <h3>{parcel.title}</h3>
                        <p>
                          {parcel.area} decimals · {parcel.events.length}{" "}
                          documented event
                        </p>
                        <span className="card-link">
                          Open parcel <ArrowRight size={15} />
                        </span>
                      </button>
                    ))}
                  </div>
                  <div className="section-title">
                    <h2>Recent documented events</h2>
                    <span className="muted">Synthetic source records</span>
                  </div>
                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Source event</th>
                          <th>Parcel</th>
                          <th>Transaction</th>
                          <th>Effective date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.parcels.slice(0, 4).map((parcel) => (
                          <tr key={parcel.id}>
                            <td>
                              <strong>{parcel.events[0].id}</strong>
                            </td>
                            <td>
                              <button
                                className="link"
                                onClick={() => select(parcel.id)}
                              >
                                {parcel.id}
                              </button>
                            </td>
                            <td>{label(parcel.events[0].type)}</td>
                            <td>{parcel.events[0].effectiveDate}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </>
              )}
              {tab === "Parcel explorer" && (
                <>
                  <label className="search">
                    <Search size={18} />
                    <input
                      placeholder="Search parcel reference, title, mouza…"
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                    />
                  </label>
                  <div className="scenario-grid">
                    {data.parcels
                      .filter((p) =>
                        `${p.id} ${p.title} ${p.mouza}`
                          .toLowerCase()
                          .includes(query.toLowerCase()),
                      )
                      .map((parcel) => (
                        <button
                          className="scenario-card"
                          key={parcel.id}
                          onClick={() => select(parcel.id)}
                        >
                          <span className="scenario-number">
                            <Landmark size={23} />
                            <ArrowUpRight size={20} />
                          </span>
                          <small>{parcel.id}</small>
                          <h3>{parcel.title}</h3>
                          <p>
                            {parcel.area} decimals · {parcel.survey}
                          </p>
                          <span className="card-link">
                            Inspect the record <ArrowRight size={15} />
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}
              {tab === "Reconciliation" && p && (
                <>
                  <div className="toolbar">
                    <label>
                      Selected parcel
                      <select
                        value={selected}
                        onChange={(e) => select(e.target.value)}
                      >
                        {data.parcels.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.id} · {p.title}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="primary"
                      onClick={execute}
                      disabled={busy || !data.reviewer}
                    >
                      <Play size={16} /> Run reconciliation
                    </button>
                  </div>
                  {!data.reviewer && (
                    <p className="muted">
                      Public demonstration is read-only. Sign in as a simulated
                      reviewer to run calculations or record decisions.
                    </p>
                  )}
                  <div className="parcel-meta panel">
                    <div>
                      <small>PARCEL</small>
                      <h3>{p.id}</h3>
                      <p>{p.title}</p>
                    </div>
                    <div>
                      <small>RECORDED AREA</small>
                      <h3>
                        {p.area} <span>decimals</span>
                      </h3>
                      <p>Undivided interest equivalents</p>
                    </div>
                    <div>
                      <small>SOURCE GEOGRAPHY</small>
                      <h3>{p.mouza}</h3>
                      <p>
                        {p.khatian} / {p.dag} · {p.survey}
                      </p>
                    </div>
                  </div>
                  <div className="two-col">
                    <section className="panel padded">
                      <div className="panel-heading">
                        <h3>
                          01 <span>Starting ownership</span>
                        </h3>
                        <Badge value="SUPPLIED" />
                      </div>
                      <ShareBar
                        state={Object.fromEntries(
                          p.baseline.map((h) => [h.party, h.share]),
                        )}
                        parties={p.parties}
                      />
                      {p.baseline.map((h) => (
                        <div className="holding" key={h.party}>
                          <span>{p.parties[h.party]}</span>
                          <strong>
                            {h.share}{" "}
                            <small>· {area(h.share, p.area)} decimals</small>
                          </strong>
                        </div>
                      ))}
                      <p className="muted">
                        {p.baselineDate} · Source: {p.baselineDocument}
                      </p>
                    </section>
                    <section className="panel padded">
                      <div className="panel-heading">
                        <h3>
                          02 <span>Documented events</span>
                        </h3>
                        <GitBranch size={18} />
                      </div>
                      {p.events.map((e) => (
                        <details className="event" key={e.id}>
                          <summary>
                            <span className="event-dot" />
                            <strong>
                              {label(e.type)} · {e.id}
                            </strong>
                            <small>{e.effectiveDate}</small>
                          </summary>
                          <p>{e.notes}</p>
                          {e.allocations.map((a, i) => (
                            <p key={i}>
                              {p.parties[a.from]} → {p.parties[a.to]}:{" "}
                              <strong>{a.share}</strong> (
                              {area(a.share, p.area)} decimals equivalent)
                            </p>
                          ))}
                          <p>
                            Source:{" "}
                            <a href={`#doc-${e.documentId}`}>{e.documentId}</a>{" "}
                            · Entered: {e.recordedAt}
                          </p>
                          {result?.timeline.find(
                            (t) => t.event.id === e.id,
                          ) && (
                            <div className="before-after">
                              <pre>
                                Before:{" "}
                                {JSON.stringify(
                                  result.timeline.find(
                                    (t) => t.event.id === e.id,
                                  )?.before,
                                  null,
                                  2,
                                )}
                              </pre>
                              <pre>
                                After:{" "}
                                {JSON.stringify(
                                  result.timeline.find(
                                    (t) => t.event.id === e.id,
                                  )?.after,
                                  null,
                                  2,
                                )}
                              </pre>
                            </div>
                          )}
                        </details>
                      ))}
                    </section>
                  </div>
                  <div className="panel padded snapshot-picker">
                    <label>
                      Mutation snapshot
                      <select
                        value={snapshotId || p.snapshots.at(-1)?.id || ""}
                        onChange={(e) => setSnapshotId(e.target.value)}
                      >
                        {!p.snapshots.length && (
                          <option value="">No mutation supplied</option>
                        )}
                        {p.snapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.reference} · {s.effectiveDate}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="secondary"
                      disabled={!data.reviewer}
                      onClick={() => {
                        setEditing(!editing);
                        setShares(
                          Object.fromEntries(
                            (p.snapshots.at(-1)?.holdings ?? p.baseline).map(
                              (h) => [h.party, h.share],
                            ),
                          ),
                        );
                        setNote("");
                      }}
                    >
                      <Plus size={16} /> Append revised snapshot
                    </button>
                  </div>
                  {p.snapshots.length > 0 &&
                    (() => {
                      const snapshot =
                        p.snapshots.find((s) => s.id === snapshotId) ??
                        p.snapshots.at(-1)!;
                      return (
                        <details
                          className="panel padded"
                          style={{ marginBottom: 20 }}
                        >
                          <summary>
                            Inspect supplied mutation · {snapshot.reference}
                          </summary>
                          <p>
                            Source: {snapshot.documentId} · Effective:{" "}
                            {snapshot.effectiveDate} · Events:{" "}
                            {snapshot.eventIds.join(", ")}
                          </p>
                          <div className="table-wrap">
                            <table>
                              <thead>
                                <tr>
                                  <th>Party</th>
                                  <th>Recorded share</th>
                                  <th>Decimals equivalent</th>
                                </tr>
                              </thead>
                              <tbody>
                                {snapshot.holdings.map((h) => (
                                  <tr key={h.party}>
                                    <td>{p.parties[h.party]}</td>
                                    <td>{h.share}</td>
                                    <td>{area(h.share, p.area)}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </details>
                      );
                    })()}
                  {editing && (
                    <form
                      className="panel padded"
                      onSubmit={async (e) => {
                        e.preventDefault();
                        const r = await action({
                          action: "snapshot",
                          parcelId: p.id,
                          holdings: Object.entries(shares).map(
                            ([party, share]) => ({ party, share }),
                          ),
                          note,
                        });
                        if (r?.id) {
                          setSnapshotId(r.id);
                          setEditing(false);
                        }
                      }}
                    >
                      <h3>Record a new synthetic mutation snapshot</h3>
                      <p>
                        Enter fractions of the whole parcel. Earlier snapshots
                        and findings remain unchanged.
                      </p>
                      <div className="form-grid">
                        {Object.entries(p.parties).map(([id, name]) => (
                          <label key={id}>
                            {name}
                            <input
                              aria-label={`${name} share`}
                              value={shares[id] ?? "0"}
                              onChange={(e) =>
                                setShares({ ...shares, [id]: e.target.value })
                              }
                              required
                            />
                          </label>
                        ))}
                      </div>
                      <label>
                        Evidence / reason
                        <textarea
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          minLength={5}
                          required
                        />
                      </label>
                      <button className="primary" disabled={busy}>
                        Save new snapshot
                      </button>
                    </form>
                  )}
                  {runs.length > 0 && (
                    <label className="run-picker">
                      Historical run
                      <select
                        value={run?.id ?? ""}
                        onChange={(e) => setRunId(e.target.value)}
                      >
                        {runs.map((r) => (
                          <option key={r.id} value={r.id}>
                            {new Date(r.created_at).toLocaleString()} ·{" "}
                            {r.result.status} · {r.id.slice(0, 8)}
                          </option>
                        ))}
                      </select>
                    </label>
                  )}
                  {result && run ? (
                    <>
                      <ResultView result={result} />
                      <div className="report-actions">
                        <a
                          className="secondary"
                          href={`/report/${run.id}`}
                          target="_blank"
                        >
                          <FileText size={16} /> Printable evidence report
                        </a>
                        <button
                          className="primary"
                          disabled={
                            busy ||
                            !data.reviewer ||
                            !result.findings.length ||
                            data.reviews.some((r) => r.run_id === run.id)
                          }
                          onClick={() =>
                            action({
                              action: "createReview",
                              runId: run.id,
                              note: "Review the source-linked ownership discrepancies.",
                            })
                          }
                        >
                          <ClipboardCheck size={17} />
                          {data.reviews.some((r) => r.run_id === run.id)
                            ? "Review case created"
                            : "Create review case"}
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="empty panel">
                      <GitBranch size={32} />
                      <h3>Ready to compare the records</h3>
                      <p>
                        Run reconciliation to calculate expected interests and
                        inspect exact differences.
                      </p>
                    </div>
                  )}
                  <div className="section-title">
                    <h2>Source evidence</h2>
                    <span className="muted">
                      Supplied does not mean legally verified
                    </span>
                  </div>
                  <div className="scenario-grid">
                    {p.documents.map((doc) => (
                      <section
                        className="panel padded"
                        key={doc.id}
                        id={`doc-${doc.id}`}
                      >
                        <FileText size={20} />
                        <h3>{doc.reference}</h3>
                        <Badge value={doc.status} />
                        <p>{doc.notes}</p>
                        <small>
                          {doc.date} · {doc.type}
                        </small>
                      </section>
                    ))}
                  </div>
                </>
              )}
              {tab === "Review queue" && (
                <>
                  {data.reviews.length === 0 ? (
                    <div className="empty panel">
                      <ClipboardCheck size={32} />
                      <h3>No review cases yet</h3>
                      <p>
                        Run reconciliation on a parcel, then create a review
                        case from its findings.
                      </p>
                      <button
                        className="primary"
                        onClick={() => select("DEMO-P4-001")}
                      >
                        Open signature scenario <ArrowRight size={16} />
                      </button>
                    </div>
                  ) : (
                    data.reviews.map((review) => (
                      <ReviewCard
                        key={review.id}
                        review={review}
                        run={data.runs.find((r) => r.id === review.run_id)!}
                        enabled={data.reviewer && !busy}
                        onSave={(status, note) =>
                          action({
                            action: "review",
                            id: review.id,
                            status,
                            note,
                          })
                        }
                        onOpen={() =>
                          select(
                            data.runs.find((r) => r.id === review.run_id)!
                              .parcel_id,
                          )
                        }
                      />
                    ))
                  )}
                  <div className="section-title">
                    <h2>Audit trail</h2>
                    <span className="muted">
                      Original findings remain in run history
                    </span>
                  </div>
                  <div className="panel table-wrap">
                    <table>
                      <thead>
                        <tr>
                          <th>Action</th>
                          <th>Actor</th>
                          <th>Reason</th>
                          <th>Recorded</th>
                        </tr>
                      </thead>
                      <tbody>
                        {data.audit.map((a) => (
                          <tr key={a.id}>
                            <td>{label(a.action)}</td>
                            <td>{a.actor}</td>
                            <td>{a.reason}</td>
                            <td>{new Date(a.created_at).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!data.audit.length && (
                      <p className="padded muted">No actions recorded yet.</p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
          <footer>
            <span>
              <Layers3 size={15} /> BhuMi · LandTech 2026
            </span>
            <p>
              Synthetic demonstration · Recorded interests are not legal title
              or surveyed boundaries. Consult an authorized land office.
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
export function ResultView({ result: r }: { result: Result }) {
  const p = r.input;
  return (
    <section className="panel results">
      <div className="result-header">
        <div>
          <div className="eyebrow">03 / RECONCILIATION RESULT</div>
          <h2>
            {r.status === "MATCH"
              ? "The supplied ownership records reconcile."
              : r.status === "CONFLICT"
                ? "The records tell different ownership stories."
                : "More evidence or interpretation is needed."}
          </h2>
          <p>
            Evidence: {label(r.evidenceStatus)} · Rules {r.rulesVersion}
            <br />
            Snapshot:{" "}
            {r.input.snapshots.find((s) => s.id === r.snapshotId)?.reference ??
              "None supplied"}
          </p>
        </div>
        <Badge value={r.status} />
      </div>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>Recorded party</th>
              <th>Expected share</th>
              <th>Mutation share</th>
              <th>Expected area*</th>
              <th>Mutation area*</th>
              <th>Difference*</th>
            </tr>
          </thead>
          <tbody>
            {Array.from(
              new Set([...Object.keys(r.expected), ...Object.keys(r.observed)]),
            ).map((party) => {
              const ex = r.expected[party] ?? "0",
                actual = r.observed[party] ?? "0",
                diff = fraction(actual).sub(fraction(ex)).toString();
              return (
                <tr className={diff === "0" ? "" : "different"} key={party}>
                  <td>
                    <strong>{p.parties[party] ?? party}</strong>
                  </td>
                  <td>{ex}</td>
                  <td>{actual}</td>
                  <td>{area(ex, p.area)}</td>
                  <td>{area(actual, p.area)}</td>
                  <td>
                    {diff === "0" ? (
                      <span className="match">
                        <Check size={14} /> Match
                      </span>
                    ) : (
                      <strong className="difference">
                        {fraction(diff).n > 0n ? "+" : ""}
                        {area(diff, p.area)}
                      </strong>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr className="total">
              <td>Total</td>
              <td>{r.expectedTotal}</td>
              <td>{r.observedTotal}</td>
              <td>{area(r.expectedTotal, p.area)}</td>
              <td>{area(r.observedTotal, p.area)}</td>
              <td>
                {r.expectedTotal === r.observedTotal
                  ? "Totals balance"
                  : "Totals differ"}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      <p className="table-note">
        * Decimals equivalent of undivided interests, not physical boundaries.{" "}
        {r.status === "INSUFFICIENT_EVIDENCE" || r.status === "REVIEW_REQUIRED"
          ? "Replay may be partial; do not interpret this table as a final expected allocation."
          : "Equal totals alone do not establish correct ownership allocation."}
      </p>
      {r.findings.map((f, i) => (
        <div className="finding" key={i}>
          <AlertTriangle size={20} />
          <div>
            <h3>{f.code}</h3>
            <p>
              {f.party && f.difference
                ? `${p.parties[f.party]} has ${area(f.actual ?? "0", p.area)} decimals equivalent in mutation; the documented history supports ${area(f.expected ?? "0", p.area)}. Exact difference: ${area(f.difference, p.area)} decimals equivalent.`
                : f.explanation}
            </p>
            <small>
              Events: {f.eventIds.join(", ") || "Baseline"} · Sources:{" "}
              {f.documentIds.join(", ")}
            </small>
            <p className="recommendation">Review step: {f.recommendation}</p>
          </div>
        </div>
      ))}
    </section>
  );
}
function ReviewCard({
  review,
  run,
  enabled,
  onSave,
  onOpen,
}: {
  review: Review;
  run: Run;
  enabled: boolean;
  onSave: (status: string, note: string) => Promise<unknown>;
  onOpen: () => void;
}) {
  const transitions: Record<string, string[]> = {
    NEW: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["NEEDS_EVIDENCE", "RESOLVED", "ESCALATED"],
    NEEDS_EVIDENCE: ["UNDER_REVIEW", "ESCALATED"],
    RESOLVED: ["UNDER_REVIEW"],
    ESCALATED: ["UNDER_REVIEW"],
  };
  const [status, setStatus] = useState(transitions[review.status][0]),
    [note, setNote] = useState("");
  return (
    <section className="panel padded review-card">
      <div className="panel-heading">
        <div>
          <button className="link" onClick={onOpen}>
            {run.parcel_id}
          </button>
          <h3>{run.result.findings.length} source-linked findings</h3>
        </div>
        <Badge value={review.status} />
      </div>
      <p>{review.note}</p>
      <details>
        <summary>Inspect original findings</summary>
        {run.result.findings.map((f, i) => (
          <p key={i}>
            <strong>{f.code}</strong> — {f.explanation}
          </p>
        ))}
      </details>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await onSave(
            transitions[review.status].includes(status)
              ? status
              : transitions[review.status][0],
            note,
          );
          setNote("");
        }}
      >
        <label>
          Next action
          <select
            value={
              transitions[review.status].includes(status)
                ? status
                : transitions[review.status][0]
            }
            onChange={(e) => setStatus(e.target.value)}
          >
            {transitions[review.status].map((s) => (
              <option key={s} value={s}>
                {label(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Reviewer note
          <textarea
            aria-label="Reviewer note"
            required
            minLength={5}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Explain the evidence considered and the next step…"
          />
        </label>
        <button className="primary" disabled={!enabled}>
          Record review action
        </button>
      </form>
    </section>
  );
}
