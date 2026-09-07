import { describe, expect, it, vi } from 'vite-plus/test';
import { analyzeBatches, projectForModel } from './batches.mjs';

function dependency(name: string, excerpt = 'Evidence.') {
  return {
    name,
    from: '1.0.0',
    to: '2.0.0',
    dependencyType: 'direct:development',
    license: null,
    evidence: { status: 'available', reason: null },
    context: { status: 'unavailable', facts: [] },
    sources: [
      {
        kind: 'release-notes',
        url: `https://example.com/${name}`,
        title: `${name} release`,
        excerpt,
        range: { from: '1.0.0', to: '2.0.0' },
      },
    ],
    findings: [],
  };
}

const input = {
  pullRequest: { number: 1, baseSha: 'base', headSha: 'head' },
  packages: [dependency('first'), dependency('second')],
};

function completedAnalysis(pkg: ReturnType<typeof dependency>) {
  return {
    verdict: 'merge',
    summary: `${pkg.name} is ready to merge.`,
    packageAssessments: [{ name: pkg.name, from: pkg.from, to: pkg.to, newFunctionality: [] }],
    blockers: [],
    remediationPrompt: null,
  };
}

describe('Dependabot review batches', () => {
  it('bounds a model packet without dropping source attribution', () => {
    const projected = projectForModel(
      { ...input, packages: [dependency('large', 'x'.repeat(10_000))] },
      { maxSourceExcerptChars: 100, maxPackageChars: 500 }
    );

    expect(projected.packages[0].sources[0]).toMatchObject({
      url: 'https://example.com/large',
      excerptTruncated: true,
    });
    expect(projected.packages[0].sources[0].excerpt).toHaveLength(100);
  });

  it('bounds trusted context and scopes policy findings to the batch', () => {
    const first = {
      ...dependency('first'),
      context: {
        status: 'available',
        facts: [
          {
            kind: 'package-usage',
            path: 'package.json',
            excerpt: 'x'.repeat(10_000),
          },
        ],
      },
    };
    const second = dependency('second');
    const packet = {
      ...input,
      packages: [first, second],
      policy: {
        verdictCeiling: 'do_not_merge',
        findings: [
          {
            package: { name: 'first', from: '1.0.0', to: '2.0.0' },
            verdict: 'merge_with_followups',
          },
          {
            package: { name: 'second', from: '1.0.0', to: '2.0.0' },
            verdict: 'do_not_merge',
          },
        ],
      },
    };

    const projected = projectForModel(
      { ...packet, packages: [first] },
      { maxSourceExcerptChars: 100, maxPackageChars: 500 }
    );

    expect(JSON.stringify(projected.packages[0]).length).toBeLessThanOrEqual(500);
    expect(projected.packages[0].context.facts[0]).toMatchObject({ excerptTruncated: true });
    expect(projected.policy).toEqual({
      verdictCeiling: 'merge_with_followups',
      findings: [
        {
          package: { name: 'first', from: '1.0.0', to: '2.0.0' },
          verdict: 'merge_with_followups',
        },
      ],
    });
  });

  it('marks metadata too large for a bounded packet as unavailable without calling the model', async () => {
    const oversized = {
      ...dependency('oversized'),
      sources: Array.from({ length: 20 }, () => ({
        ...dependency('oversized').sources[0],
        title: 'x'.repeat(100),
      })),
    };
    const analyzeBatch = vi.fn();

    const result = await analyzeBatches(
      { ...input, packages: [oversized] },
      { analyzeBatch, maxPackageChars: 500, maxBatchChars: 600 }
    );

    expect(analyzeBatch).not.toHaveBeenCalled();
    expect(result).toMatchObject({ verdict: 'analysis_unavailable' });
    expect(result.summary).toContain('oversized 1.0.0 to 2.0.0: manual review required.');
  });

  it('splits a truncated batch and preserves the completed package results', async () => {
    const analyzeBatch = vi.fn(async (batch) =>
      batch.packages.length > 1
        ? { verdict: 'analysis_unavailable', reason: 'truncated' }
        : completedAnalysis(batch.packages[0])
    );

    const result = await analyzeBatches(input, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch.mock.calls.map(([batch]) => batch.packages.length)).toEqual([2, 1, 1]);
    expect(result).toMatchObject({ verdict: 'merge' });
    expect(
      result.packageAssessments.map((assessment: { name: string }) => assessment.name)
    ).toEqual(['first', 'second']);
  });

  it('scopes policy findings when retrying a truncated batch', async () => {
    const policyInput = {
      ...input,
      policy: {
        verdictCeiling: 'do_not_merge',
        findings: [
          {
            package: { name: 'first', from: '1.0.0', to: '2.0.0' },
            verdict: 'merge_with_followups',
          },
          {
            package: { name: 'second', from: '1.0.0', to: '2.0.0' },
            verdict: 'do_not_merge',
          },
        ],
      },
    };
    const analyzeBatch = vi.fn(async (batch) =>
      batch.packages.length > 1
        ? { verdict: 'analysis_unavailable', reason: 'truncated' }
        : completedAnalysis(batch.packages[0])
    );

    await analyzeBatches(policyInput, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch.mock.calls.map(([batch]) => batch.policy.findings)).toEqual([
      policyInput.policy.findings,
      [policyInput.policy.findings[0]],
      [policyInput.policy.findings[1]],
    ]);
  });

  it('retains a deterministic do_not_merge blocker when its model batch is unavailable', async () => {
    const second = dependency('second');
    const result = await analyzeBatches(
      {
        ...input,
        policy: {
          verdictCeiling: 'do_not_merge',
          findings: [
            {
              package: { name: second.name, from: second.from, to: second.to },
              findingId: 'second:vulnerability',
              verdict: 'do_not_merge',
              reason: 'A critical vulnerability affects the target version.',
              sourceUrl: second.sources[0].url,
              remediation: ['Update the package.'],
              validation: ['npm test'],
            },
          ],
        },
      },
      {
        maxPackagesPerBatch: 1,
        analyzeBatch: async (batch: { packages: ReturnType<typeof dependency>[] }) =>
          batch.packages[0].name === 'first'
            ? completedAnalysis(batch.packages[0])
            : { verdict: 'analysis_unavailable' },
      }
    );

    expect(result).toMatchObject({ verdict: 'do_not_merge' });
    expect(result.blockers).toMatchObject([
      {
        findingId: 'second:vulnerability',
        evidence: [{ sourceUrl: second.sources[0].url }],
      },
    ]);
  });

  it('marks a batch unavailable when the model omits an assessment', async () => {
    const result = await analyzeBatches(input, {
      analyzeBatch: vi.fn().mockResolvedValue({
        verdict: 'merge',
        summary: 'Everything is ready.',
        packageAssessments: [completedAnalysis(input.packages[0]).packageAssessments[0]],
        blockers: [],
        remediationPrompt: null,
      }),
      maxPackagesPerBatch: 2,
    });

    expect(result).toMatchObject({ verdict: 'analysis_unavailable' });
    expect(result.summary).toContain('first 1.0.0 to 2.0.0: manual review required.');
    expect(result.summary).toContain('second 1.0.0 to 2.0.0: manual review required.');
  });

  it('marks a batch unavailable when the model duplicates an assessment', async () => {
    const assessment = completedAnalysis(input.packages[0]).packageAssessments[0];
    const result = await analyzeBatches(input, {
      analyzeBatch: vi.fn().mockResolvedValue({
        verdict: 'merge',
        summary: 'Everything is ready.',
        packageAssessments: [assessment, assessment],
        blockers: [],
        remediationPrompt: null,
      }),
      maxPackagesPerBatch: 2,
    });

    expect(result).toMatchObject({ verdict: 'analysis_unavailable' });
    expect(result.packageAssessments).toEqual([]);
  });

  it('uses the unavailable fallback when no batch result validates', async () => {
    const result = await analyzeBatches(input, {
      analyzeBatch: vi.fn().mockResolvedValue({ verdict: 'analysis_unavailable' }),
    });

    expect(result).toMatchObject({ verdict: 'analysis_unavailable' });
    expect(result.summary).toContain('first 1.0.0 to 2.0.0: manual review required.');
    expect(result.summary).toContain('second 1.0.0 to 2.0.0: manual review required.');
  });

  it('records unattempted batches when the request budget is exhausted', async () => {
    const analyzeBatch = vi.fn(async (batch) => completedAnalysis(batch.packages[0]));

    const result = await analyzeBatches(input, {
      analyzeBatch,
      maxPackagesPerBatch: 1,
      maxRequests: 1,
    });

    expect(analyzeBatch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ verdict: 'merge_with_followups' });
    expect(result.summary).toContain('second 1.0.0 to 2.0.0: manual review required.');
  });

  it('limits concurrent initial batch requests', async () => {
    let active = 0;
    let peak = 0;
    const analyzeBatch = vi.fn(async (batch) => {
      active += 1;
      peak = Math.max(peak, active);
      await new Promise((resolve) => setTimeout(resolve, 5));
      active -= 1;
      return completedAnalysis(batch.packages[0]);
    });

    await analyzeBatches(
      { ...input, packages: [dependency('first'), dependency('second'), dependency('third')] },
      { analyzeBatch, maxPackagesPerBatch: 1, maxConcurrency: 1 }
    );

    expect(peak).toBe(1);
  });
});
