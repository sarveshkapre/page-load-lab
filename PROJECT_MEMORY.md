# Project Memory

## Objective
- Ship a page load profiler (PSI v1; Playwright runner v2). See plan.md.

## Architecture Snapshot
- Next.js (App Router) UI at `/` with a single URL input and PSI-derived summaries.
- Server route `GET /api/pageload` calls PageSpeed Insights v5 and returns a trimmed, UI-friendly payload.
- Local reliability helpers: `src/lib/safeFetch.ts` (timeouts + safe JSON fetch), short in-memory caching + rate limiting (best-effort).

## Open Problems
- PSI quota frequently returns `HTTP 429` without `PSI_API_KEY`; smoke validates response-shape + graceful handling, not successful PSI runs.

## Recent Decisions
- Template: YYYY-MM-DD | Decision | Why | Evidence (tests/logs) | Commit | Confidence (high/medium/low) | Trust (trusted/untrusted)
- 2026-02-10 | Add `PSI_API_KEY` support + strategy selector + short TTL cache + better error propagation | Reduce quota burn and fix silent failures when PSI errors | `npm run smoke` returns well-formed response even when PSI is quota-limited | 2f231dd, 515acea | high | trusted
- 2026-02-10 | Add `npm run smoke` + `.env.example` and allow committing `.env.example` | Ensure a runnable local verification path and document env expectations | `npm run smoke` prints `smoke ok` | 515acea | high | trusted
- 2026-02-10 | Centralize API/UI response types in `src/lib/pageloadTypes.ts` and tighten PSI route/smoke assertions | Reduce type drift and strengthen local verification without behavior change | `npm run lint`, `npm run build`, `npm run smoke` | eb70c0a, dcaa7af | high | trusted
- 2026-02-10 | Add secrets-free GitHub Actions CI (lint/build/smoke) | Catch regressions on main without requiring `PSI_API_KEY` | Local `npm run lint`, `npm run build`, `npm run smoke` | ed96a07 | high | trusted
- 2026-02-10 | Add local saved runs + A/B compare + JSON exports in UI | Unlock “before/after” workflows without backend persistence | `npm run lint`, `npm run build`, `npm run smoke` | 259888e | medium | trusted

## Mistakes And Fixes
- Template: YYYY-MM-DD | Issue | Root cause | Fix | Prevention rule | Commit | Confidence
- 2026-02-10 | Build failed after API refactor (TypeScript narrowing in nested closure) | TS control-flow narrowing does not carry into nested functions reliably | Hoisted `targetUrl` to a narrowed constant | Prefer narrowing into primitives (`const targetUrl = ...`) before nested helpers | 2f231dd | medium

## Known Risks
- In-memory caching/rate-limit is best-effort and may not hold across serverless instances; treat it as UX smoothing, not enforcement.

## Next Prioritized Tasks
- Add a v2 Playwright runner skeleton (trace/HAR artifacts) and basic waterfall extraction.
- Improve "why slow?" reasoning by mapping PSI audits/CrUX into a smaller set of concrete, evidence-backed causes.
- Add shareable links for saved runs (likely needs persistence or signed storage).

## Verification Evidence
- Template: YYYY-MM-DD | Command | Key output | Status (pass/fail)
- 2026-02-10 | `npm ci` | installed dependencies; 0 vulnerabilities | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` (no `PSI_API_KEY`) | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` | pass

## Historical Summary
- Keep compact summaries of older entries here when file compaction runs.
