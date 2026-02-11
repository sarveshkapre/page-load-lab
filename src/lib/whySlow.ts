import type { PsiDiagnosis, PsiFieldData, PsiMetric, PsiOpportunity } from "@/lib/pageloadTypes";

const FIELD_TTFB_IDS = ["EXPERIMENTAL_TIME_TO_FIRST_BYTE", "TIME_TO_FIRST_BYTE"];
const FIELD_LCP_IDS = ["LARGEST_CONTENTFUL_PAINT_MS"];
const FIELD_INP_IDS = ["INTERACTION_TO_NEXT_PAINT"];
const FIELD_CLS_IDS = ["CUMULATIVE_LAYOUT_SHIFT_SCORE"];

type Severity = PsiDiagnosis["severity"];
type Impact = PsiDiagnosis["expectedImpact"];

type DraftDiagnosis = {
  score: number;
  item: PsiDiagnosis;
};

function normalizeCategory(input: string | null | undefined): string | null {
  if (!input) return null;
  const c = input.trim().toLowerCase();
  return c || null;
}

function isPoorCategory(input: string | null | undefined) {
  const c = normalizeCategory(input);
  return c === "poor" || c === "slow";
}

function isNeedsImprovementCategory(input: string | null | undefined) {
  const c = normalizeCategory(input);
  return c === "needs improvement" || c === "ni" || c === "average";
}

function severityFromMs(ms: number, mediumThreshold: number, highThreshold: number): Severity {
  if (ms >= highThreshold) return "high";
  if (ms >= mediumThreshold) return "medium";
  return "low";
}

function scoreFromSeverity(severity: Severity) {
  switch (severity) {
    case "high":
      return 3;
    case "medium":
      return 2;
    default:
      return 1;
  }
}

function impactFromSavingsMs(ms: number): Impact {
  if (ms >= 1200) return "high";
  if (ms >= 350) return "medium";
  return "low";
}

function metricById(metrics: PsiMetric[], id: string) {
  return metrics.find((m) => m.id === id) ?? null;
}

function fieldMetricCategory(field: PsiFieldData | null | undefined, metricIds: string[]) {
  if (!field?.metrics?.length) return null;
  for (const id of metricIds) {
    const found = field.metrics.find((m) => m.id === id);
    if (found?.category) return found.category;
  }
  return null;
}

function savingsForOpportunityIds(opportunities: PsiOpportunity[], ids: string[]) {
  let total = 0;
  for (const id of ids) {
    const hit = opportunities.find((o) => o.id === id);
    if (hit?.savingsMs != null) total += Math.max(0, hit.savingsMs);
  }
  return Math.round(total);
}

function pushDiagnosis(
  out: DraftDiagnosis[],
  id: string,
  title: string,
  severity: Severity,
  expectedImpact: Impact,
  evidence: Array<string | null>,
  recommendedFixes: Array<string | null>,
  scoreBoost: number,
) {
  const filteredEvidence = evidence.filter((x): x is string => !!x && x.trim().length > 0).slice(0, 3);
  const filteredFixes = recommendedFixes.filter((x): x is string => !!x && x.trim().length > 0).slice(0, 3);
  if (!filteredEvidence.length || !filteredFixes.length) return;

  out.push({
    score: scoreBoost + scoreFromSeverity(severity) * 100,
    item: {
      id,
      title,
      severity,
      expectedImpact,
      evidence: filteredEvidence,
      recommendedFixes: filteredFixes,
    },
  });
}

type BuildDiagnosesInput = {
  perfScore: number | null;
  metrics: PsiMetric[];
  opportunities: PsiOpportunity[];
  field: PsiFieldData | null | undefined;
};

export function buildWhySlowDiagnoses(input: BuildDiagnosesInput): PsiDiagnosis[] {
  const drafts: DraftDiagnosis[] = [];
  const { metrics, opportunities, field, perfScore } = input;

  const ttfb = metricById(metrics, "server-response-time");
  const lcp = metricById(metrics, "largest-contentful-paint");
  const inp = metricById(metrics, "interaction-to-next-paint");
  const cls = metricById(metrics, "cumulative-layout-shift");
  const tbt = metricById(metrics, "total-blocking-time");

  const fieldTtfbCategory = fieldMetricCategory(field, FIELD_TTFB_IDS);
  const fieldLcpCategory = fieldMetricCategory(field, FIELD_LCP_IDS);
  const fieldInpCategory = fieldMetricCategory(field, FIELD_INP_IDS);
  const fieldClsCategory = fieldMetricCategory(field, FIELD_CLS_IDS);

  const renderBlockingSavings = savingsForOpportunityIds(opportunities, ["render-blocking-resources"]);
  const jsSavings = savingsForOpportunityIds(opportunities, [
    "unused-javascript",
    "legacy-javascript",
    "bootup-time",
    "mainthread-work-breakdown",
  ]);
  const imageSavings = savingsForOpportunityIds(opportunities, [
    "modern-image-formats",
    "uses-responsive-images",
    "offscreen-images",
    "efficiently-encode-images",
  ]);
  const cacheSavings = savingsForOpportunityIds(opportunities, ["uses-long-cache-ttl"]);
  const thirdPartySavings = savingsForOpportunityIds(opportunities, ["third-party-summary"]);

  if ((ttfb?.numericValue ?? 0) >= 800 || isPoorCategory(fieldTtfbCategory) || isNeedsImprovementCategory(fieldTtfbCategory)) {
    const ms = ttfb?.numericValue ?? 0;
    const severity =
      isPoorCategory(fieldTtfbCategory) || ms >= 1800
        ? "high"
        : severityFromMs(ms, 800, 1400);
    pushDiagnosis(
      drafts,
      "origin-latency",
      "Slow server response (TTFB)",
      severity,
      severity === "high" ? "high" : "medium",
      [
        ttfb?.displayValue ? `Lab server response time: ${ttfb.displayValue}.` : null,
        fieldTtfbCategory ? `Field TTFB category: ${fieldTtfbCategory}.` : null,
      ],
      [
        "Serve HTML through a CDN edge cache where possible.",
        "Profile backend/database latency and reduce cold-start work on initial requests.",
        "Use early hints/preconnect for critical origins if backend optimization is limited.",
      ],
      Math.min(90, Math.round(ms / 25)),
    );
  }

  if ((lcp?.numericValue ?? 0) >= 2500 || renderBlockingSavings >= 150 || isPoorCategory(fieldLcpCategory)) {
    const lcpMs = lcp?.numericValue ?? 0;
    const severity =
      lcpMs >= 4000 || renderBlockingSavings >= 700 || isPoorCategory(fieldLcpCategory)
        ? "high"
        : severityFromMs(lcpMs, 2500, 3200);
    pushDiagnosis(
      drafts,
      "lcp-render-blocking",
      "Late hero rendering (LCP path blocked)",
      severity,
      impactFromSavingsMs(Math.max(lcpMs / 4, renderBlockingSavings)),
      [
        lcp?.displayValue ? `Lab LCP: ${lcp.displayValue}.` : null,
        renderBlockingSavings > 0 ? `Render-blocking resource opportunity: ~${renderBlockingSavings}ms.` : null,
        fieldLcpCategory ? `Field LCP category: ${fieldLcpCategory}.` : null,
      ],
      [
        "Inline critical CSS and defer non-critical styles/scripts.",
        "Preload the LCP image/font and reduce above-the-fold payload.",
        "Move non-essential third-party scripts after first paint.",
      ],
      Math.min(140, Math.round(lcpMs / 30) + Math.round(renderBlockingSavings / 20)),
    );
  }

  if ((tbt?.numericValue ?? 0) >= 200 || (inp?.numericValue ?? 0) >= 200 || jsSavings >= 250 || isPoorCategory(fieldInpCategory)) {
    const tbtMs = tbt?.numericValue ?? 0;
    const inpMs = inp?.numericValue ?? 0;
    const maxWork = Math.max(tbtMs, jsSavings, inpMs);
    const severity =
      maxWork >= 600 || isPoorCategory(fieldInpCategory)
        ? "high"
        : severityFromMs(maxWork, 200, 420);
    pushDiagnosis(
      drafts,
      "js-main-thread",
      "Main-thread JavaScript pressure",
      severity,
      impactFromSavingsMs(maxWork),
      [
        tbt?.displayValue ? `Lab Total Blocking Time: ${tbt.displayValue}.` : null,
        inp?.displayValue ? `Lab INP audit: ${inp.displayValue}.` : null,
        jsSavings > 0 ? `JS-related opportunities suggest ~${jsSavings}ms potential savings.` : null,
      ],
      [
        "Split large bundles and defer non-critical hydration/work.",
        "Remove unused/legacy JS and delay third-party boot cost.",
        "Break long tasks into smaller chunks and offload heavy computation to workers.",
      ],
      Math.min(150, Math.round(maxWork / 10)),
    );
  }

  if (imageSavings >= 250) {
    const severity = imageSavings >= 1200 ? "high" : imageSavings >= 500 ? "medium" : "low";
    pushDiagnosis(
      drafts,
      "image-payload",
      "Heavy image payload",
      severity,
      impactFromSavingsMs(imageSavings),
      [imageSavings > 0 ? `Image-related opportunities suggest ~${imageSavings}ms potential savings.` : null],
      [
        "Serve modern formats (AVIF/WebP) and right-size responsive variants.",
        "Lazy-load below-the-fold images and compress aggressively.",
        "Preload only the single critical hero image used for LCP.",
      ],
      Math.min(130, Math.round(imageSavings / 8)),
    );
  }

  if (cacheSavings >= 200) {
    const severity = cacheSavings >= 1200 ? "high" : "medium";
    pushDiagnosis(
      drafts,
      "cache-policy",
      "Weak static caching policy",
      severity,
      impactFromSavingsMs(cacheSavings),
      [cacheSavings > 0 ? `Caching opportunity indicates ~${cacheSavings}ms potential savings.` : null],
      [
        "Use long-lived immutable cache headers for versioned static assets.",
        "Move cacheable assets to a CDN with edge cache and compression enabled.",
      ],
      Math.min(90, Math.round(cacheSavings / 10)),
    );
  }

  if ((cls?.numericValue ?? 0) >= 0.1 || isPoorCategory(fieldClsCategory) || isNeedsImprovementCategory(fieldClsCategory)) {
    const clsValue = cls?.numericValue ?? 0;
    const severity = clsValue >= 0.25 || isPoorCategory(fieldClsCategory) ? "high" : "medium";
    pushDiagnosis(
      drafts,
      "layout-instability",
      "Layout instability (CLS)",
      severity,
      severity === "high" ? "medium" : "low",
      [
        cls?.displayValue ? `Lab CLS: ${cls.displayValue}.` : null,
        fieldClsCategory ? `Field CLS category: ${fieldClsCategory}.` : null,
      ],
      [
        "Reserve dimensions for media/ads/embeds and avoid inserting content above existing content.",
        "Use stable font loading (`font-display: swap`) and prevent late style/layout shifts.",
      ],
      Math.min(70, Math.round(clsValue * 500)),
    );
  }

  if (thirdPartySavings >= 300) {
    const severity = thirdPartySavings >= 1000 ? "high" : "medium";
    pushDiagnosis(
      drafts,
      "third-party-overhead",
      "Third-party script overhead",
      severity,
      impactFromSavingsMs(thirdPartySavings),
      [`Third-party summary audit suggests ~${thirdPartySavings}ms potential savings.`],
      [
        "Delay non-critical tags until after first input/idle.",
        "Remove low-value tags and load remaining tags asynchronously.",
        "Host critical third-party assets with better caching where contracts allow.",
      ],
      Math.min(100, Math.round(thirdPartySavings / 12)),
    );
  }

  if (!drafts.length && perfScore != null && perfScore < 0.75) {
    pushDiagnosis(
      drafts,
      "mixed-bottlenecks",
      "Mixed bottlenecks detected",
      "medium",
      "medium",
      [`Performance score is ${Math.round(perfScore * 100)} with no single dominant PSI opportunity.`],
      [
        "Inspect trace/waterfall artifacts to separate backend, render, and third-party costs.",
        "Run repeated tests (same URL/device/network) and optimize the largest stable bottlenecks first.",
      ],
      40,
    );
  }

  drafts.sort((a, b) => b.score - a.score);
  return drafts.map((d) => d.item).slice(0, 5);
}
