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

  it('splits a truncated batch and preserves the completed package results', async () => {
    const analyzeBatch = vi.fn(async (batch) =>
      batch.packages.length > 1
        ? { verdict: 'analysis_unavailable', reason: 'truncated' }
        : completedAnalysis(batch.packages[0])
    );

    const result = await analyzeBatches(input, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch.mock.calls.map(([batch]) => batch.packages.length)).toEqual([2, 1, 1]);
    expect(result).toMatchObject({ verdict: 'merge' });
    expect(result.packageAssessments.map((assessment) => assessment.name)).toEqual([
      'first',
      'second',
    ]);
  });
});
