# Page Load Lab

Page performance profiler: URL in -> Core Web Vitals + ranked “why slow?” opportunities.

See `plan.md` for the full spec and roadmap.

## Env

- Optional: `PSI_API_KEY` (recommended). Without an API key, PageSpeed Insights often hits `HTTP 429` quota limits.

## Run

```bash
npm install
npm run dev
```

## Smoke

```bash
npm run smoke
```

## UI Notes

- Use "Save run" to persist runs locally (localStorage) and compare A vs B.
- Use "Download JSON" to export the latest run payload.
- Each successful profile now includes ranked likely causes with severity, expected impact, evidence, and suggested fixes.
- Frontend run requests timeout after 20s with a clear retry hint.

## Build

```bash
npm run lint
npm run build
```
