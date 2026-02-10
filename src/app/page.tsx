"use client";

import { useEffect, useMemo, useState } from "react";
import type { PageLoadResponse, PsiError, PsiSummary } from "@/lib/pageloadTypes";

function pct(n: number | null) {
  if (n == null) return "-";
  return `${Math.round(n * 100)}%`;
}

type SavedRun = {
  id: string;
  createdAt: string;
  url: string;
  strategy: "mobile" | "desktop" | "both";
  data: PageLoadResponse;
};

const RUNS_KEY = "pll:savedRuns:v1";
const RUNS_MAX = 20;

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function loadRuns(): SavedRun[] {
  if (typeof window === "undefined") return [];
  const raw = window.localStorage.getItem(RUNS_KEY);
  if (!raw) return [];
  const parsed = safeParseJson<unknown>(raw);
  if (!Array.isArray(parsed)) return [];
  // Best-effort structural filtering.
  return parsed
    .filter((x): x is SavedRun => {
      if (!x || typeof x !== "object") return false;
      const r = x as Record<string, unknown>;
      return (
        typeof r.id === "string" &&
        typeof r.createdAt === "string" &&
        typeof r.url === "string" &&
        (r.strategy === "mobile" || r.strategy === "desktop" || r.strategy === "both") &&
        !!r.data &&
        typeof r.data === "object"
      );
    })
    .slice(0, RUNS_MAX);
}

function persistRuns(runs: SavedRun[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, RUNS_MAX)));
  } catch {
    // Ignore quota / serialization failures; saved runs are a convenience.
  }
}

function downloadJson(filename: string, obj: unknown) {
  if (typeof window === "undefined") return;
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function stripRawFromResult(x: PsiSummary | PsiError): PsiSummary | PsiError {
  if (!isSummary(x)) return x;
  // Avoid persisting huge payloads if someone later adds includeRaw.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { raw, ...rest } = x;
  return rest;
}

function stripRawFromResponse(r: PageLoadResponse): PageLoadResponse {
  return {
    ...r,
    mobile: r.mobile ? stripRawFromResult(r.mobile) : null,
    desktop: r.desktop ? stripRawFromResult(r.desktop) : null,
  };
}

export default function PageLoadLab() {
  const [url, setUrl] = useState("https://example.com");
  const [strategy, setStrategy] = useState<"mobile" | "desktop" | "both">("mobile");
  const [data, setData] = useState<PageLoadResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const [savedRuns, setSavedRuns] = useState<SavedRun[]>([]);
  const [compareA, setCompareA] = useState<string>("");
  const [compareB, setCompareB] = useState<string>("");

  useEffect(() => {
    const runs = loadRuns();
    setSavedRuns(runs);
    setCompareA(runs[0]?.id ?? "");
    setCompareB(runs[1]?.id ?? "");
  }, []);

  const run = async () => {
    setLoading(true);
    setErr("");
    setData(null);
    try {
      const qs = new URLSearchParams({ url: url.trim(), strategy });
      const res = await fetch(`/api/pageload?${qs.toString()}`, { cache: "no-store" });
      const json = (await res.json()) as PageLoadResponse;
      setData(json);
      if (!res.ok) {
        const maybeError = (json as unknown as Record<string, unknown>)["error"];
        setErr(typeof maybeError === "string" ? maybeError : `HTTP ${res.status}`);
      }
    } catch (e) {
      setErr(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  };

  const hasResults = useMemo(() => !!(data?.mobile || data?.desktop), [data]);

  const canSave = useMemo(() => !loading && !err && !!data, [data, err, loading]);
  const canDownload = useMemo(() => !loading && !!data, [data, loading]);

  const onSaveRun = () => {
    if (!canSave || !data) return;
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : String(Date.now());
    const run: SavedRun = {
      id,
      createdAt: new Date().toISOString(),
      url: data.url,
      strategy,
      data: stripRawFromResponse(data),
    };
    const next = [run, ...savedRuns].slice(0, RUNS_MAX);
    setSavedRuns(next);
    persistRuns(next);
    // Auto-populate compare selections when helpful.
    setCompareA((cur) => cur || run.id);
    setCompareB((cur) => (cur && cur !== run.id ? cur : next[1]?.id ?? ""));
  };

  const onDeleteRun = (id: string) => {
    const next = savedRuns.filter((r) => r.id !== id);
    setSavedRuns(next);
    persistRuns(next);
    if (compareA === id) setCompareA(next[0]?.id ?? "");
    if (compareB === id) setCompareB(next[1]?.id ?? "");
  };

  const runA = useMemo(() => savedRuns.find((r) => r.id === compareA) ?? null, [compareA, savedRuns]);
  const runB = useMemo(() => savedRuns.find((r) => r.id === compareB) ?? null, [compareB, savedRuns]);

  return (
    <div className="grid gap-6">
      <header className="grid gap-2">
        <h1 className="text-2xl font-semibold tracking-tight text-white">Page Load Lab</h1>
        <p className="max-w-3xl text-sm leading-6 text-white/65">
          V1 uses PageSpeed Insights to get credible Core Web Vitals and a ranked list of “why slow?”
          opportunities. Future v2 adds a real-browser waterfall and CPU timeline.
        </p>
      </header>

      <section className="rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex flex-col gap-3 md:flex-row md:items-center">
          <input
            className="w-full rounded-xl border border-white/15 bg-black/20 px-4 py-3 text-sm text-white/90 outline-none placeholder:text-white/35 focus:border-sky-300/40"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
          <div className="flex shrink-0 gap-2">
            <StrategyPill label="Mobile" active={strategy === "mobile"} onClick={() => setStrategy("mobile")} />
            <StrategyPill label="Desktop" active={strategy === "desktop"} onClick={() => setStrategy("desktop")} />
            <StrategyPill label="Both" active={strategy === "both"} onClick={() => setStrategy("both")} />
          </div>
          <button
            className="shrink-0 rounded-xl bg-sky-400/20 px-4 py-3 text-sm font-semibold text-sky-100 ring-1 ring-sky-300/30 hover:bg-sky-400/25 disabled:opacity-50"
            onClick={() => void run()}
            disabled={loading || !url.trim()}
          >
            {loading ? "Running…" : "Run test"}
          </button>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40"
            onClick={onSaveRun}
            disabled={!canSave}
            title={!canSave ? "Run a test first (and avoid errors) to save a run." : "Save this run locally for compare."}
          >
            Save run
          </button>
          <button
            type="button"
            className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10 disabled:opacity-40"
            onClick={() => (data ? downloadJson("pageload-run.json", data) : null)}
            disabled={!canDownload}
            title="Download the latest run JSON."
          >
            Download JSON
          </button>
          <div className="text-xs text-white/45">Saved runs live only in this browser (localStorage).</div>
        </div>
        {err ? (
          <div className="mt-3 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
            {err}
            {data?.hint ? <div className="mt-1 text-xs text-red-200/80">{data.hint}</div> : null}
          </div>
        ) : null}
      </section>

      {data?.notes?.length ? (
        <section className="rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-white/65 ring-1 ring-white/10">
          <div className="font-semibold text-white/90">Notes</div>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {data.notes.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        </section>
      ) : null}

      {hasResults ? (
        <section className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {data?.mobile ? <ResultPanel label="Mobile" result={data.mobile} /> : null}
          {data?.desktop ? <ResultPanel label="Desktop" result={data.desktop} /> : null}
        </section>
      ) : null}

      {savedRuns.length ? (
        <section className="grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm font-semibold text-white/90">Saved runs</div>
            <button
              type="button"
              className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10"
              onClick={() => {
                setSavedRuns([]);
                persistRuns([]);
                setCompareA("");
                setCompareB("");
              }}
            >
              Clear all
            </button>
          </div>

          <div className="grid gap-2">
            {savedRuns.map((r) => (
              <div
                key={r.id}
                className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 ring-1 ring-white/10 md:flex-row md:items-center md:justify-between"
              >
                <div className="grid gap-1">
                  <div className="text-sm font-semibold text-white/85">{r.url}</div>
                  <div className="flex flex-wrap gap-2 text-xs text-white/50">
                    <span className="font-mono">{r.createdAt}</span>
                    <span className="rounded-full bg-white/5 px-2 py-0.5 ring-1 ring-white/10">{r.strategy}</span>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <label className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10">
                    <input
                      type="radio"
                      name="compareA"
                      className="accent-sky-300"
                      checked={compareA === r.id}
                      onChange={() => setCompareA(r.id)}
                    />
                    A
                  </label>
                  <label className="flex items-center gap-2 rounded-xl bg-black/20 px-3 py-2 text-xs text-white/70 ring-1 ring-white/10">
                    <input
                      type="radio"
                      name="compareB"
                      className="accent-sky-300"
                      checked={compareB === r.id}
                      onChange={() => setCompareB(r.id)}
                    />
                    B
                  </label>
                  <button
                    type="button"
                    className="rounded-xl bg-white/5 px-3 py-2 text-xs font-semibold text-white/80 ring-1 ring-white/10 hover:bg-white/10"
                    onClick={() => downloadJson(`pageload-run-${r.id}.json`, r)}
                    title="Download this saved run JSON."
                  >
                    Download
                  </button>
                  <button
                    type="button"
                    className="rounded-xl bg-red-500/10 px-3 py-2 text-xs font-semibold text-red-200 ring-1 ring-red-400/20 hover:bg-red-500/15"
                    onClick={() => onDeleteRun(r.id)}
                    title="Delete this saved run."
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {runA && runB && runA.id !== runB.id ? (
            <ComparePanel a={runA} b={runB} />
          ) : (
            <div className="text-xs text-white/45">Select two different saved runs (A and B) to compare.</div>
          )}
        </section>
      ) : null}
    </div>
  );
}

function StrategyPill({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-xl px-3 py-3 text-sm font-semibold ring-1 transition",
        active
          ? "bg-white/10 text-white ring-white/20"
          : "bg-black/20 text-white/70 ring-white/10 hover:bg-white/5 hover:text-white",
      ].join(" ")}
    >
      {label}
    </button>
  );
}

function isSummary(x: PsiSummary | PsiError): x is PsiSummary {
  return typeof x === "object" && x != null && "perfScore" in x;
}

function formatDelta(n: number | null) {
  if (n == null || Number.isNaN(n)) return "-";
  const sign = n > 0 ? "+" : "";
  return `${sign}${n}`;
}

function pickSummaryPair(a: PsiSummary | PsiError | null, b: PsiSummary | PsiError | null) {
  const sa = a && isSummary(a) ? a : null;
  const sb = b && isSummary(b) ? b : null;
  return { sa, sb };
}

function ComparePanel({ a, b }: { a: SavedRun; b: SavedRun }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
      <div className="text-sm font-semibold text-white/90">Compare (A to B)</div>
      <div className="mt-1 grid gap-1 text-xs text-white/55">
        <div className="font-mono">A: {a.createdAt}</div>
        <div className="font-mono">B: {b.createdAt}</div>
      </div>

      <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
        <CompareOne label="Mobile" a={a.data.mobile} b={b.data.mobile} />
        <CompareOne label="Desktop" a={a.data.desktop} b={b.data.desktop} />
      </div>
    </div>
  );
}

function CompareOne({
  label,
  a,
  b,
}: {
  label: string;
  a: PsiSummary | PsiError | null;
  b: PsiSummary | PsiError | null;
}) {
  const { sa, sb } = pickSummaryPair(a, b);

  if (!sa || !sb) {
    return (
      <div className="rounded-2xl border border-white/10 bg-black/20 p-4 ring-1 ring-white/10">
        <div className="text-xs font-semibold text-white/70">{label}</div>
        <div className="mt-2 text-xs text-white/45">
          Need successful summaries in both A and B to compare this profile.
        </div>
      </div>
    );
  }

  const perfA = sa.perfScore != null ? Math.round(sa.perfScore * 100) : null;
  const perfB = sb.perfScore != null ? Math.round(sb.perfScore * 100) : null;
  const perfDelta = perfA != null && perfB != null ? perfB - perfA : null;

  const aMetrics = new Map(sa.metrics.map((m) => [m.id, m]));
  const bMetrics = new Map(sb.metrics.map((m) => [m.id, m]));
  const metricIds = Array.from(new Set([...aMetrics.keys(), ...bMetrics.keys()]));

  const aOpp = new Map(sa.opportunities.map((o) => [o.id, o]));
  const bOpp = new Map(sb.opportunities.map((o) => [o.id, o]));
  const oppIds = Array.from(new Set([...aOpp.keys(), ...bOpp.keys()]));

  const changedOpp = oppIds
    .map((id) => {
      const oa = aOpp.get(id) ?? null;
      const ob = bOpp.get(id) ?? null;
      if (!oa || !ob) return null;
      const da = oa.savingsMs;
      const db = ob.savingsMs;
      const delta = da != null && db != null ? Math.round(db - da) : null;
      return { id, title: ob.title || oa.title || id, delta, a: oa, b: ob };
    })
    .filter((x): x is NonNullable<typeof x> => x != null)
    .sort((x, y) => Math.abs(y.delta ?? 0) - Math.abs(x.delta ?? 0))
    .slice(0, 6);

  const addedOpp = oppIds
    .filter((id) => !aOpp.has(id) && bOpp.has(id))
    .map((id) => bOpp.get(id)!)
    .slice(0, 6);

  const removedOpp = oppIds
    .filter((id) => aOpp.has(id) && !bOpp.has(id))
    .map((id) => aOpp.get(id)!)
    .slice(0, 6);

  return (
    <div className="rounded-2xl border border-white/10 bg-black/20 p-4 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-3">
        <div className="text-xs font-semibold text-white/70">{label}</div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
          perf {perfA ?? "-"}% to {perfB ?? "-"}% ({formatDelta(perfDelta)})
        </div>
      </div>

      <div className="mt-4 grid gap-2">
        <div className="text-xs font-semibold text-white/70">Key metrics (A to B)</div>
        <div className="grid gap-2">
          {metricIds.map((id) => {
            const ma = aMetrics.get(id) ?? null;
            const mb = bMetrics.get(id) ?? null;
            const title = mb?.title || ma?.title || id;
            return (
              <div key={id} className="flex items-start justify-between gap-4">
                <div className="text-xs text-white/60">{title}</div>
                <div className="text-right font-mono text-[11px] text-white/85">
                  {(ma?.displayValue || "-").slice(0, 40)} {"->"} {(mb?.displayValue || "-").slice(0, 40)}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-5 grid gap-3">
        <div className="text-xs font-semibold text-white/70">Opportunities delta (ms)</div>
        {changedOpp.length ? (
          <div className="grid gap-2">
            {changedOpp.map((o) => (
              <div key={o.id} className="flex items-start justify-between gap-4">
                <div className="text-xs text-white/60">{o.title}</div>
                <div className="text-right font-mono text-[11px] text-white/85">
                  {o.a.savingsMs != null ? Math.round(o.a.savingsMs) : "-"} {"->"}{" "}
                  {o.b.savingsMs != null ? Math.round(o.b.savingsMs) : "-"} ({formatDelta(o.delta)})
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-white/45">No overlapping opportunities to diff.</div>
        )}
        {(addedOpp.length || removedOpp.length) && (
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 ring-1 ring-white/10">
              <div className="text-[11px] font-semibold text-white/70">Added in B</div>
              <div className="mt-2 grid gap-1">
                {addedOpp.length ? (
                  addedOpp.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-3">
                      <div className="text-[11px] text-white/60">{o.title}</div>
                      <div className="font-mono text-[11px] text-white/80">
                        {o.savingsMs != null ? `${Math.round(o.savingsMs)}ms` : o.displayValue || "-"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-white/45">None</div>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 p-3 ring-1 ring-white/10">
              <div className="text-[11px] font-semibold text-white/70">Removed in B</div>
              <div className="mt-2 grid gap-1">
                {removedOpp.length ? (
                  removedOpp.map((o) => (
                    <div key={o.id} className="flex items-start justify-between gap-3">
                      <div className="text-[11px] text-white/60">{o.title}</div>
                      <div className="font-mono text-[11px] text-white/80">
                        {o.savingsMs != null ? `${Math.round(o.savingsMs)}ms` : o.displayValue || "-"}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-[11px] text-white/45">None</div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function ResultPanel({ label, result }: { label: string; result: PsiSummary | PsiError }) {
  if (!isSummary(result)) {
    return (
      <div className="rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
        <div className="flex items-center justify-between gap-4">
          <div className="text-sm font-semibold text-white/90">{label}</div>
          <div className="rounded-full bg-red-500/10 px-3 py-1 text-xs font-semibold text-red-200 ring-1 ring-red-400/20">
            error {result.status ?? "-"}
          </div>
        </div>
        <div className="mt-4 rounded-xl border border-red-400/20 bg-red-500/10 p-3 text-sm text-red-200">
          {result.error}
          {result.hint ? <div className="mt-1 text-xs text-red-200/80">{result.hint}</div> : null}
          <div className="mt-2 font-mono text-xs text-white/55">fetched {result.fetchedAt}</div>
        </div>
      </div>
    );
  }

  const summary = result;
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 ring-1 ring-white/10">
      <div className="flex items-center justify-between gap-4">
        <div className="text-sm font-semibold text-white/90">{label}</div>
        <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold text-white/80 ring-1 ring-white/15">
          perf {pct(summary.perfScore)}
        </div>
      </div>
      <div className="mt-1 font-mono text-xs text-white/45">fetched {summary.fetchedAt}</div>

      <div className="mt-4 grid gap-3">
        <div className="text-xs font-semibold text-white/70">Key metrics</div>
        <div className="grid gap-2">
          {summary.metrics.map((m) => (
            <div key={m.id} className="flex items-start justify-between gap-4">
              <div className="text-sm text-white/70">{m.title}</div>
              <div className="text-right font-mono text-xs text-white/85">{m.displayValue || "-"}</div>
            </div>
          ))}
        </div>
      </div>

      {summary.field?.metrics?.length ? (
        <div className="mt-6 grid gap-3">
          <div className="text-xs font-semibold text-white/70">
            Field data (CrUX){summary.field.overallCategory ? `: ${summary.field.overallCategory}` : ""}
          </div>
          <div className="grid gap-2">
            {summary.field.metrics.slice(0, 6).map((m) => (
              <div key={m.id} className="flex items-start justify-between gap-4">
                <div className="text-sm text-white/70">{m.id}</div>
                <div className="text-right font-mono text-xs text-white/85">
                  {m.percentile != null ? `p75 ${Math.round(m.percentile)}` : "-"}
                  {m.category ? ` (${m.category})` : ""}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3">
        <div className="text-xs font-semibold text-white/70">Top “why slow?” opportunities</div>
        <div className="grid gap-2">
          {summary.opportunities.map((o) => (
            <div key={o.id} className="rounded-xl border border-white/10 bg-black/20 p-3 ring-1 ring-white/10">
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-white/85">{o.title}</div>
                <div className="shrink-0 font-mono text-xs text-white/70">
                  {o.savingsMs != null ? `${Math.round(o.savingsMs)}ms` : o.displayValue || "-"}
                </div>
              </div>
              {o.description ? <div className="mt-1 text-xs leading-5 text-white/60">{o.description}</div> : null}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
