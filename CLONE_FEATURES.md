# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do

- [ ] Compare runs (before/after) with persisted run IDs and diffed opportunities/metrics
- [ ] Add a v2 Playwright runner skeleton: trace + HAR artifacts + basic waterfall extraction
- [ ] Add export/share: download JSON report + shareable link (later: signed URL)
- [ ] Improve "why slow?" engine: rule-based reasons mapped from PSI audits/CrUX (with evidence + expected impact)
- [ ] Add basic CI workflow (lint + build + smoke) with secrets-free default behavior
- [ ] Add request waterfall visualization (v2) and screenshot/filmstrip integration

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
