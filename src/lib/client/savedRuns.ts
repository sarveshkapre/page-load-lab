"use client";

import type { PageLoadResponse, PsiError, PsiSummary } from "@/lib/pageloadTypes";

export type SavedRun = {
  id: string;
  createdAt: string;
  url: string;
  strategy: "mobile" | "desktop" | "both";
  data: PageLoadResponse;
};

const RUNS_KEY = "pll:savedRuns:v1";
export const RUNS_MAX = 20;

function safeParseJson<T>(text: string): T | null {
  try {
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

function isSummary(x: PsiSummary | PsiError): x is PsiSummary {
  return typeof x === "object" && x != null && "perfScore" in x;
}

function stripRawFromResult(x: PsiSummary | PsiError): PsiSummary | PsiError {
  if (!isSummary(x)) return x;
  // Avoid persisting huge payloads if someone later adds includeRaw.
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { raw, ...rest } = x;
  return rest;
}

export function stripRawFromResponse(r: PageLoadResponse): PageLoadResponse {
  return {
    ...r,
    mobile: r.mobile ? stripRawFromResult(r.mobile) : null,
    desktop: r.desktop ? stripRawFromResult(r.desktop) : null,
  };
}

export function loadSavedRuns(): SavedRun[] {
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

export function persistSavedRuns(runs: SavedRun[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(RUNS_KEY, JSON.stringify(runs.slice(0, RUNS_MAX)));
  } catch {
    // Ignore quota / serialization failures; saved runs are a convenience.
  }
}

