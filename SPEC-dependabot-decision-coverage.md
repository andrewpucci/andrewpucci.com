# Spec: Dependabot Decision Coverage — 2026-09-07

**Status:** Approved for implementation — 2026-09-07

## Objective

Help the maintainer make a supported decision about a grouped Dependabot pull
request without implying that unresearched lockfile entries are safe. The review
must account for every changed dependency, reduce mechanically related updates
to meaningful decision units, and put the maintainer's next action before
supporting detail.

Coverage answers whether the workflow has accounted for an update and selected
the right decision unit. It is distinct from the upstream evidence needed to
recommend an upgrade. A failed lockfile grouping therefore becomes a bounded
standalone review unit when its lifecycle facts are complete; it is not, by
itself, an external-research task.

This is advisory decision support. GitHub CI and dependency-policy gates remain
separate and are not restated in the managed comment.

## Tech stack

Node.js ESM action scripts, the existing GitHub REST contents API, public npm
registry package metadata, npm `package-lock.json` v3 parsing, validated
Mistral responses, and Vitest. No new dependency, secret, checkout, subprocess,
or workflow permission is required.

## Commands

```sh
npm test -- .github/actions-scripts/dependabot-review/coverage.test.ts \
  .github/actions-scripts/dependabot-review/batches.test.ts \
  .github/actions-scripts/dependabot-review/reporting.test.ts
npm run lint
npm run check
npm test
npm run build

# Manual decision-document regression check; prints Markdown only.
npm run dependabot:review:dry-run -- 271
```

## Project structure

```text
CAPABILITY-MAP-dependabot-decision-coverage.md              approved module boundaries
SPEC-dependabot-decision-coverage.md                        this specification
.github/actions-scripts/dependabot-review/
  inputs.mjs                                                immutable manifest/lockfile metadata retrieval
  coverage.mjs                                              deterministic coverage grouping
  coverage.test.ts                                         grouping and completeness tests
  batches.mjs                                               bounded group analysis and verdict aggregation
  schema.mjs                                                validated coverage and verdict contract
  reporting.mjs                                             maintainer-facing Markdown
  handoff.mjs                                               deterministic external-research brief renderer
  handoff.test.ts                                          stale-head and source-boundary tests
```

## Code style

Use a small pure grouping function with explicit identities and stable input
order. A relationship is evidence only when it is present in the immutable
lockfile graph; never infer it from a package name, scope, version, platform
suffix, or model prose.

```js
if (memberIds.has(updateId))
  throw new TypeError('each changed update has exactly one coverage item');
```

Treat manifests, lockfiles, public-registry metadata, and all API/model data as
untrusted. Return a bounded, honest unresolved item when a graph cannot
establish a relationship. Use ESM, single quotes, and source-adjacent
`*.test.ts` tests.

## Requirements

### Coverage groups

1. Retrieve the base and immutable-head `package-lock.json` and `package.json`
   through the existing read-only GitHub contents API only when the review packet
   contains npm updates. Do not check out, install, or execute pull-request
   code.
2. Classify a direct npm update from the immutable-head manifest as production,
   development, peer, optional, or unknown. Preserve `unknown` when manifests
   are unavailable or ambiguous; never infer runtime relevance from a package
   name or lockfile location.
3. Parse only lockfile v3 package relationship data needed to connect a changed
   transitive npm update to a changed direct npm update. Track lockfile package
   paths internally: a package name/version may occur at multiple paths. If
   either lockfile is missing, malformed, unsupported, or insufficient to map
   all candidate paths to one relationship, retain the affected update as a
   standalone unresolved item.
4. Form a direct-update coverage group only when every member has one
   unambiguous dependency path to that changed direct update in the head
   lockfile. A member reachable from multiple direct updates, from no changed
   direct update, or through an ambiguous/missing path is standalone.
5. Compare the base/head lockfile `hasInstallScript` signal for every changed
   package path. When the signal changes, retrieve only the exact public npm
   metadata for the affected base/head versions, with fixed hosts, bounded
   concurrency, size limits, and no redirects. Report added, removed, or changed
   `preinstall`, `install`, and `postinstall` commands as decision-relevant
   facts. If this evidence cannot be safely retrieved or matched, the coverage
   item is unresolved.
6. Each changed update belongs to exactly one coverage item, in original review
   order. Each item names its direct anchor when it has one, retains its exact
   member count, and exposes any lifecycle-script delta. A group is an
   explanation of relationship, never a safety classification.
7. Preserve the normal review input and managed-comment lifecycle if coverage
   collection is unavailable. Represent the affected updates as unresolved;
   never drop them, suppress the comment, or use an optimistic fallback.

### Analysis and verdicts

1. Analyze a direct-update coverage group as one decision unit: the model sees
   the direct anchor's vetted upstream evidence and the group's member count.
   It returns one assessment for the group, not repetitive member assessments
   or fabricated individual research. The workflow maps that validated result
   to the group's immutable member list deterministically.
2. Analyze standalone updates as individual decision units. All analysis output
   remains validated against the unit's vetted sources, trusted context, and
   constituent package identities.
3. Add the advisory verdict `decision_incomplete`. It means one or more
   coverage items could not be assessed; it is not a merge recommendation or a
   required GitHub status.
4. Verdict precedence is `do_not_merge` > `decision_incomplete` >
   `merge_with_followups` > `merge`. A `merge` verdict is permitted only when
   every coverage item has a validated assessment and deterministic policy does
   not impose a stricter outcome.
5. An analysis failure, packet-size limit, request-budget exhaustion, or
   malformed response makes only its coverage item unresolved and yields
   `decision_incomplete` unless an independent `do_not_merge` finding exists.
   It must not discard successful assessments for other items.
6. Keep the existing deterministic policy rules, including their evidence
   limits. This capability changes only how completeness constrains the
   advisory verdict; it does not duplicate CI failure or vulnerability-gate
   reporting in the decision comment. A `merge_with_followups` conclusion is
   valid only when coverage is complete and every follow-up is explicitly marked
   non-blocking; otherwise use `decision_incomplete`. The comment renders at
   most eight follow-up decision units in deterministic analysis order,
   consolidating related actions for each unit, and provides one bounded,
   immutable-head-pinned research prompt per retained unit when the repository
   and review digest are available. Optional capability cards are omitted when
   their stated benefit requires an unconfirmed product surface or relies on a
   hypothetical future use case. Follow-up items that merely assess optional
   adoption or require creating new configuration are omitted and cannot alone
   justify a `merge_with_followups` verdict.
7. Canonicalize the validated decision packet and render a bounded
   `reviewDigest` with the immutable head SHA. A rerun for a new head SHA always
   creates a new digest and invalidates prior decision coverage. At most one
   expensive analysis runs for a PR/head pair unless a maintainer explicitly
   requests a refresh.
8. Preserve successful assessment results for unaffected coverage units and
   emit bounded diagnostics—head SHA, review digest, model/prompt version,
   coverage counts, and failure category—without raw prompts, model output,
   source excerpts, tokens, credentials, or personal data.

### Classification recovery and schema-invalid analysis

1. A manifest-declared direct update is its own direct decision anchor even
   when the root lockfile path cannot be resolved to the reported target
   version. The manifest declaration establishes ownership; the missing path
   must not manufacture a false standalone relationship.
2. A transitive update whose lockfile paths reach zero or multiple changed
   direct anchors is a standalone decision unit, not automatically unresolved.
   It remains subject to its own upstream-evidence and policy checks. The
   workflow must never claim that a direct anchor caused or individually
   researched that standalone update.
3. When base/head package paths cannot be paired, first inspect the immutable
   `hasInstallScript` flags at every known path. If none has a lifecycle-script
   signal, lifecycle coverage is complete without a registry request. If any
   does, retrieve the existing exact-version registry metadata pair and compare
   lifecycle scripts. A successful comparison resolves the fact, including a
   no-change result; an unavailable or budget-exhausted comparison remains an
   explicit incomplete unit.
4. Do not render a research handoff for a relationship-classification note. A
   handoff is reserved for a real decision-evidence gap: unavailable upstream
   evidence, an unresolved lifecycle fact, a packet limit, or an exhausted
   model analysis.
5. Send a per-request native Mistral JSON Schema in strict mode. It constrains
   the decision-unit IDs, enum values, required fields, and vetted source and
   finding identifiers. Local validation remains authoritative for cross-field
   policy, evidence, and coverage invariants.
6. Classify model failures without retaining model content: invalid JSON,
   schema cardinality, unknown evidence, unknown identity, packet limit,
   request budget, deadline, transport, HTTP, API-envelope, truncation, or
   incomplete coverage. Retry only invalid JSON or schema failures once while
   the existing request and deadline budgets allow it. A repeated structured
   failure gives that decision unit a head-pinned research brief; successful
   units and deterministic blockers remain intact.

### Comment wayfinding

1.  Begin with the advisory verdict and a plain-language next action. For
    `decision_incomplete`, say that no merge recommendation is available and
    show a short **Decision queue**.
2.  Each queue entry must identify the decision unit, its changed-update count,
    the relationship when one is known, and the concrete next action: inspect
    the cited direct-update evidence, obtain evidence for the standalone update,
    or rerun the review after correcting a transient failure. Never render a
    generic "manual review required" list or an unexplained "and N others."
3.  For a complete review, show concise coverage context—how many updates and
    decision units were assessed—without claiming group members were
    individually researched. Keep member detail collapsed or omitted when it
    does not change the decision.
4.  Render bounded provenance evidence as an advisory signal—`verified`,
    `attention_required`, or `unavailable` plus validated counts/reason—without
    treating it as a required check or giving it to the model. A human can use it
    in the decision or external-research handoff without exposing raw npm output.
5.  Preserve the existing managed-comment marker, reviewed head SHA, escaping,
    comment-size prioritization, and comment upsert behavior.

### External-research handoff

1.  For each unresolved coverage item, render an optional, copyable research
    brief in collapsed Markdown. It includes the PR URL, immutable head SHA,
    `reviewDigest`, direct anchor/member count or standalone identity, exact
    unresolved question, lifecycle/provenance facts, and vetted source URLs.
2.  The renderer, not model prose, owns the research prompt template. It must
    require read-only investigation, official/package/repository sources,
    citations, explicit acknowledgement when the specified head cannot be
    verified, and a conclusion of `merge` or `hold for review` with remaining
    uncertainty.
3.  The workflow never receives, parses, stores, or acts upon a ChatGPT, Claude,
    or other external-research response. The maintainer's native GitHub review or
    comment remains the only recorded resolution; a stale head requires a new
    brief.

## Testing strategy

Use small unit tests for graph parsing and grouping, plus focused aggregate and
renderer tests. Add a dry-run fixture that demonstrates a concise decision queue
for an incomplete grouped review.

The test suite must prove:

1. A uniquely related transitive closure becomes one direct-update coverage
   group; package-name similarity alone does not create a group.
2. Repeated name/version instances at distinct lockfile paths, ambiguous,
   orphaned, malformed, and unavailable relationships remain standalone
   unresolved items.
3. Manifest roles and lifecycle-script deltas are accurate from immutable
   base/head input; unavailable registry metadata makes the affected item
   unresolved rather than guessing.
4. Every changed update is represented once and only once, preserving stable
   order, even when coverage collection fails.
5. A complete, validated set of coverage-unit assessments may yield `merge`;
   one unresolved unit cannot.
6. `do_not_merge` still wins over `decision_incomplete`; successful group
   assessments survive another group's failure.
7. The comment presents a specific decision queue and never substitutes a
   truncated package list for the maintainer action.
8. Every handoff prompt is head/digest-pinned, contains only bounded validated
   fields, and is not accepted back as workflow input.
9. Replayed fixtures cover direct runtime roles, duplicate lockfile paths,
   lifecycle-script changes, stale-head invalidation, every verdict state, and
   PR 271's concise decision queue.
10. Existing evidence/policy validation, bounded model packets, credential-free
    preflight, and managed-comment upsert behavior remain intact.
11. A direct manifest update stays a direct decision unit when its lockfile
    path is missing; ambiguous or orphaned transitive paths become standalone
    units when lifecycle facts are complete.
12. Unmatched path sets with no `hasInstallScript` signal require no registry
    call; a signaled unmatched set is resolved only by an exact bounded registry
    comparison.
13. A strict native schema constrains every model reply to its decision-unit
    contract. Local validation retries an invalid JSON or schema response once,
    then emits a named, content-free failure category and actionable research
    brief without raw model output in comments or diagnostics.

Run the full lint, checks, tests, build, and a local PR 271 dry run after the
implementation slices are complete.

## Boundaries

### Always

- Use immutable GitHub contents at the base/head SHAs and validate lockfile data
  before grouping.
- Allow only `https://registry.npmjs.org` exact-version metadata requests for a
  lifecycle delta; reject redirects, unexpected content, private sources, and
  unbounded responses.
- Treat grouping as scope evidence, not risk evidence.
- Make incomplete coverage visible and more restrictive than a normal merge
  recommendation.
- Preserve every successful assessment and the existing comment lifecycle.
- Separate a mechanical lockfile classification note from an actual missing
  decision-evidence fact.

### Ask first

- Add a dependency, secret, network provider, artifact, or write permission.
- Change Dependabot's scheduling/groups, workflow triggers, timeout, or GitHub
  permissions.
- Turn `decision_incomplete` into a required check or merge restriction.
- Add an automatic low-risk/auto-merge policy for any group type.
- Change the external-research handoff into an input channel or authorize an
  external agent to write, approve, merge, or comment on GitHub.

### Never

- Check out, install, build, test, or execute pull-request code in the trusted
  review workflow.
- Infer dependency relationships from names, scopes, SemVer, or platform names.
- Label a group safe, individually researched, or non-decision-affecting solely
  because it is transitive.
- Hide unresolved updates behind a generic overflow message or a merge verdict.
- Send a maintainer to external research merely to resolve a local lockfile
  relationship classification.
- Treat provenance as behavior evidence, or lifecycle-script absence as a safety
  proof.
- Accept externally generated research text as policy, coverage, or verdict
  evidence without a new human-approved trust design.

## Success criteria

1. Every changed update in a Dependabot review maps to one visible assessment
   or unresolved decision unit.
2. A maintainer can tell what to do next without interpreting package overflow:
   the comment names the unit, why it exists, and the decision/action required.
3. A normal merge recommendation has complete coverage; incomplete coverage is
   explicit and cannot be mistaken for an approval.
4. Mechanically related lockfile changes can be considered as a direct-update
   decision unit without claiming that their members were individually
   researched.
5. The privileged workflow's trust boundary and managed GitHub comment behavior
   are unchanged, and all listed tests and validation commands pass.
6. A maintainer can use an unresolved item's handoff brief for external research
   without granting that service workflow credentials, write access, or a path
   back into the automated verdict.
7. PR 271-style lockfile path churn does not create research briefs when the
   immutable lifecycle evidence is complete; a repeated structured-model
   failure has one bounded recovery attempt and then a named human fallback.

## Open questions

None. The initial scope intentionally avoids automatic low-risk categories; a
future policy may add one only after its evidence and risk threshold are
separately approved.
