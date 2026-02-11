# Project Memory

## Objective
- Ship a page load profiler (PSI v1; Playwright runner v2). See plan.md.

## Architecture Snapshot
- Next.js (App Router) UI at `/` with a single URL input and PSI-derived summaries.
- Server route `GET /api/pageload` calls PageSpeed Insights v5 and returns a trimmed, UI-friendly payload.
- Local reliability helpers: `src/lib/safeFetch.ts` (timeouts + safe JSON fetch), short in-memory caching + rate limiting (best-effort).
- Client-only helpers: `src/lib/client/*` for localStorage-backed saved runs and JSON downloads (keeps `src/app/page.tsx` smaller).

## Open Problems
- PSI quota frequently returns `HTTP 429` without `PSI_API_KEY`; smoke validates response-shape + graceful handling, not successful PSI runs.
- Diagnosis quality still depends on PSI audit coverage; runner v2 artifacts are still needed for request-level and CPU trace-backed attribution.

## Recent Decisions
- Template: YYYY-MM-DD | Decision | Why | Evidence (tests/logs) | Commit | Confidence (high/medium/low) | Trust (trusted/untrusted)
- 2026-02-10 | Add `PSI_API_KEY` support + strategy selector + short TTL cache + better error propagation | Reduce quota burn and fix silent failures when PSI errors | `npm run smoke` returns well-formed response even when PSI is quota-limited | 2f231dd, 515acea | high | trusted
- 2026-02-10 | Add `npm run smoke` + `.env.example` and allow committing `.env.example` | Ensure a runnable local verification path and document env expectations | `npm run smoke` prints `smoke ok` | 515acea | high | trusted
- 2026-02-10 | Centralize API/UI response types in `src/lib/pageloadTypes.ts` and tighten PSI route/smoke assertions | Reduce type drift and strengthen local verification without behavior change | `npm run lint`, `npm run build`, `npm run smoke` | eb70c0a, dcaa7af | high | trusted
- 2026-02-10 | Add secrets-free GitHub Actions CI (lint/build/smoke) | Catch regressions on main without requiring `PSI_API_KEY` | Local `npm run lint`, `npm run build`, `npm run smoke` | ed96a07 | high | trusted
- 2026-02-10 | Add local saved runs + A/B compare + JSON exports in UI | Unlock “before/after” workflows without backend persistence | `npm run lint`, `npm run build`, `npm run smoke` | 259888e | medium | trusted
- 2026-02-10 | Extract browser-only helpers from `src/app/page.tsx` and harden smoke (check `/` + fetch timeouts) | Improve readability and reduce risk of smoke hangs while keeping behavior the same | `npm run lint`, `npm run build`, `npm run smoke` | 48bff3d | high | trusted
- 2026-02-10 | Prune expired entries from the in-memory rate-limit map | Avoid unbounded memory growth in long-lived processes; semantics unchanged for active windows | `npm run lint`, `npm run build`, `npm run smoke` | 16f3968 | high | trusted
- 2026-02-11 | Add `buildWhySlowDiagnoses` rule engine (PSI audits + CrUX) and include ranked diagnosis reasons in API/UI payloads | Replace raw-opportunity-only UX with clearer, evidence-backed root-cause guidance | `npm run lint`, `npm run build`, `npm run smoke` | 152f297 | high | trusted
- 2026-02-11 | Add 20s client fetch timeout and explicit timeout error; enforce diagnosis schema checks in smoke script | Prevent hung "Run test" UX and catch payload regressions early | `npm run lint`, `npm run build`, `npm run smoke` | 152f297 | high | trusted
- 2026-02-11 | Prioritize runner v2 artifact work (trace/waterfall/filmstrip parity) as next strategic milestone | Market scan baseline across WebPageTest, DebugBear, SpeedCurve, Lighthouse CI, and Sitespeed consistently emphasizes artifact-rich repeatable diagnostics | `CLONE_FEATURES.md` market scan links | no-code-docs | medium | untrusted

## Mistakes And Fixes
- Template: YYYY-MM-DD | Issue | Root cause | Fix | Prevention rule | Commit | Confidence
- 2026-02-10 | Build failed after API refactor (TypeScript narrowing in nested closure) | TS control-flow narrowing does not carry into nested functions reliably | Hoisted `targetUrl` to a narrowed constant | Prefer narrowing into primitives (`const targetUrl = ...`) before nested helpers | 2f231dd | medium
- 2026-02-10 | GitHub Actions CI hung on `npm run smoke` | Smoke script didn't reliably terminate the dev server process tree in CI | Spawn dev server in its own process group + SIGTERM then SIGKILL fallback | Smoke checks must have a hard shutdown path (process-group kill + timeout) | 5b4c202 | high

## Known Risks
- In-memory caching/rate-limit is best-effort and may not hold across serverless instances; treat it as UX smoothing, not enforcement.
- Rule-based diagnoses can over/under-attribute if PSI audits are sparse for a given URL; interpret as ranked hypotheses, not proof.

## Next Prioritized Tasks
- Add a v2 Playwright runner skeleton (trace/HAR artifacts) and basic waterfall extraction.
- Add request waterfall visualization and screenshot/filmstrip integration using runner v2 artifacts.
- Add multi-run (N repeats + median/variance) and CI-friendly performance budget assertions.

## Verification Evidence
- Template: YYYY-MM-DD | Command | Key output | Status (pass/fail)
- 2026-02-10 | `npm ci` | installed dependencies; 0 vulnerabilities | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` (no `PSI_API_KEY`) | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` | pass
- 2026-02-11 | `npm run lint` | eslint clean | pass
- 2026-02-11 | `npm run build` | Next build successful (route includes `/api/pageload`) | pass
- 2026-02-11 | `npm run smoke` | `smoke ok: HTTP 429` | pass
- 2026-02-11 | `gh run list --limit 10 --json databaseId,headSha,status,conclusion,name,workflowName,createdAt,updatedAt,displayTitle` | run `21894128370` for `152f297` completed with `"conclusion":"success"` | pass
- 2026-02-11 | `gh run watch 21894147619 --exit-status` | workflow `ci` for `2b3a541` finished successfully (build job passed lint/build/smoke) | pass
- 2026-02-10 | `gh run view 21866084918 --json status,conclusion` | `"status":"completed","conclusion":"success"` | pass
- 2026-02-10 | `gh run view 21866189563 --json status,conclusion` | `"status":"completed","conclusion":"success"` | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` | pass
- 2026-02-10 | `npm run lint` | eslint clean | pass
- 2026-02-10 | `npm run build` | Next build successful | pass
- 2026-02-10 | `npm run smoke` | `smoke ok: HTTP 429` | pass

## Historical Summary
- Keep compact summaries of older entries here when file compaction runs.
