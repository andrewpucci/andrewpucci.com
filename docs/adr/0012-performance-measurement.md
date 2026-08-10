# ADR-0012: Performance measurement uses field targets and relative CI gates

Date: 2026-08-06
Status: Accepted

## Context

ADR-0001 set LCP ≤2.5s as both a usability objective and an absolute Lighthouse CI gate. That combined two different measurements. The Core Web Vitals threshold describes the 75th percentile of real visits, while Lighthouse is one synthetic profile on one machine. Chrome's Lighthouse variability guidance specifically identifies free and burstable CI runners as a noisy environment and recommends repeated samples and aggregate assertions.

Five-run medians reduced the noise but did not remove runner-to-run variation. The home route could fail just above 2.5s in GitHub Actions while the same build was substantially faster locally, and traces showed no corresponding application regression. Raising the threshold would hide real regressions; repeatedly tuning the page against a shared runner would optimize for the runner rather than visitors.

## Decision

Separate the user-facing target from the pull-request regression gate:

- **Production objective:** LCP remains ≤2.5s at p75, evaluated separately for mobile and desktop using production real-user data from Cloudflare Web Analytics or CrUX when sufficient traffic is available. CLS ≤0.1 and INP ≤200ms remain production Core Web Vitals objectives.
- **Absolute synthetic gates:** Lighthouse performance, best-practices, and SEO scores remain ≥90. CLS remains ≤0.1 and TBT, the lab proxy for INP, remains ≤200ms. These failures continue to block CI.
- **Relative synthetic LCP gate:** CI audits the current commit and its pull-request base, or the preceding commit on a main-branch push, on the same GitHub-hosted runner. Each route runs five times serially and uses Lighthouse's median-run selection. CI fails when the current LCP exceeds the base LCP by more than 10%, with a minimum 250ms allowance for measurement and content variance.
- **Absolute synthetic LCP result:** Lighthouse still reports the 2.5s target, but crossing it is advisory in shared-runner CI. It is diagnostic evidence, not the field assessment.
- **Artifacts:** Both sets of Lighthouse reports and their summaries are retained for seven days so a regression can be inspected.

The relative allowance is `max(250ms, base LCP × 10%)`. The fixed floor avoids treating small timing differences as product regressions; the percentage prevents the allowance from becoming disproportionately strict on slower routes. This budget still caught a 370ms cross-route regression during its initial validation and led to narrowing CSS inlining from 12KB to 1KB.

## Alternatives considered

**Keep the absolute 2.5s gate on GitHub-hosted runners.** This is simple but conflates a field percentile with a noisy lab sample. Repeated false failures had already made the gate unreliable.

**Raise the absolute CI threshold.** A looser number would reduce failures without distinguishing environmental variance from an actual regression. It would also silently redefine the user-facing standard.

**Commit a synthetic baseline file.** This is cheaper than rebuilding the base commit, but comparisons would span different runners and grow stale unless updated manually. Building both revisions on one runner controls more of the environment and requires no baseline-update ceremony.

**Use a dedicated performance runner or hosted lab.** This is the preferred way to restore an absolute synthetic gate if one is required later, but it adds infrastructure and cost that are not justified for this portfolio site today.

## Consequences

- Lighthouse runs in a separate performance job and no longer extends the unit/Storybook job's critical path.
- The performance job builds and audits two revisions, increasing compute time in exchange for a substantially more comparable signal.
- A first push with no resolvable preceding commit can collect current reports but must skip the relative comparison. Normal pull requests always have a base commit.
- A material improvement becomes the next comparison baseline automatically after merge; no committed performance snapshot needs maintenance.
- Production p75 data must be reviewed separately. Passing CI does not by itself prove the production Core Web Vitals objective is met.
- This ADR supersedes ADR-0001 and ADR-0010 only where they describe absolute Lighthouse LCP as a merge gate. Their other usability and testing decisions remain accepted.
