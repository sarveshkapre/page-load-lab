# Clone Feature Tracker

## Context Sources
- README and docs
- TODO/FIXME markers in code
- Test and build failures
- Gaps found during codebase exploration

## Candidate Features To Do

- [ ] (Selected, cycle2) PSI API key support via `PSI_API_KEY` + clearer quota/HTTP error messaging
- [ ] (Selected, cycle2) Reduce PSI quota burn: UI strategy selector (mobile/desktop/both) + server in-memory caching (short TTL)
- [ ] (Selected, cycle2) Surface per-strategy errors in UI (show Mobile/Desktop error panels instead of failing silently)
- [ ] (Selected, cycle2) Trim API payload size: exclude `raw` PSI JSON by default; opt-in with `includeRaw=1`
- [ ] (Selected, cycle2) Align app branding + navigation with repo objective (remove dead links; "Page Load Lab" metadata)
- [ ] (Selected, cycle2) Add a runnable local smoke path (`npm run smoke`) and document required env vars in README

## Implemented

## Insights

### Market Scan Notes (untrusted)
- WebPageTest positions itself around multi-step testing, filmstrips/video, and deep-waterfall style analysis; these set baseline expectations for a "full story" report. (see WebPageTest docs)  
- Lighthouse CI is commonly used for repeatable, CI-grade Lighthouse runs and report persistence/comparison. (see Lighthouse CI docs)  
- Sitespeed.io is a popular open-source option combining real-browser runs (Browsertime) with budgets and dashboards, shaping parity expectations for v2 runners. (see sitespeed.io docs)

## Notes
- This file is maintained by the autonomous clone loop.
