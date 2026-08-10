# ADR-0001: Usability standards

Date: 2026-06-29
Status: Accepted

## Context

Andrew is a principal UX designer. The portfolio is an argument for craft; the UX of the site is itself evidence. Usability is a design constraint from the first component, not a checklist item at the end of a build.

The site's primary audience is hiring managers and design leaders evaluating portfolio candidates. They navigate with intention and notice friction immediately. A site that describes good UX but doesn't embody it fails the argument.

The audit of the existing site found failures that existed because no usability standard was applied during the original build: auto-playing carousel with no pause mechanism, color-only nav active states, missing skip-to-content link. These are carried forward as known debt and are P0/P1 items in the new build.

## Decision

### Evaluation framework

Nielsen's 10 usability heuristics are the lens for design review. Every significant new feature gets a usability review at the shape stage, before code, not after. Shape-stage reviews are cheaper to correct and prevent the most common class of rework.

### What is automated

**Lighthouse, run in CI,** evaluates the following thresholds on every deployment. ADR-0012 supersedes this ADR's original requirement that every absolute LCP failure block shared-runner CI; the 2.5s value remains the production p75 objective while CI uses a same-runner relative LCP gate:

- Performance score ≥ 90
- LCP ≤ 2.5s (maps to heuristic 1: visibility of system status — a slow response is invisible feedback)
- CLS ≤ 0.1 (maps to heuristic 4: consistency and standards — layout shifts disrupt the reading context mid-task)
- INP ≤ 200ms
- Best Practices score ≥ 90
- SEO score ≥ 90

**Custom Playwright assertions** check hygiene signals not covered by Lighthouse or axe-core:

- Every page has a descriptive, unique `<title>`
- Forms preserve user input on failed validation (heuristic 3: user control and freedom)
- Error messages are present, clearly worded, and associated with their inputs (heuristic 9)

### What requires human judgment

The majority of heuristics require judgment about context, user intent, and mental models that no tool can substitute for:

- Information architecture and task flow coherence
- Mental model alignment: whether patterns are conventional enough to be learnable without instruction (heuristic 6: recognition rather than recall)
- Error message clarity and tone beyond structural presence
- Voice and tone consistency
- Aesthetic minimalism (heuristic 8)
- Flexibility for both first-time and returning visitors (heuristic 7)

These are evaluated at the shape stage, not by a CI gate.

## Alternatives considered

**Commercial automated heuristic evaluation tools.** Several tools claim to score UX heuristics automatically. In practice, they produce too many false positives on legitimate patterns and miss the issues that matter most. Not reliable enough as CI gates.

**Deferred usability review after build.** This is how the existing site was built. The known P0/P1 issues are the result. Shape-stage review — heuristic evaluation before code is written — prevents the most expensive class of rework.

## Consequences

- Lighthouse is added to the CI pipeline alongside Vitest and Playwright. See ADR-0010.
- Custom Playwright assertions run usability hygiene checks on every page route. See ADR-0010.
- Any PR that regresses a blocking Lighthouse measurement fails CI. ADR-0012 defines the relative LCP regression budget; the other absolute thresholds remain blocking.
- No component or pattern is considered done until it has been reviewed against the relevant heuristics. Keyboard navigation and error state behavior are part of that review, covered by ADR-0002.
