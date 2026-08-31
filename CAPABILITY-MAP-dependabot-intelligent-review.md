# Capability Map: Dependabot Intelligent Review

| Module ID          | Responsibility                                                                                                                                                                                                                  | Depends on        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| `review-inputs`    | Identify Dependabot updates; collect dependency delta, manifest/lockfile diff, direct/transitive status, vulnerabilities/licenses, and official upstream release notes, migration guides, and codemod documentation.            | —                 |
| `review-analysis`  | Produce evidence-backed assessment for each package: new functionality, usefulness to this SvelteKit/Cloudflare repository, upgrade risk, and codemod applicability. Return `merge`, `merge_with_followups`, or `do_not_merge`. | `review-inputs`   |
| `review-reporting` | Publish one non-blocking PR review comment with summary, feature recommendations, verdict, blockers, remediation plan, validation steps, and generated remediation prompt.                                                      | `review-analysis` |

Build order: `review-inputs` → `review-analysis` → `review-reporting`

## Decision policy

- Feature value: identify officially documented functionality added between versions; recommend `use_now`, `consider_later`, or `not_relevant` in the context of this repository.
- `merge`: no verified security, compatibility, migration, or policy blockers.
- `merge_with_followups`: no blocker, but useful features to evaluate later or non-critical upgrade notes exist.
- `do_not_merge`: a known vulnerability, license-policy issue, documented incompatible migration, or applicable official codemod exists.
- Codemod blocker: explain that Dependabot updated dependency files but did not make the required source migration; include the official command, source URL, remediation sequence, expected changes, and validation checks.
- Safety: the workflow comments only; it never approves, requests changes, merges, executes a codemod, or executes generated remediation prompts.
