# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do

Scoring (1-5 each): impact, effort (lower is better), strategic fit, differentiation, risk (lower is better), confidence.

Cycle 3 selection (execute this session):
- [ ] Add basic CI workflow (lint + build + smoke) with secrets-free default behavior
  Score: impact 5, effort 2, fit 5, diff 2, risk 1, confidence 5
- [ ] Compare runs (before/after) with persisted run IDs and diffed opportunities/metrics (local-only v1)
  Score: impact 5, effort 3, fit 5, diff 4, risk 2, confidence 4
- [ ] Add export/share: download JSON report for a run (shareable link later)
  Score: impact 3, effort 1, fit 4, diff 2, risk 1, confidence 5

Backlog (not selected this session):
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

- [x] 2026-02-10: PSI v1 hardening and UX fixes (key support, strategy selector, caching, clearer errors, smaller payloads, branding alignment)  
  Evidence: `src/app/api/pageload/route.ts`, `src/app/page.tsx`, `src/lib/safeFetch.ts`, `src/app/layout.tsx`, `README.md`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke` (accepts `HTTP 429` when no `PSI_API_KEY`)  
  Commits: `2f231dd`, `515acea`
- [x] 2026-02-10: Targeted cleanup (shared response types, deduped hint strings, stronger smoke assertions; removed dead export)  
  Evidence: `src/lib/pageloadTypes.ts`, `src/app/api/pageload/route.ts`, `src/app/page.tsx`, `src/lib/ip.ts`, `scripts/smoke.mjs`  
  Verification: `npm run lint`, `npm run build`, `npm run smoke`  
  Commits: `eb70c0a`, `dcaa7af`

## Insights

### Market Scan Notes (untrusted)
- WebPageTest positions itself around multi-step testing, filmstrips/video, and deep-waterfall style analysis; these set baseline expectations for a "full story" report: `https://docs.webpagetest.org/`
- Lighthouse CI is commonly used for repeatable, CI-grade Lighthouse runs and report persistence/comparison: `https://github.com/GoogleChrome/lighthouse-ci`
- Sitespeed.io is a popular open-source option combining real-browser runs (Browsertime) with budgets and dashboards, shaping parity expectations for v2 runners: `https://www.sitespeed.io/`

## Notes
- This file is maintained by the autonomous clone loop.
