# Page Load Lab: plan

Build a “single URL in, full story out” profiler.

## Core UX

- One input: URL.
- Output: a timeline + a ranked “biggest causes of slowness” list with concrete fixes.
- Compare runs mode (before/after, different locations/devices) later.

## What it measures (target spec)

- Navigation timing: DNS, TCP, TLS, TTFB, download, DOMContentLoaded, load, LCP/INP/CLS.
- Full request waterfall: every request, headers, size, cache, timing.
- Render blockers: CSS/JS blocking, main-thread long tasks, unused JS/CSS, layout shifts.
- Third-party impact: tag managers, analytics, ads.
- Fonts/images: font loading strategy, image formats and sizes.
- Caching/CDN: cache-control, etag, age, CDN headers, compression (br/gzip), HTTP/2 or HTTP/3, QUIC.
- Security/transport: TLS version/ciphers, HSTS, cert chain issues, mixed content.

## “Why is this slow?” engine (target spec)

- A rules/scoring layer translating metrics into reasons:
  - TTFB high: origin slow, missing CDN, backend latency, cold starts.
  - DNS slow: no local resolver, too many lookups, missing preconnect.
  - TLS slow: no session resumption, handshake retries, chain issues.
  - Render blocked: large sync JS, CSS not split, fonts blocking.
  - Payload heavy: unoptimized images, huge JS bundles, no compression.
- Each reason links to: evidence + recommended fixes + expected impact.

## V1 implementation in this repo

- Uses PageSpeed Insights API via `/api/pageload`.
- UI renders key metrics and top opportunities.

## V2+

- Add real-browser tracing (Playwright) for waterfall + CPU timeline.
- Add multi-region runners and saved artifacts (HAR/trace) in object storage.
