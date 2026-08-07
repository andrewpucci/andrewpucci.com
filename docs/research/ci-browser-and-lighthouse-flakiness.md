# CI browser-server and Lighthouse flakiness research

Researched 2026-08-05 against Cloudflare and Chrome primary sources. This
note covers the CI failures observed on this branch: `wrangler pages dev`
ending with `ProxyController: Error inside ProxyWorker` / `Network connection
lost`, followed by Playwright `ECONNREFUSED`; and intermittent Lighthouse CLS
budget failures on GitHub-hosted runners.

## Wrangler Pages development server

This is a known Wrangler regression, not a failure that splitting Playwright
projects can cure. Cloudflare's open [workers-sdk #14926][wrangler-14926]
reproduces the same sequence with `wrangler pages dev` as Playwright's
`webServer` in Linux CI: a workerd connection is lost, Miniflare restarts the
runtime, and Wrangler treats `ProxyController: Error inside ProxyWorker` as
fatal instead of restoring the proxy. The remaining Playwright requests then
fail with `ECONNREFUSED`.

The report identifies Wrangler 4.114–4.115 as affected and documents an exact
pin to 4.113.0 as the working workaround. Its proposed product fix is for
Wrangler to handle runtime restart rather than terminate the proxy. A second
open report, [workers-sdk #15002][wrangler-15002], records intermittent
`Network connection lost` and fetch failures on GitHub-hosted Ubuntu runners
through 4.118.0, with 4.113.0 clean. This project currently resolves 4.118.0,
so it is in the reported affected range.

Cloudflare has also documented a related loopback keep-alive race in
[workers-sdk #14848][wrangler-14848] and fixed it in
[workers-sdk #14850][wrangler-14850]. That fix does not supersede the later
Pages/ProxyController regression above; the reports distinguish them.

Recommended order:

1. Pin the E2E server's `wrangler` dependency exactly to `4.113.0` until
   #14926 is fixed. This directly addresses the observed CI signature. Review
   the pin when a Cloudflare release explicitly closes or fixes that issue.
2. Keep a Playwright retry as a secondary guard only. It can help the
   recoverable drops reported in #15002, but cannot recover after the server
   process exits.
3. Splitting the suite/specs into shorter server lifetimes reduces the chance
   of encountering the bug, but increases CI time and is not a root-cause fix.
4. For higher-confidence deployment coverage, point browser E2E at a deployed
   Pages preview. This removes local Miniflare from that job, at the cost of
   deploy credentials, external-service coordination, and slower feedback.

For Worker/Pages-function integration tests, Cloudflare recommends its
[Workers Vitest integration][workers-vitest] over direct Miniflare use. It
runs locally with Miniflare, but it is a complement to browser E2E—not a
replacement for end-to-end rendered-page coverage.

## Lighthouse CLS and performance variability

Chrome's [Lighthouse variability guide][lighthouse-variability] says scores
can change without a code change because of page/network/server variation,
client hardware and resource contention, and browser nondeterminism. It calls
out free/burstable CI as particularly volatile. The guide advises:

1. Use a fixed page version, localhost, and no third-party or random
   page behaviour during the audit.
2. Run exactly one Lighthouse audit at a time on the machine—concurrent runs
   distort results through contention.
3. Prefer adequate/dedicated runners for blocking performance budgets.
4. Run multiple samples and assert an aggregate. Chrome says the median of
   five runs is twice as stable as one run, and the Lighthouse source exposes
   `computeMedianRun` for Node consumers.

Applied here, the test already uses localhost and audits routes serially, but
one browser process and one sample per route leave it exposed to the
GitHub-hosted runner's variability. The first deterministic improvement should
be to collect several serial samples per route, select the median using
Lighthouse's own median-run helper, and retain/upload the result data for a
failing run. Do not loosen the CLS threshold before inspecting the failing
report's `layout-shift-elements` audit: persistent CLS is a product defect;
one-off CI variance is a measurement problem.

Lighthouse CI documents `numberOfRuns` and aggregation methods, but this
repository intentionally does not depend on `@lhci/cli` (see the comment in
`scripts/lighthouse.mjs`). The same aggregation can be implemented with the
installed `lighthouse` Node API, avoiding that dependency decision.

## Decision

Pin Wrangler to 4.113.0 before another CI run. It is the only remedy directly
recommended by Cloudflare's open issue that matches the exact Pages dev +
Playwright + Linux CI failure. Independently make the existing direct
Lighthouse script use multiple serial samples and Lighthouse's median
selection; retain the existing CLS budget until its report identifies a real
layout shift.

[wrangler-14926]: https://github.com/cloudflare/workers-sdk/issues/14926
[wrangler-15002]: https://github.com/cloudflare/workers-sdk/issues/15002
[wrangler-14848]: https://github.com/cloudflare/workers-sdk/issues/14848
[wrangler-14850]: https://github.com/cloudflare/workers-sdk/pull/14850
[workers-vitest]: https://developers.cloudflare.com/workers/testing/vitest-integration/
[lighthouse-variability]: https://github.com/GoogleChrome/lighthouse/blob/main/docs/variability.md
