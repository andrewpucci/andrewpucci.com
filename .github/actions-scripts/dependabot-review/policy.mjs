import { parsePolicy } from './schema.mjs';

const verdictPriority = new Map([
  ['merge', 0],
  ['merge_with_followups', 1],
  ['do_not_merge', 2],
]);

const stricterVerdict = (left, right) =>
  verdictPriority.get(left) >= verdictPriority.get(right) ? left : right;

function packageIdentity(dependency) {
  return { name: dependency.name, from: dependency.from, to: dependency.to };
}

function evidenceFinding(dependency) {
  if (dependency.evidence.status === 'available') return null;
  return {
    package: packageIdentity(dependency),
    findingId: null,
    kind: 'evidence-incomplete',
    sourceUrl: null,
    severity: null,
    verdict: 'merge_with_followups',
    reason:
      dependency.evidence.status === 'partial'
        ? 'Upstream evidence is incomplete.'
        : 'Upstream evidence is unavailable.',
    remediation: ['Review the upstream upgrade evidence before merging.'],
    validation: ['Confirm the upgrade range against upstream release notes.'],
  };
}

function findingVerdict(finding) {
  if (finding.kind === 'vulnerability')
    return ['critical', 'high'].includes(finding.severity)
      ? 'do_not_merge'
      : 'merge_with_followups';
  if (finding.kind === 'incompatible-migration') return 'do_not_merge';
  if (finding.kind === 'applicable-codemod') return 'merge_with_followups';
  return null;
}

function policyFinding(dependency, finding, verdict) {
  return {
    package: packageIdentity(dependency),
    findingId: finding.id,
    kind: finding.kind,
    sourceUrl: finding.sourceUrl,
    severity: finding.severity ?? null,
    verdict,
    reason: finding.reason,
    remediation: finding.remediation,
    validation: finding.validation,
  };
}

export function evaluatePolicy(input) {
  const findings = input.packages.flatMap((dependency) => {
    const evidence = evidenceFinding(dependency);
    const compatibility = dependency.findings.flatMap((finding) => {
      const verdict = findingVerdict(finding);
      return verdict ? [policyFinding(dependency, finding, verdict)] : [];
    });
    return evidence ? [evidence, ...compatibility] : compatibility;
  });
  const verdictCeiling = findings.reduce(
    (current, finding) => stricterVerdict(current, finding.verdict),
    'merge'
  );
  return parsePolicy({ verdictCeiling, findings }, input);
}
