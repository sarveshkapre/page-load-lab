# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do

Scoring (1-5 each): impact, effort (lower is better), strategic fit, differentiation, risk (lower is better), confidence.

Backlog:
- [ ] Add a v2 Playwright runner skeleton: trace + HAR artifacts + basic waterfall extraction
  Score: impact 5, effort 4, fit 5, diff 5, risk 3, confidence 3
- [ ] Improve "why slow?" engine: rule-based reasons mapped from PSI audits/CrUX (with evidence + expected impact)
  Score: impact 4, effort 3, fit 5, diff 4, risk 2, confidence 3
- [ ] Add request waterfall visualization (v2) and screenshot/filmstrip integration
  Score: impact 4, effort 4, fit 5, diff 4, risk 3, confidence 3
- [ ] Add multi-run mode (N repeats; median + variability) and make compare runs robust against noise
  Score: impact 4, effort 4, fit 4, diff 4, risk 2, confidence 3
- [ ] Add saved artifacts folder convention (runs stored locally under `runs/` ignored by git) and UI import
  Score: impact 3, effort 3, fit 4, diff 3, risk 1, confidence 4

## Implemented

- [x] 2026-02-10: Add secrets-free CI workflow (lint + build + smoke)
  Evidence: `.github/workflows/ci.yml`
  Verification: `npm run lint`, `npm run build`, `npm run smoke`
  Commits: `ed96a07`
- [x] 2026-02-10: Save runs locally + compare A vs B + download JSON exports
  Evidence: `src/app/page.tsx`, `README.md`
  Verification: `npm run lint`, `npm run build`, `npm run smoke`
  Commits: `259888e`
- [x] 2026-02-10: PSI v1 hardening and UX fixes (key support, strategy selector, caching, clearer errors, smaller payloads, branding alignment)  
  Evidence: `src/app/api/pageload/route.ts`, `src/app/page.tsx`, `src/lib/safeFetch.ts`, `src/app/layout.tsx`, `README.md`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke` (accepts `HTTP 429` when no `PSI_API_KEY`)  
  Commits: `2f231dd`, `515acea`
- [x] 2026-02-10: Targeted cleanup (shared response types, deduped hint strings, stronger smoke assertions; removed dead export)  
  Evidence: `src/lib/pageloadTypes.ts`, `src/app/api/pageload/route.ts`, `src/app/page.tsx`, `src/lib/ip.ts`, `scripts/smoke.mjs`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke`  
  Commits: `eb70c0a`, `dcaa7af`
- [x] 2026-02-10: Extract browser-only helpers (saved runs + JSON download) and harden smoke with `/` check + fetch timeouts  
  Evidence: `src/lib/client/savedRuns.ts`, `src/lib/client/download.ts`, `src/app/page.tsx`, `scripts/smoke.mjs`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke`  
  Commits: `48bff3d`
- [x] 2026-02-10: Prune expired entries from the in-memory rate-limit map (avoid unbounded growth in long-lived processes)  
  Evidence: `src/app/api/pageload/route.ts`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke`  
  Commits: `16f3968`

## Insights

### Market Scan Notes (untrusted)
- WebPageTest positions itself around multi-step testing, filmstrips/video, and deep-waterfall style analysis; these set baseline expectations for a "full story" report: `https://docs.webpagetest.org/`
- WebPageTest scripting docs reinforce parity expectations for v2 runners (multi-step flows, login, custom actions): `https://docs.webpagetest.org/scripting/`
- Lighthouse CI is commonly used for repeatable, CI-grade Lighthouse runs and report persistence/comparison: `https://github.com/GoogleChrome/lighthouse-ci`
- Lighthouse CI docs highlight a common baseline: collect Lighthouse reports, upload/store, and assert budgets in CI: `https://github.com/GoogleChrome/lighthouse-ci/blob/main/docs/getting-started.md`
- Sitespeed.io is a popular open-source option combining real-browser runs (Browsertime) with budgets and dashboards, shaping parity expectations for v2 runners: `https://www.sitespeed.io/`
- Sitespeed/Browsertime emphasizes real-browser artifacts (HAR, video/visual metrics, traces) as a baseline expectation for runner v2: `https://www.sitespeed.io/documentation/browsertime/`

## Notes
- This file is maintained by the autonomous clone loop.
