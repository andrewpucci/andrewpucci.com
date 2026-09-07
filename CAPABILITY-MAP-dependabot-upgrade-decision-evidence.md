# Capability Map: Dependabot Upgrade-Decision Evidence — 2026-09-07

**Decision:** Build evidence that helps a maintainer decide whether a Dependabot
upgrade is appropriate. This is advisory decision support; it does not replace
branch protection, CI, or deterministic dependency-policy checks.

| Module id             | Responsibility                                                                                                                           | Depends on            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| `update-batching`     | Separate direct, high-coupling toolchain upgrades from routine development-dependency batches.                                           | —                     |
| `provenance-evidence` | Collect an advisory npm registry-signature and provenance-attestation result for the proposed lockfile.                                  | —                     |
| `decision-reporting`  | Present upgrade impact, upstream guidance, existing policy evidence, and provenance evidence in the existing review comment and dry run. | `provenance-evidence` |

Build order: `update-batching` and `provenance-evidence` may proceed independently;
`decision-reporting` follows `provenance-evidence`.

## Evidence basis

- GitHub Dependency Review remains the dedicated place for vulnerability and
  license policy. The intelligent reviewer should concentrate on whether an
  upgrade is a sound maintenance choice. [Configure Dependency Review](https://docs.github.com/en/code-security/how-tos/secure-your-supply-chain/manage-your-dependency-security/configure-dependency-review-action?apiVersion=2022-11-28)
- Dependabot supports update groups defined by dependency patterns, exclusions,
  dependency type, and SemVer level, making `update-batching` a configuration
  concern rather than a custom grouping system. [Optimizing Dependabot version updates](https://docs.github.com/en/code-security/tutorials/secure-your-dependencies/optimizing-pr-creation-version-updates)
- npm verifies registry signatures and provenance attestations with `npm audit
signatures`; its result is integrity evidence, not an automatic merge
  decision. [npm audit](https://docs.npmjs.com/cli/v11/commands/npm-audit/)

## Out of scope for this initiative

The completed dry-run reliability work remains unchanged: it shares the
production comment-building path, collects review input before accessing the
model credential, offers credential-free preflight, and covers CLI output with
a subprocess test.
