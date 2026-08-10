# Contributing

Thanks for taking an interest in the repository.

## Project model

This is a single-maintainer repository. The maintainer is responsible for:

- triage and merge decisions
- release timing
- security posture and dependency acceptance
- keeping `main` deployable

That means outside contributions are welcome, but review and merge timing are best-effort rather than SLA-backed.

## Before opening a change

- Prefer opening an issue first for non-trivial changes so scope can be agreed before implementation.
- Keep changes focused. Small pull requests are much easier to validate and merge safely.
- Avoid drive-by refactors unless they are required to support the main change.
- Prefer TypeScript for new or modified code whenever the toolchain allows it; keep JavaScript only where a specific tool or runtime requires it.

## Local validation

Before asking for review, run:

```bash
vp check
vp run check:svelte
vp run test:ci
```

If your change is docs-only or otherwise does not need the full test path, say that explicitly in the PR notes.

## Commits and pull requests

- Use short, imperative commit messages.
- Commits destined for `main` should be signed and show as verified on GitHub.
- Explain the motivation for the change, not just the diff.
- Call out follow-up work, risk, and any skipped validation in the PR description.

The pull request template in [.github/pull_request_template.md](/Users/pucciar/Github/andrewpucci.com/.github/pull_request_template.md) is the expected checklist.

## Security reports

Do not open public issues for vulnerabilities. Follow [SECURITY.md](/Users/pucciar/Github/andrewpucci.com/SECURITY.md) instead.

## Maintainer notes

Repository-specific issue and triage conventions live here:

- [docs/agents/issue-tracker.md](/Users/pucciar/Github/andrewpucci.com/docs/agents/issue-tracker.md)
- [docs/agents/triage-labels.md](/Users/pucciar/Github/andrewpucci.com/docs/agents/triage-labels.md)
