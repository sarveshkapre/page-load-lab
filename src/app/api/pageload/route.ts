import { NextRequest } from "next/server";
import { SafeFetchResult, safeJsonFetch } from "@/lib/safeFetch";
import { normalizeIp } from "@/lib/ip";
import type { PageLoadResponse, PsiError, PsiSummary } from "@/lib/pageloadTypes";
import { buildWhySlowDiagnoses } from "@/lib/whySlow";

type PsiResponse = Record<string, unknown>;

type LhrAudit = {
  title?: string;
  description?: string;
  displayValue?: string;
  numericValue?: number;
  score?: number | null;
  details?: {
    type?: string;
    overallSavingsMs?: number;
  };
};

type LighthouseResult = {
  categories?: {
    performance?: { score?: number };
  };
  audits?: Record<string, LhrAudit>;
};

type CruxMetric = {
  percentile?: number;
  category?: string;
  distributions?: Array<{ min?: number; max?: number; proportion?: number }>;
};

type LoadingExperience = {
  overall_category?: string;
  metrics?: Record<string, CruxMetric>;
};

function validateUrl(input: string): { ok: true; url: string } | { ok: false; error: string } {
  try {
    const u = new URL(input);
    if (u.protocol !== "http:" && u.protocol !== "https:") {
      return { ok: false, error: "URL must start with http:// or https://" };
    }
    if (!u.hostname || u.hostname.length > 253) {
      return { ok: false, error: "Invalid hostname" };
    }
    return { ok: true, url: u.toString() };
  } catch {
    return { ok: false, error: "Invalid URL" };
  }
}

function pickAuditMetric(lhr: LighthouseResult | null, id: string) {
  const a = lhr?.audits?.[id];
  if (!a) return null;
  return {
    id,
    title: a.title ?? "",
    displayValue: a.displayValue ?? "",
    numericValue: typeof a.numericValue === "number" ? a.numericValue : null,
    score: typeof a.score === "number" ? a.score : null,
  };
}

function pickFieldMetrics(json: PsiResponse) {
  // PSI v5: loadingExperience contains CrUX "field" data when available.
  const le = (json["loadingExperience"] ?? null) as LoadingExperience | null;
  if (!le?.metrics) return null;
  const metrics = Object.entries(le.metrics)
    .map(([id, m]) => ({
      id,
      percentile: typeof m?.percentile === "number" ? m.percentile : null,
      category: typeof m?.category === "string" ? m.category : null,
    }))
    .filter((m) => m.percentile != null || m.category != null);
  if (!metrics.length) return null;
  return {
    overallCategory: typeof le.overall_category === "string" ? le.overall_category : null,
    metrics,
  };
}

function pickOpportunities(lhr: LighthouseResult | null) {
  const audits = lhr?.audits ?? {};
  const out: Array<{
    id: string;
    title: string;
    description: string;
    savingsMs: number | null;
    displayValue: string;
  }> = [];

  for (const [id, a] of Object.entries(audits)) {
    if (!a || a.details?.type !== "opportunity") continue;
    const savingsMs =
      typeof a.details?.overallSavingsMs === "number"
        ? a.details.overallSavingsMs
        : typeof a.numericValue === "number"
          ? a.numericValue
          : null;
    out.push({
      id,
      title: a.title ?? id,
      description: a.description ?? "",
      savingsMs,
      displayValue: a.displayValue ?? "",
    });
  }

  out.sort((x, y) => (y.savingsMs ?? 0) - (x.savingsMs ?? 0));
  return out.slice(0, 12);
}

const OK_CACHE_TTL_MS = 5 * 60 * 1000;
const ERR_CACHE_TTL_MS = 30 * 1000;
const CACHE_MAX_ENTRIES = 25;

const PSI_KEY_HINT = "PSI quota is often very limited without an API key. Set PSI_API_KEY to reduce 429s.";

type CacheEntry = { expiresAt: number; value: SafeFetchResult<PsiResponse> };
const psiCache = new Map<string, CacheEntry>();

function cacheKey(targetUrl: string, strategy: "mobile" | "desktop", locale: string | null) {
  return `${strategy}|${locale ?? ""}|${targetUrl}`;
}

function cacheGet(key: string): SafeFetchResult<PsiResponse> | null {
  const hit = psiCache.get(key);
  if (!hit) return null;
  if (Date.now() > hit.expiresAt) {
    psiCache.delete(key);
    return null;
  }
  return hit.value;
}

function cacheSet(key: string, value: SafeFetchResult<PsiResponse>) {
  const ttl = value.ok ? OK_CACHE_TTL_MS : ERR_CACHE_TTL_MS;
  psiCache.set(key, { expiresAt: Date.now() + ttl, value });
  // Basic bounded cache to avoid unbounded memory growth.
  if (psiCache.size <= CACHE_MAX_ENTRIES) return;
  for (const [k, v] of psiCache) {
    if (Date.now() > v.expiresAt) psiCache.delete(k);
  }
  while (psiCache.size > CACHE_MAX_ENTRIES) {
    const first = psiCache.keys().next().value as string | undefined;
    if (!first) break;
    psiCache.delete(first);
  }
}

type RateState = { resetAt: number; count: number };
const rate = new Map<string, RateState>();
const RATE_WINDOW_MS = 60 * 1000;
const RATE_LIMIT = 10;
const RATE_PRUNE_THRESHOLD = 2000;

function pruneRateLimit(now: number) {
  if (rate.size <= RATE_PRUNE_THRESHOLD) return;
  for (const [k, v] of rate) {
    if (now >= v.resetAt) rate.delete(k);
  }
}

function checkRateLimit(clientKey: string): { ok: true } | { ok: false; retryAfterSec: number } {
  const now = Date.now();
  pruneRateLimit(now);
  const cur = rate.get(clientKey);
  if (!cur || now >= cur.resetAt) {
    rate.set(clientKey, { resetAt: now + RATE_WINDOW_MS, count: 1 });
    return { ok: true };
  }
  if (cur.count >= RATE_LIMIT) {
    return { ok: false, retryAfterSec: Math.max(1, Math.ceil((cur.resetAt - now) / 1000)) };
  }
  cur.count += 1;
  return { ok: true };
}

async function runPsi(targetUrl: string, strategy: "mobile" | "desktop", locale: string | null) {
  const api = new URL("https://www.googleapis.com/pagespeedonline/v5/runPagespeed");
  api.searchParams.set("url", targetUrl);
  api.searchParams.set("strategy", strategy);
  if (locale) api.searchParams.set("locale", locale);
  api.searchParams.append("category", "performance");
  api.searchParams.append("category", "best-practices");
  api.searchParams.append("category", "seo");

  const key = process.env.PSI_API_KEY?.trim();
  if (key) api.searchParams.set("key", key);

  return safeJsonFetch<PsiResponse>(api.toString(), { timeoutMs: 12000 });
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const raw = (searchParams.get("url") ?? "").trim();
  if (!raw) {
    return Response.json({ error: "missing query parameter url" }, { status: 400 });
  }

  const strategyParam = (searchParams.get("strategy") ?? "mobile").trim().toLowerCase();
  const includeRaw = (searchParams.get("includeRaw") ?? "").trim() === "1";
  const debug = (searchParams.get("debug") ?? "").trim() === "1";
  const locale = (searchParams.get("locale") ?? "").trim() || null;

  const v = validateUrl(raw);
  if (!v.ok) {
    return Response.json({ error: v.error }, { status: 400 });
  }
  const targetUrl = v.url;
  const apiKeyConfigured = !!process.env.PSI_API_KEY?.trim();

  const wantMobile = strategyParam === "mobile" || strategyParam === "both";
  const wantDesktop = strategyParam === "desktop" || strategyParam === "both";
  if (!wantMobile && !wantDesktop) {
    return Response.json({ error: "strategy must be mobile, desktop, or both" }, { status: 400 });
  }

  // If we need to make at least one upstream call, apply a small in-memory rate limit.
  const clientIp =
    normalizeIp(req.headers.get("x-forwarded-for")) ??
    normalizeIp(req.headers.get("x-real-ip")) ??
    normalizeIp(req.headers.get("cf-connecting-ip")) ??
    null;

  const cacheHits = {
    mobile: wantMobile ? cacheGet(cacheKey(targetUrl, "mobile", locale)) : null,
    desktop: wantDesktop ? cacheGet(cacheKey(targetUrl, "desktop", locale)) : null,
  };

  const needUpstream =
    (wantMobile && !cacheHits.mobile) || (wantDesktop && !cacheHits.desktop) || includeRaw;

  if (needUpstream) {
    const rl = checkRateLimit(clientIp ?? "unknown");
    if (!rl.ok) {
      return Response.json(
        {
          error: "rate limit exceeded (try again soon)",
          retryAfterSec: rl.retryAfterSec,
        },
        { status: 429, headers: { "Retry-After": String(rl.retryAfterSec) } },
      );
    }
  }

  async function getPsi(strategy: "mobile" | "desktop"): Promise<SafeFetchResult<PsiResponse>> {
    // If includeRaw is requested, bypass cache so the caller can opt-in to large payloads intentionally.
    if (!includeRaw) {
      const hit = cacheGet(cacheKey(targetUrl, strategy, locale));
      if (hit) return hit;
    }
    const res = await runPsi(targetUrl, strategy, locale);
    if (!includeRaw) cacheSet(cacheKey(targetUrl, strategy, locale), res);
    return res;
  }

  const [mobile, desktop] = await Promise.all([
    wantMobile ? getPsi("mobile") : Promise.resolve(null),
    wantDesktop ? getPsi("desktop") : Promise.resolve(null),
  ]);

  function summarize(res: SafeFetchResult<PsiResponse>): PsiSummary | null {
    if (!res.ok) return null;
    const json = res.value;
    const lhr = (json["lighthouseResult"] ?? null) as LighthouseResult | null;
    const perfScore =
      typeof lhr?.categories?.performance?.score === "number" ? lhr.categories.performance.score : null;
    const opportunities = pickOpportunities(lhr);
    const field = pickFieldMetrics(json);
    const metrics = [
      pickAuditMetric(lhr, "server-response-time"),
      pickAuditMetric(lhr, "largest-contentful-paint"),
      pickAuditMetric(lhr, "interaction-to-next-paint"),
      pickAuditMetric(lhr, "cumulative-layout-shift"),
      pickAuditMetric(lhr, "total-blocking-time"),
      pickAuditMetric(lhr, "speed-index"),
    ].filter((m): m is NonNullable<typeof m> => m != null);

    return {
      fetchedAt: res.fetchedAt,
      status: res.status,
      perfScore,
      metrics,
      opportunities,
      reasons: buildWhySlowDiagnoses({ perfScore, metrics, opportunities, field }),
      field,
      raw: includeRaw ? json : undefined,
    };
  }

  function errorPayload(res: Extract<SafeFetchResult<PsiResponse>, { ok: false }>): PsiError {
    const isQuota = res.status === 429 || res.error.includes("HTTP 429");
    const hint = !apiKeyConfigured && isQuota ? PSI_KEY_HINT : null;
    return {
      error: res.error,
      fetchedAt: res.fetchedAt,
      status: res.status,
      detail: debug ? res.detail : undefined,
      hint,
    };
  }

  const payload: PageLoadResponse = {
    url: targetUrl,
    source: "pagespeed-insights",
    apiKeyConfigured,
    notes: [
      "This v1 uses PageSpeed Insights for a credible “why slow?” explanation.",
      "For a true request waterfall and CPU timeline, add a real-browser runner (Playwright) in v2.",
    ],
    mobile:
      mobile == null
        ? null
        : mobile.ok
          ? summarize(mobile)
          : errorPayload(mobile),
    desktop:
      desktop == null
        ? null
        : desktop.ok
          ? summarize(desktop)
          : errorPayload(desktop),
    trust: "untrusted",
  };

  const mobileFailed = wantMobile ? mobile == null || !mobile.ok : true;
  const desktopFailed = wantDesktop ? desktop == null || !desktop.ok : true;
  const allFailed = mobileFailed && desktopFailed;

  const any429 =
    (mobile != null && !mobile.ok && mobile.status === 429) || (desktop != null && !desktop.ok && desktop.status === 429);
  const status = allFailed ? (any429 ? 429 : 502) : 200;

  if (status !== 200) {
    const firstError =
      (mobile && !mobile.ok ? mobile.error : null) ?? (desktop && !desktop.ok ? desktop.error : null) ?? "upstream error";
    payload.error = firstError;
    const hint = !apiKeyConfigured && any429 ? PSI_KEY_HINT : null;
    if (hint) payload.hint = hint;
  }

  return Response.json(payload, { status, headers: { "Cache-Control": "no-store" } });
}
