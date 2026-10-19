"use client";
import { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import { DEMO_ACCOUNT } from "@/lib/demo-account";
import {
  ArrowRight,
  ArrowUpRight,
  ArrowLeft,
  Layers3,
  Sun,
  Moon,
  Globe2,
  ShieldCheck,
  GitBranch,
  FileText,
  Check,
  LockKeyhole,
  Users,
  Leaf,
  Scale,
  Menu,
  RefreshCw,
  LogOut,
  Plus,
  Printer,
  ChevronRight,
} from "lucide-react";
import { usePreferences } from "./preferences";
import { ResultView, Ownership, Badge } from "./results";
import { scenarios } from "@/lib/domain/reconciliation/scenarios";
import { reconcileMutation } from "@/lib/domain/reconciliation/engine";
import { area } from "@/lib/domain/reconciliation/fraction";
import { partyName, parcelTitle, asciiDigits } from "@/lib/i18n";
import type { Parcel } from "@/lib/domain/reconciliation/types";
import type { User } from "@/lib/auth";
import type { Run, Review, Audit } from "@/lib/db";
type Listing = { id: string; title: string; area: string };
type SummaryRun = { id: string; status: string; created_at: string };
type Data = {
  user: User;
  parcels: Listing[];
  total: number;
  parcel: Parcel | null;
  runs: SummaryRun[];
  reviews: (Review & { parcel_id: string; outcome: string })[];
  audit: Audit[];
};
export async function api<T>(
  url: string,
  body?: unknown,
  method?: string,
): Promise<T> {
  const response = await fetch(url, {
    method: method ?? (body ? "POST" : "GET"),
    cache: "no-store",
    headers: body ? { "Content-Type": "application/json" } : undefined,
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(45000),
  }).catch(() => {
    throw new Error("SERVICE_UNAVAILABLE");
  });
  const data = await response
    .json()
    .catch(() => ({ error: "SERVICE_UNAVAILABLE" }));
  if (!response.ok) throw new Error(data.error ?? "SERVICE_UNAVAILABLE");
  return data as T;
}
export function Brand() {
  const { lang, t } = usePreferences();
  return (
    <span className="brand">
      <span className="brand-symbol">
        <Layers3 size={27} />
      </span>
      <span>
        <b>{lang === "bn" ? "ভূমি" : "BhuMi"}</b>
        <small>{t("brandTag")}</small>
      </span>
    </span>
  );
}
export function PreferenceControls() {
  const { lang, t, setLang, toggleTheme, theme } = usePreferences();
  return (
    <div className="preferences">
      <button
        className="language"
        onClick={() => setLang(lang === "en" ? "bn" : "en")}
        aria-label={lang === "en" ? "বাংলা" : "English"}
      >
        <Globe2 size={15} />
        {lang === "en" ? "বাংলা" : "English"}
      </button>
      <button
        className="icon-button"
        aria-label={t("theme")}
        title={t("theme")}
        onClick={toggleTheme}
      >
        {theme === "dark" ? <Sun size={19} /> : <Moon size={19} />}
      </button>
    </div>
  );
}
export default function Workspace({
  initialView = "home",
}: {
  initialView?: string;
}) {
  const { t, n } = usePreferences();
  const [view, setView] = useState(initialView),
    [user, setUser] = useState<User | null>(null),
    [menu, setMenu] = useState(false);
  const go = (next: string) => {
    setView(next);
    setMenu(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  return (
    <div className="site">
      <header className="site-header">
        <button
          className="brand-button"
          onClick={() => go("home")}
          aria-label={t("home")}
        >
          <Brand />
        </button>
        <nav className={menu ? "open" : ""}>
          <button
            className={view === "home" ? "selected" : ""}
            onClick={() => go("home")}
          >
            {t("home")}
          </button>
          <button
            className={view === "demo" ? "selected" : ""}
            onClick={() => go("demo")}
          >
            {t("demo")}
          </button>
          <button
            className={view === "workspace" ? "selected" : ""}
            onClick={() => go("workspace")}
          >
            {t("workspace")}
          </button>
        </nav>
        <div className="header-tools">
          <PreferenceControls />
          <button
            className="button small header-login"
            onClick={() => go("workspace")}
          >
            {user ? user.display_name : t("signIn")}
            <ArrowUpRight size={15} />
          </button>
          <button
            className="icon-button mobile-menu"
            aria-label={t("menu")}
            onClick={() => setMenu(!menu)}
          >
            <Menu size={20} />
          </button>
        </div>
      </header>
      {view === "home" ? (
        <Home onDemo={() => go("demo")} onWork={() => go("workspace")} />
      ) : view === "demo" ? (
        <Demo onWork={() => go("workspace")} />
      ) : (
        <Reviewer onUser={setUser} />
      )}
      <footer className="site-footer">
        <div>
          <Brand />
          <p>{t("footer")}</p>
        </div>
        <div>
          <span>{t("prototype")}</span>
          <p>{t("privacy")}</p>
          <small>© {n(2026)} BhuMi · LandTech</small>
        </div>
      </footer>
    </div>
  );
}
function Home({ onDemo, onWork }: { onDemo: () => void; onWork: () => void }) {
  const { t, n, lang } = usePreferences();
  const p = scenarios()[10],
    r = reconcileMutation(p);
  return (
    <main className="public-main">
      <section className="hero">
        <div className="hero-copy">
          <div className="eyebrow">
            <span />
            {t("eyebrow")}
          </div>
          <h1>{t("hero")}</h1>
          <p>{t("heroText")}</p>
          <div className="button-row">
            <button className="button" onClick={onDemo}>
              {t("heroPrimary")}
              <ArrowRight size={18} />
            </button>
            <button className="button ghost" onClick={onWork}>
              {t("signIn")}
              <LockKeyhole size={16} />
            </button>
          </div>
          <div className="hero-assurance">
            <ShieldCheck size={16} />
            {t("synthetic")}
          </div>
        </div>
        <div className="hero-illustration">
          <div className="land-art" aria-hidden="true">
            <div className="plot plot-a">
              <Leaf size={28} />
              <span>{lang === "bn" ? "ক" : "A"}</span>
            </div>
            <div className="plot plot-b">
              <Leaf size={20} />
              <span>{lang === "bn" ? "খ" : "B"}</span>
            </div>
            <div className="plot plot-c">
              <Layers3 size={25} />
            </div>
            <div className="plot-road" />
          </div>
          <div className="floating-label">
            <span className="pulse" />
            {t("featureLabel")}
          </div>
          <div className="hero-record">
            <div className="mini-heading">
              <FileText size={18} />
              <span>DEMO-P4-011</span>
              <span className="tiny-tag">{t("synthetic")}</span>
            </div>
            <div className="mini-total">
              <span>{t("sameTotal")}</span>
              <b>
                {n(100)} <small>{t("decimal")}</small>
              </b>
            </div>
            <div className="mini-difference">
              <span>{partyName(p.parties.B, lang)}</span>
              <strong>−{n(area("1/10", p.area))}</strong>
              <span>{t("missing")}</span>
            </div>
            <div className="mini-difference">
              <span>{partyName(p.parties.D, lang)}</span>
              <strong>+{n(area("1/10", p.area))}</strong>
              <span>{t("extra")}</span>
            </div>
            <button onClick={onDemo}>
              {t("compare")}
              <ArrowRight size={17} />
            </button>
          </div>
          <div className="illustration-caption">
            {n(r.findings.length)} {t("differences")}
          </div>
        </div>
      </section>
      <section className="trust-strip">
        {[
          ["trust1", "trust1Text", Scale],
          ["trust2", "trust2Text", ShieldCheck],
          ["trust3", "trust3Text", GitBranch],
        ].map(([a, b, Icon]) => {
          const C = Icon as typeof Scale;
          return (
            <div key={String(a)}>
              <C size={24} />
              <div>
                <strong>{t(String(a))}</strong>
                <p>{t(String(b))}</p>
              </div>
            </div>
          );
        })}
      </section>
      <section className="how-section" id="how">
        <div className="section-heading">
          <div className="eyebrow">{t("how")}</div>
          <h2>{t("flowTitle")}</h2>
          <p>{t("flowText")}</p>
        </div>
        <div className="steps-grid">
          {[1, 2, 3, 4].map((i) => (
            <article key={i}>
              <span className="step-number">{n(`0${i}`)}</span>
              <h3>{t(`flow${i}`)}</h3>
              <p>{t(`flow${i}Text`)}</p>
              <ChevronRight className="step-arrow" size={20} />
            </article>
          ))}
        </div>
      </section>
      <section className="invitation">
        <div>
          <div className="eyebrow">{t("featureLabel")}</div>
          <h2>{t("featureTitle")}</h2>
          <p>{t("noLegal")}</p>
        </div>
        <button className="button cream" onClick={onDemo}>
          {t("demo")}
          <ArrowRight size={18} />
        </button>
      </section>
    </main>
  );
}
function Demo({ onWork }: { onWork: () => void }) {
  const { t, n, lang } = usePreferences();
  const [sample, setSample] = useState(0),
    [step, setStep] = useState(0),
    [corrected, setCorrected] = useState(false);
  const p = useMemo(() => {
    const p = scenarios()[sample];
    if (corrected) {
      const r = reconcileMutation(p);
      p.snapshots[0].holdings = Object.entries(r.expected).map(
        ([party, share]) => ({ party, share }),
      );
    }
    return p;
  }, [sample, corrected]);
  const result = reconcileMutation(p);
  return (
    <main className="demo-page">
      <div className="page-heading">
        <div className="eyebrow">{t("demoEyebrow")}</div>
        <h1>{t("demoTitle")}</h1>
        <p>{t("demoText")}</p>
      </div>
      <div className="demo-layout">
        <aside className="demo-sidebar">
          <label>
            {t("scenario")}
            <select
              value={sample}
              onChange={(e) => {
                setSample(Number(e.target.value));
                setStep(0);
                setCorrected(false);
              }}
            >
              <option value={0}>{t("scenario120")}</option>
              <option value={10}>{t("scenario100")}</option>
            </select>
          </label>
          <ol className="journey-steps">
            {[1, 2, 3, 4, 5].map((i) => (
              <li key={i}>
                <button
                  className={
                    step === i - 1 ? "current" : step > i - 1 ? "done" : ""
                  }
                  onClick={() => setStep(i - 1)}
                >
                  <span>{step > i - 1 ? <Check size={15} /> : n(i)}</span>
                  {t(`step${i}`)}
                </button>
              </li>
            ))}
          </ol>
          <div className="sidebar-tip">
            <ShieldCheck size={22} />
            <p>{t("noLegal")}</p>
          </div>
        </aside>
        <section className="demo-content">
          <div className="chapter-label">
            {n(step + 1)} / {n(5)} <span>{p.id}</span>
          </div>
          <h2>{t(`step${step + 1}`)}</h2>
          {step === 0 && (
            <>
              <p className="chapter-intro">
                {n(p.area)} {t("decimal")} · {t("original")}
              </p>
              <Ownership state={result.baseline} parcel={p} />
              <p className="source-note">
                {t("source")}: {p.baselineDocument}
              </p>
            </>
          )}
          {step === 1 && (
            <>
              <p className="chapter-intro">{t("saleText")}</p>
              <div className="transfer-card">
                <div>
                  <span>{partyName(p.parties.A, lang)}</span>
                  <b>{n(area(p.events[0].allocations[0].share, p.area))}</b>
                  <small>{t("decimal")}</small>
                </div>
                <ArrowRight size={34} />
                <div>
                  <span>{partyName(p.parties.D, lang)}</span>
                  <b>{n(p.events[0].allocations[0].share)}</b>
                  <small>{t("share")}</small>
                </div>
              </div>
              <p className="source-note">
                {p.events[0].id} · {p.events[0].documentId} ·{" "}
                {n(p.events[0].effectiveDate)}
              </p>
              <h3>{t("expected")}</h3>
              <Ownership state={result.expected} parcel={p} />
            </>
          )}
          {step === 2 && (
            <>
              <p className="chapter-intro">{t("mutationText")}</p>
              <Ownership state={result.observed} parcel={p} />
              <p className="source-note">
                {t("source")}: {p.snapshots[0].documentId}
              </p>
            </>
          )}
          {step >= 3 && (
            <>
              {step === 4 && (
                <>
                  <p className="chapter-intro">{t("correctText")}</p>
                  <button
                    className="button correction-button"
                    onClick={() => setCorrected(!corrected)}
                  >
                    {t(corrected ? "restore" : "correct")}
                    <RefreshCw size={16} />
                  </button>
                </>
              )}
              <ResultView result={result} />
            </>
          )}
          <div className="journey-actions">
            <button
              className="button ghost"
              disabled={step === 0}
              onClick={() => setStep(step - 1)}
            >
              <ArrowLeft size={16} />
              {t("back")}
            </button>
            {step < 4 ? (
              <button className="button" onClick={() => setStep(step + 1)}>
                {t("next")}
                <ArrowRight size={16} />
              </button>
            ) : (
              <button className="button" onClick={onWork}>
                {t("workspace")}
                <ArrowRight size={16} />
              </button>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
function Reviewer({ onUser }: { onUser: (user: User | null) => void }) {
  const { t, n, lang } = usePreferences();
  const [user, setUser] = useState<User | null>(null),
    [checking, setChecking] = useState(true),
    [demoAvailable, setDemoAvailable] = useState(false),
    [error, setError] = useState(""),
    [busy, setBusy] = useState(false),
    [data, setData] = useState<Data | null>(null),
    [tab, setTab] = useState("parcels"),
    [offset, setOffset] = useState(0),
    [selected, setSelected] = useState(""),
    [result, setResult] = useState<Run | null>(null),
    [snapshot, setSnapshot] = useState(""),
    [showEditor, setShowEditor] = useState(false),
    [saved, setSaved] = useState(false);
  useEffect(() => {
    let live = true;
    api<{ user: User | null; demoAvailable: boolean }>("/api/session")
      .then((d) => {
        if (live) {
          setUser(d.user);
          setDemoAvailable(d.demoAvailable);
          onUser(d.user);
          setChecking(false);
        }
      })
      .catch((e) => {
        if (live) {
          setError(e.message);
          setChecking(false);
        }
      });
    return () => {
      live = false;
    };
  }, [onUser]);
  const load = async (pid = selected, page = offset) => {
    const d = await api<Data>(
      `/api/workspace?offset=${page}${pid ? `&parcel=${encodeURIComponent(pid)}` : ""}`,
    );
    setData(d);
    return d;
  };
  useEffect(() => {
    if (!user) return;
    let live = true;
    api<Data>(
      `/api/workspace?offset=${offset}${selected ? `&parcel=${encodeURIComponent(selected)}` : ""}`,
    )
      .then((d) => {
        if (live) {
          setData(d);
          setError("");
        }
      })
      .catch((e) => {
        if (live) setError(e.message);
      });
    return () => {
      live = false;
    };
  }, [user, selected, offset]);
  async function act(body: unknown) {
    setBusy(true);
    setError("");
    setSaved(false);
    try {
      const answer = await api<{ id?: string }>("/api/workspace", body);
      await load();
      setSaved(true);
      return answer;
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  async function getResult(id: string) {
    setBusy(true);
    try {
      const d = await api<{ run: Run }>(`/api/workspace?run=${id}`);
      setResult(d.run);
      setError("");
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }
  const p = data?.parcel;
  return (
    <main className="reviewer-page">
      <div className="page-heading">
        <div className="eyebrow">
          <LockKeyhole size={13} />
          {t("workspace")}
        </div>
        <h1>{user ? `${t("workspace")}` : t("loginTitle")}</h1>
        <p>{t(user ? "recordText" : "loginText")}</p>
      </div>
      {error && (
        <div className="notice error" role="alert">
          <strong>{t("errorTitle")}</strong>
          <p>{t(error)}</p>
          <button
            className="text-button"
            onClick={() => {
              setError("");
              if (user) load().catch((e) => setError(e.message));
              else {
                setChecking(true);
                api<{ user: User | null; demoAvailable: boolean }>(
                  "/api/session",
                )
                  .then((d) => {
                    setUser(d.user);
                    onUser(d.user);
                  })
                  .catch((e) => setError(e.message))
                  .finally(() => setChecking(false));
              }
            }}
          >
            <RefreshCw size={14} />
            {t("retry")}
          </button>
        </div>
      )}
      {saved && (
        <div role="status" className="notice success">
          {t("saved")}
        </div>
      )}
      {checking ? (
        <Loading />
      ) : !user ? (
        <form
          className="login-card"
          onSubmit={async (e) => {
            e.preventDefault();
            const f = new FormData(e.currentTarget);
            setBusy(true);
            setError("");
            try {
              await api("/api/session", {
                email: f.get("email"),
                password: f.get("password"),
              });
              const d = await api<{ user: User }>("/api/session");
              setUser(d.user);
              onUser(d.user);
            } catch (e) {
              setError((e as Error).message);
            } finally {
              setBusy(false);
            }
          }}
        >
          <div className="login-icon">
            <LockKeyhole size={26} />
          </div>
          <h2>{t("signIn")}</h2>
          {demoAvailable && (
            <div className="notice">
              <strong>{t("judgeAccess")}</strong>
              <p>{t("judgeNotice")}</p>
              <p>
                {t("email")}: <code>{DEMO_ACCOUNT.email}</code>
                <br />
                {t("password")}: <code>{DEMO_ACCOUNT.password}</code>
              </p>
              <button
                type="button"
                className="button secondary"
                disabled={busy}
                onClick={(event) => {
                  const form = event.currentTarget.form!;
                  (form.elements.namedItem("email") as HTMLInputElement).value =
                    DEMO_ACCOUNT.email;
                  (
                    form.elements.namedItem("password") as HTMLInputElement
                  ).value = DEMO_ACCOUNT.password;
                  form.requestSubmit();
                }}
              >
                {t("judgeEnter")}
              </button>
            </div>
          )}
          <label>
            {t("email")}
            <input
              type="email"
              name="email"
              required
              maxLength={254}
              autoComplete="username"
            />
          </label>
          <label>
            {t("password")}
            <input
              type="password"
              name="password"
              required
              maxLength={128}
              autoComplete="current-password"
            />
          </label>
          <button className="button" disabled={busy}>
            {t("loginSubmit")}
            <ArrowRight size={17} />
          </button>
          <p>{t("loginHelp")}</p>
          <small>{t("loginLocal")}</small>
        </form>
      ) : (
        <>
          <div className="workspace-tabs">
            {[
              "parcels",
              "reviews",
              "audit",
              "profile",
              ...(user.role === "ADMIN" ? ["accounts"] : []),
            ].map((key) => (
              <button
                key={key}
                className={tab === key ? "active" : ""}
                onClick={() => {
                  setTab(key);
                  setSelected("");
                  setResult(null);
                  setOffset(0);
                  setSaved(false);
                }}
              >
                {t(key)}
              </button>
            ))}
            <button
              className="logout"
              onClick={async () => {
                try {
                  await api("/api/session", undefined, "DELETE");
                  setUser(null);
                  onUser(null);
                  setData(null);
                  setResult(null);
                } catch (e) {
                  setError((e as Error).message);
                }
              }}
            >
              <LogOut size={15} />
              {t("signOut")}
            </button>
          </div>
          {!data ? (
            <Loading />
          ) : tab === "parcels" ? (
            <>
              {!selected ? (
                <>
                  <div className="record-grid">
                    {data.parcels.map((parcel) => (
                      <button
                        className="record-card"
                        key={parcel.id}
                        onClick={() => {
                          setSelected(parcel.id);
                          setOffset(0);
                          setSnapshot("");
                          setResult(null);
                          setShowEditor(false);
                        }}
                      >
                        <span className="record-icon">
                          <Layers3 size={23} />
                          <ArrowUpRight size={19} />
                        </span>
                        <small>{parcel.id}</small>
                        <h3>{parcelTitle(parcel.id, parcel.title, lang)}</h3>
                        <p>
                          {n(parcel.area)} {t("decimal")}
                        </p>
                        <span className="record-link">
                          {t("open")}
                          <ArrowRight size={16} />
                        </span>
                      </button>
                    ))}
                  </div>
                  {!data.parcels.length && <Empty text={t("noParcels")} />}
                  <Pagination
                    offset={offset}
                    size={6}
                    next={offset + 6 < data.total}
                    onChange={setOffset}
                  />
                </>
              ) : !p || p.id !== selected ? (
                <Loading />
              ) : (
                <>
                  <button
                    className="text-button back-link"
                    onClick={() => {
                      setSelected("");
                      setResult(null);
                      setOffset(0);
                    }}
                  >
                    <ArrowLeft size={16} />
                    {t("parcels")}
                  </button>
                  <div className="parcel-title">
                    <div>
                      <small>{p.id}</small>
                      <h2>{parcelTitle(p.id, p.title, lang)}</h2>
                    </div>
                    <span>
                      {n(p.area)} {t("decimal")}
                    </span>
                  </div>
                  <div className="two-panels">
                    <section className="panel">
                      <h3>{t("original")}</h3>
                      <Ownership
                        state={Object.fromEntries(
                          p.baseline.map((h) => [h.party, h.share]),
                        )}
                        parcel={p}
                      />
                    </section>
                    <section className="panel">
                      <h3>{t("events")}</h3>
                      {p.events.map((e) => (
                        <details className="event-details" key={e.id}>
                          <summary>
                            <GitBranch size={16} />
                            {t(e.type)} <small>{e.id}</small>
                          </summary>
                          <p>
                            {n(e.effectiveDate)} · {e.documentId}
                          </p>
                          {e.allocations.map((a, i) => (
                            <p key={i}>
                              {partyName(p.parties[a.from], lang)} →{" "}
                              {partyName(p.parties[a.to], lang)}{" "}
                              <b>{n(a.share)}</b> ({n(area(a.share, p.area))}{" "}
                              {t("decimal")})
                            </p>
                          ))}
                        </details>
                      ))}
                    </section>
                  </div>
                  <div className="panel control-panel">
                    <label>
                      {t("snapshots")}
                      <select
                        value={snapshot || p.snapshots.at(-1)?.id || ""}
                        onChange={(e) => setSnapshot(e.target.value)}
                      >
                        {!p.snapshots.length && (
                          <option value="">
                            {t("EXPECTED_MUTATION_MISSING")}
                          </option>
                        )}
                        {p.snapshots.map((s) => (
                          <option key={s.id} value={s.id}>
                            {s.reference} · {n(s.effectiveDate)}
                          </option>
                        ))}
                      </select>
                    </label>
                    <button
                      className="button"
                      disabled={busy}
                      onClick={async () => {
                        const d = await act({
                          action: "run",
                          parcelId: p.id,
                          ...(snapshot ? { snapshotId: snapshot } : {}),
                        });
                        if (d?.id) await getResult(d.id);
                      }}
                    >
                      {t("run")}
                      <Scale size={17} />
                    </button>
                    <button
                      className="button ghost"
                      onClick={() => setShowEditor(!showEditor)}
                    >
                      <Plus size={16} />
                      {t("newSnapshot")}
                    </button>
                  </div>
                  {showEditor && (
                    <SnapshotEditor
                      parcel={p}
                      busy={busy}
                      onCancel={() => setShowEditor(false)}
                      onSave={async (body) => {
                        const d = await act(body);
                        if (d?.id) {
                          setSnapshot(d.id);
                          setShowEditor(false);
                        }
                      }}
                    />
                  )}
                  <div className="panel history-panel">
                    <h3>{t("history")}</h3>
                    {data.runs.length ? (
                      <div className="run-buttons">
                        {data.runs.map((r) => (
                          <button
                            key={r.id}
                            className={result?.id === r.id ? "current" : ""}
                            onClick={() => getResult(r.id)}
                          >
                            <span>
                              {new Date(r.created_at).toLocaleString(
                                lang === "bn" ? "bn-BD" : "en-GB",
                              )}
                            </span>
                            <Badge value={r.status} />
                            <small>{r.id.slice(0, 8)}</small>
                          </button>
                        ))}
                      </div>
                    ) : (
                      <p>{t("noRuns")}</p>
                    )}
                    <Pagination
                      offset={offset}
                      size={10}
                      next={data.runs.length === 10}
                      onChange={setOffset}
                    />
                  </div>
                  {result && (
                    <>
                      <ResultView result={result.result} />
                      <div className="report-actions">
                        <Link
                          className="button ghost"
                          target="_blank"
                          href={`/report/${result.id}`}
                        >
                          <Printer size={16} />
                          {t("report")}
                        </Link>
                      </div>
                      {result.result.findings.length > 0 && (
                        <form
                          className="panel case-form"
                          onSubmit={async (e) => {
                            e.preventDefault();
                            const f = new FormData(e.currentTarget);
                            await act({
                              action: "createReview",
                              runId: result.id,
                              note: f.get("note"),
                            });
                          }}
                        >
                          <label>
                            {t("caseNote")}
                            <textarea
                              name="note"
                              minLength={5}
                              maxLength={2000}
                              required
                            />
                          </label>
                          <button className="button" disabled={busy}>
                            {t("createCase")}
                          </button>
                        </form>
                      )}
                    </>
                  )}
                  <section className="panel source-panel">
                    <h3>{t("evidence")}</h3>
                    {p.documents.map((d) => (
                      <details key={d.id}>
                        <summary>
                          <FileText size={16} />
                          {d.reference}
                          <Badge value={d.status} />
                        </summary>
                        <p>{d.notes}</p>
                        <small>
                          {n(d.date)} · {d.id}
                        </small>
                      </details>
                    ))}
                  </section>
                </>
              )}
            </>
          ) : tab === "reviews" ? (
            <>
              {!data.reviews.length && <Empty text={t("noCases")} />}
              {data.reviews.map((review) => (
                <ReviewCard
                  key={`${review.id}-${review.version}`}
                  review={review}
                  busy={busy}
                  onSave={(status, note) =>
                    act({
                      action: "review",
                      id: review.id,
                      status,
                      note,
                      version: review.version,
                    })
                  }
                />
              ))}
              <Pagination
                offset={offset}
                size={10}
                next={data.reviews.length === 10}
                onChange={setOffset}
              />
            </>
          ) : tab === "audit" ? (
            <section className="panel">
              <h2>{t("audit")}</h2>
              {data.audit.map((a) => (
                <article className="audit-item" key={a.id}>
                  <span className="audit-dot" />
                  <div>
                    <h3>{t(a.action)}</h3>
                    <p>{a.reason}</p>
                    <small>
                      {a.actor} ·{" "}
                      {new Date(a.created_at).toLocaleString(
                        lang === "bn" ? "bn-BD" : "en-GB",
                      )}
                    </small>
                  </div>
                </article>
              ))}
              {!data.audit.length && <p>{t("noAudit")}</p>}
              <Pagination
                offset={offset}
                size={10}
                next={data.audit.length === 10}
                onChange={setOffset}
              />
            </section>
          ) : tab === "profile" ? (
            <PasswordForm
              onError={setError}
              onChanged={() => {
                setUser(null);
                onUser(null);
                setData(null);
                setResult(null);
                setTab("parcels");
              }}
            />
          ) : (
            <Accounts onError={setError} />
          )}
        </>
      )}
    </main>
  );
}
function Loading() {
  const { t } = usePreferences();
  return (
    <div className="loading-state" role="status">
      <RefreshCw size={25} />
      <h3>{t("loading")}</h3>
      <p>{t("coldStart")}</p>
    </div>
  );
}
function Empty({ text }: { text: string }) {
  return (
    <div className="empty-state">
      <FileText size={30} />
      <p>{text}</p>
    </div>
  );
}
function Pagination({
  offset,
  size,
  next,
  onChange,
}: {
  offset: number;
  size: number;
  next: boolean;
  onChange: (n: number) => void;
}) {
  const { t, n } = usePreferences();
  return (
    <div className="pagination">
      <button
        className="button ghost small"
        disabled={!offset}
        onClick={() => onChange(Math.max(0, offset - size))}
      >
        {t("previous")}
      </button>
      <span>
        {t("page")} {n(Math.floor(offset / size) + 1)}
      </span>
      <button
        className="button ghost small"
        disabled={!next}
        onClick={() => onChange(offset + size)}
      >
        {t("more")}
      </button>
    </div>
  );
}
function SnapshotEditor({
  parcel: p,
  busy,
  onSave,
  onCancel,
}: {
  parcel: Parcel;
  busy: boolean;
  onSave: (body: unknown) => Promise<void>;
  onCancel: () => void;
}) {
  const { t, lang } = usePreferences();
  return (
    <form
      className="panel snapshot-editor"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        await onSave({
          action: "snapshot",
          parcelId: p.id,
          holdings: Object.keys(p.parties).map((party) => ({
            party,
            share: asciiDigits(String(f.get(party))).trim(),
          })),
          note: f.get("note"),
          effectiveDate: f.get("date"),
          previousSnapshotId: p.snapshots.at(-1)?.id ?? null,
        });
      }}
    >
      <h2>{t("newSnapshot")}</h2>
      <p>{t("newSnapshotText")}</p>
      <div className="form-grid">
        {Object.entries(p.parties).map(([id, name]) => (
          <label key={id}>
            {partyName(name, lang)}
            <input
              name={id}
              aria-label={`${partyName(name, lang)} ${t("share")}`}
              defaultValue={
                p.snapshots.at(-1)?.holdings.find((h) => h.party === id)
                  ?.share ?? "0"
              }
              maxLength={82}
              required
            />
          </label>
        ))}
      </div>
      <small>{t("fractionHint")}</small>
      <label>
        {t("date")}
        <input
          name="date"
          type="date"
          defaultValue="2026-04-01"
          min={p.events.reduce(
            (a, e) => (e.effectiveDate > a ? e.effectiveDate : a),
            p.baselineDate,
          )}
          required
        />
      </label>
      <label>
        {t("reason")}
        <textarea name="note" minLength={5} maxLength={2000} required />
      </label>
      <div className="button-row">
        <button className="button" disabled={busy}>
          {t("saveSnapshot")}
        </button>
        <button type="button" className="button ghost" onClick={onCancel}>
          {t("cancel")}
        </button>
      </div>
    </form>
  );
}
function ReviewCard({
  review,
  busy,
  onSave,
}: {
  review: Review & { parcel_id: string };
  busy: boolean;
  onSave: (status: string, note: string) => Promise<unknown>;
}) {
  const { t, n } = usePreferences();
  const transitions: Record<string, string[]> = {
    NEW: ["UNDER_REVIEW"],
    UNDER_REVIEW: ["NEEDS_EVIDENCE", "RESOLVED", "ESCALATED"],
    NEEDS_EVIDENCE: ["UNDER_REVIEW", "ESCALATED"],
    RESOLVED: ["UNDER_REVIEW"],
    ESCALATED: ["UNDER_REVIEW"],
  };
  return (
    <section className="panel review-card">
      <div className="review-title">
        <div>
          <small>
            {review.parcel_id} · {t("version")} {n(review.version)}
          </small>
          <h3>{t("createCase")}</h3>
        </div>
        <Badge value={review.status} />
      </div>
      <p>{review.note}</p>
      <Link
        className="text-button"
        href={`/report/${review.run_id}`}
        target="_blank"
      >
        {t("report")}
        <ArrowUpRight size={15} />
      </Link>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          const f = new FormData(e.currentTarget);
          await onSave(String(f.get("status")), String(f.get("note")));
        }}
      >
        <label>
          {t("action")}
          <select name="status">
            {transitions[review.status].map((s) => (
              <option key={s} value={s}>
                {t(s)}
              </option>
            ))}
          </select>
        </label>
        <label>
          {t("reviewNote")}
          <textarea name="note" required minLength={5} maxLength={2000} />
        </label>
        <button className="button" disabled={busy}>
          {t("saveAction")}
        </button>
      </form>
    </section>
  );
}
function Accounts({ onError }: { onError: (error: string) => void }) {
  const { t } = usePreferences();
  const [accounts, setAccounts] = useState<(User & { disabled: boolean })[]>(
      [],
    ),
    [offset, setOffset] = useState(0),
    [busy, setBusy] = useState(false),
    [done, setDone] = useState(false);
  useEffect(() => {
    api<{ accounts: (User & { disabled: boolean })[] }>(
      `/api/accounts?offset=${offset}`,
    )
      .then((d) => setAccounts(d.accounts))
      .catch((e) => onError(e.message));
  }, [offset, onError]);
  async function refresh() {
    setAccounts(
      (
        await api<{ accounts: (User & { disabled: boolean })[] }>(
          `/api/accounts?offset=${offset}`,
        )
      ).accounts,
    );
  }
  return (
    <>
      <form
        className="panel account-form"
        onSubmit={async (e) => {
          e.preventDefault();
          const form = e.currentTarget,
            f = new FormData(form);
          setBusy(true);
          setDone(false);
          try {
            await api("/api/accounts", {
              action: "create",
              name: f.get("name"),
              email: f.get("email"),
              password: f.get("password"),
              parcelIds: String(f.get("parcels"))
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean),
            });
            form.reset();
            await refresh();
            setDone(true);
          } catch (e) {
            onError((e as Error).message);
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2>{t("createAccount")}</h2>
        {done && (
          <div role="status" className="notice success">
            {t("saved")}
          </div>
        )}
        <div className="form-grid">
          <label>
            {t("name")}
            <input name="name" required minLength={2} maxLength={100} />
          </label>
          <label>
            {t("email")}
            <input name="email" type="email" required maxLength={254} />
          </label>
          <label>
            {t("newPassword")}
            <input
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength={12}
              maxLength={128}
            />
          </label>
        </div>
        <label>
          {t("grant")}
          <input
            name="parcels"
            required
            placeholder="DEMO-P4-001, DEMO-P4-002"
          />
        </label>
        <p>{t("grantHelp")}</p>
        <button className="button" disabled={busy}>
          {t("createAccount")}
        </button>
      </form>
      <section className="panel">
        {accounts.map((a) => (
          <div className="account-row" key={a.id}>
            <Users size={21} />
            <div>
              <strong>{a.display_name}</strong>
              <small>
                {a.email} · {t(a.role === "ADMIN" ? "admin" : "reviewer")} ·{" "}
                {t(a.disabled ? "disabled" : "active")}
              </small>
            </div>
            {a.role !== "ADMIN" && !a.disabled && (
              <button
                className="button ghost small"
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    await api("/api/accounts", { action: "disable", id: a.id });
                    await refresh();
                  } catch (e) {
                    onError((e as Error).message);
                  } finally {
                    setBusy(false);
                  }
                }}
              >
                {t("disable")}
              </button>
            )}
          </div>
        ))}
        <Pagination
          offset={offset}
          size={10}
          next={accounts.length === 10}
          onChange={setOffset}
        />
      </section>
    </>
  );
}

function PasswordForm({
  onError,
  onChanged,
}: {
  onError: (error: string) => void;
  onChanged: () => void;
}) {
  const { t } = usePreferences();
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="panel login-card"
      onSubmit={async (e) => {
        e.preventDefault();
        const f = new FormData(e.currentTarget);
        setBusy(true);
        try {
          await api(
            "/api/session",
            {
              currentPassword: f.get("currentPassword"),
              newPassword: f.get("newPassword"),
            },
            "PATCH",
          );
          onChanged();
        } catch (e) {
          onError((e as Error).message);
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2>{t("changePassword")}</h2>
      <p>{t("passwordHelp")}</p>
      <label>
        {t("currentPassword")}
        <input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          required
          maxLength={128}
        />
      </label>
      <label>
        {t("newPasswordLabel")}
        <input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          required
          minLength={12}
          maxLength={128}
        />
      </label>
      <button className="button" disabled={busy}>
        {t("changePassword")}
      </button>
    </form>
  );
}
