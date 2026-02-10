"use client";

import { useMemo, useState } from "react";
import type { PageLoadResponse, PsiError, PsiSummary } from "@/lib/pageloadTypes";

function pct(n: number | null) {
  if (n == null) return "-";
  return `${Math.round(n * 100)}%`;
}

export default function PageLoadLab() {
  const [url, setUrl] = useState("https://example.com");
  const [strategy, setStrategy] = useState<"mobile" | "desktop" | "both">("mobile");
  const [data, setData] = useState<PageLoadResponse | null>(null);
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

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
