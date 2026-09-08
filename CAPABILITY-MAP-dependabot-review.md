# Capability Map: Dependabot review improvements — 2026-09-06

## Objective

Make the Dependabot intelligent review a concise, evidence-backed dependency decision aid. The review complements GitHub's existing CI status rather than repeating it.

## Approved decisions

- Missing upstream evidence always limits the advisory verdict to `merge_with_followups`.
- Repository context comes only from static, trusted default-branch files and targeted searches; it never executes or reads PR code.
- `Use now` and `Consider later` remain visible in the comment. `Not relevant` appears in a collapsed section.

## Modules

| Module ID             | Responsibility                                                                                         | Depends on                                  |
| --------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| `evidence-collection` | Collect complete dependency diffs and version-range evidence with documented fallbacks.                | —                                           |
| `repository-context`  | Collect bounded, trusted repository context for relevance and compatibility decisions.                 | —                                           |
| `review-policy`       | Produce deterministic evidence, vulnerability, and compatibility constraints for the advisory verdict. | `evidence-collection`, `repository-context` |
| `analysis-contract`   | Constrain the Mistral request and response around vetted inputs and policy constraints.                | `review-policy`                             |
| `comment-experience`  | Render an immediately scannable, grouped review comment.                                               | `analysis-contract`                         |

Build order: `evidence-collection` and `repository-context` → `review-policy` → `analysis-contract` → `comment-experience`.

## Out of scope

- Repeating, gating on, or reporting GitHub CI status.
- Executing package code, PR code, migrations, codemods, or arbitrary commands.
- Adding a license policy; license metadata may remain informational until a repository policy exists.
