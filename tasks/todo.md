# Todo: Dependabot Intelligent Review

See [plan.md](plan.md) for architecture decisions, dependencies, and risks.

## Task 1: Define shared review contracts and validation

**Description:** Create the TypeScript data contracts and runtime validators shared by evidence collection, Mistral analysis, and comment reporting.

**Acceptance criteria:**

- [ ] Input and analysis contracts encode provenance, verdicts, blockers, codemods, and remediation prompts.
- [ ] Validators reject missing citations, unknown source URLs, conflicting verdicts, and malformed model output.
- [ ] Tests cover valid and invalid contract examples without network access.

**Verification:**

- [ ] Tests pass: focused Vitest schema tests.
- [ ] Checks pass: `vp check` and `npm run check:svelte`.

**Dependencies:** None

**Files likely touched:**

- `.github/actions-scripts/dependabot-review/schema.mjs`
- `.github/actions-scripts/dependabot-review/schema.test.ts`

**Estimated scope:** Small: 2 files

## Task 2: Collect and normalize Dependabot review inputs

**Description:** Build the no-checkout evidence collector for Dependabot metadata, dependency-review findings, npm metadata, and official release/migration/codemod sources.

**Acceptance criteria:**

- [ ] Only `dependabot[bot]` PR data produces a bounded packet.
- [ ] Every source is canonical, HTTPS, official, and provenance-tagged; unavailable sources produce an explicit manual-review state.
- [ ] Applicable codemods require official command and version-range evidence.

**Verification:**

- [ ] Tests pass: focused Vitest input tests with mocked GitHub/registry/source responses.
- [ ] Manual check: implementation has no checkout, install, build, or command-execution step for PR content.

**Dependencies:** Task 1

**Files likely touched:**

- `.github/actions-scripts/dependabot-review/inputs.mjs`
- `.github/actions-scripts/dependabot-review/inputs.test.ts`

**Estimated scope:** Small: 2 files

## Checkpoint: Input foundation

- [ ] Tasks 1-2 focused tests pass.
- [ ] Review the packet schema and source bounds before external API integration.

## Task 3: Analyze validated evidence with Mistral

**Description:** Make a bounded `mistral-medium-latest` request, validate its JSON response, apply deterministic verdict policy, and generate remediation prompts for verified blockers.

**Acceptance criteria:**

- [ ] Only bounded, validated input evidence is sent to Mistral; no tokens or secrets are logged.
- [ ] Valid results cite only input-packet URLs; malformed/failed responses become `analysis_unavailable`.
- [ ] Applicable official codemods yield `do_not_merge` with remediation, validation, and a prompt; unproven applicability does not.

**Verification:**

- [ ] Tests pass: focused Vitest analysis tests with mocked Mistral responses, 429s, timeouts, and invalid JSON.
- [ ] Checks pass: `vp check` and `npm run check:svelte`.

**Dependencies:** Tasks 1-2

**Files likely touched:**

- `.github/actions-scripts/dependabot-review/analysis.mjs`
- `.github/actions-scripts/dependabot-review/analysis.test.ts`

**Estimated scope:** Small: 2 files

## Task 4: Render and upsert the advisory PR comment

**Description:** Render validated analysis as an escaped, size-bounded Markdown comment and upsert it using a stable marker and reviewed head SHA.

**Acceptance criteria:**

- [ ] The comment has the specified verdict, feature, blocker, remediation, prompt, and metadata sections.
- [ ] Re-runs update one bot-authored marker comment rather than create duplicates.
- [ ] Hostile text is escaped and truncation never omits a blocker or remediation prompt.

**Verification:**

- [ ] Tests pass: focused Vitest reporting tests for create/update, all verdicts, truncation, and GitHub errors.
- [ ] Manual check: inspect rendered Markdown fixture for readability and advisory labeling.

**Dependencies:** Tasks 1 and 3

**Files likely touched:**

- `.github/actions-scripts/dependabot-review/reporting.mjs`
- `.github/actions-scripts/dependabot-review/reporting.test.ts`

**Estimated scope:** Small: 2 files

## Checkpoint: Analysis and reporting

- [ ] Tasks 3-4 focused tests pass.
- [ ] Verify no code path can approve, request changes, merge, execute a codemod, or execute a remediation prompt.

## Task 5: Wire the hardened Dependabot workflow and document setup

**Description:** Add the actor-gated workflow, minimal permissions, concurrency control, and integration coverage; document the required Dependabot secret setup.

**Acceptance criteria:**

- [ ] The workflow responds only to supported Dependabot PR lifecycle events and never checks out PR code.
- [ ] It has only required permissions (`contents: read`, PR metadata read, `issues: write`) and uses `MISTRAL_API_KEY` solely from Dependabot secrets.
- [ ] Tests or static assertions verify the actor gate, permissions, event types, concurrency, and module invocation sequence.

**Verification:**

- [ ] Tests pass: focused workflow/integration tests with mocked module boundaries.
- [ ] Checks pass: `vp check`, `npm run check:svelte`, and `npm run test:coverage`.
- [ ] Manual check: configure a test `MISTRAL_API_KEY` Dependabot secret and inspect the comment on a Dependabot PR.

**Dependencies:** Tasks 1-4

**Files likely touched:**

- `.github/workflows/dependabot-intelligent-review.yml`
- `.github/actions-scripts/dependabot-review/workflow.test.ts`
- `README.md`

**Estimated scope:** Medium: 3 files

## Checkpoint: Complete

- [ ] All task acceptance criteria are met.
- [ ] `vp check`, `npm run check:svelte`, and `npm run test:coverage` pass.
- [ ] The human has reviewed workflow permissions and one rendered test comment.
