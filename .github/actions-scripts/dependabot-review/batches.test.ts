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

function coverageItem(pkg: ReturnType<typeof dependency>, status = 'complete') {
  return {
    update: {
      name: pkg.name,
      from: pkg.from,
      to: pkg.to,
      dependencyType: pkg.dependencyType,
    },
    group: { kind: 'standalone', anchor: null },
    lifecycle: {
      status: 'unchanged',
      metadata: 'not_needed',
      paths: [],
      changes: [],
      reason: null,
    },
    status,
    reason: status === 'complete' ? null : 'coverage_inputs_unavailable',
  };
}

function completedAnalysis(pkg: ReturnType<typeof dependency>) {
  return {
    verdict: 'merge',
    summary: `${pkg.name} is ready to merge.`,
    packageAssessments: [{ name: pkg.name, from: pkg.from, to: pkg.to, newFunctionality: [] }],
    blockers: [],
    followups: [],
    remediationPrompt: null,
  };
}

describe('Dependabot review batches', () => {
  it('returns decision_incomplete when validated coverage has an unresolved unit', async () => {
    const coverage = {
      items: [coverageItem(input.packages[0]), coverageItem(input.packages[1], 'unresolved')],
    };

    const result = await analyzeBatches(
      { ...input, coverage },
      {
        analyzeBatch: async (batch: { packages: ReturnType<typeof dependency>[] }) =>
          completedAnalysis(batch.packages[0]),
        maxPackagesPerBatch: 1,
      }
    );

    expect(result).toMatchObject({
      verdict: 'decision_incomplete',
      decisionQueue: [
        {
          count: 1,
          reason: 'coverage_inputs_unavailable',
          action: expect.stringContaining('Obtain immutable manifest, lockfile'),
        },
      ],
    });
  });

  it('queues a rate-limited direct unit for a rerun after the reset', async () => {
    const coverage = {
      items: input.packages.map((pkg: ReturnType<typeof dependency>) => ({
        ...coverageItem(pkg, 'unresolved'),
        group: {
          kind: 'direct',
          anchor: { name: 'first', from: '1.0.0', to: '2.0.0' },
        },
        reason: 'github_rate_limited',
      })),
    };

    const result = await analyzeBatches(
      { ...input, coverage },
      {
        analyzeBatch: async (batch: { packages: ReturnType<typeof dependency>[] }) => ({
          verdict: 'merge',
          summary: 'The direct group is ready.',
          packageAssessments: batch.packages.map(
            (pkg: ReturnType<typeof dependency>) => completedAnalysis(pkg).packageAssessments[0]
          ),
          blockers: [],
          followups: [],
          remediationPrompt: null,
        }),
      }
    );

    expect(result).toMatchObject({
      verdict: 'decision_incomplete',
      decisionQueue: [
        {
          count: 2,
          reason: 'github_rate_limited',
          action: expect.stringContaining('GitHub API rate limit resets'),
        },
      ],
    });
  });

  it('rejects an unqualified merge_with_followups response as incomplete coverage', async () => {
    const coverage = { items: input.packages.map((pkg) => coverageItem(pkg)) };

    const result = await analyzeBatches(
      { ...input, coverage },
      {
        analyzeBatch: async (batch: { packages: ReturnType<typeof dependency>[] }) => ({
          ...completedAnalysis(batch.packages[0]),
          verdict: 'merge_with_followups',
        }),
        maxPackagesPerBatch: 1,
      }
    );

    expect(result).toMatchObject({ verdict: 'decision_incomplete', packageAssessments: [] });
  });

  it('retains explicit follow-ups and distinguishes model units from expanded assessments', async () => {
    const coverage = {
      items: input.packages.map((pkg) => ({
        ...coverageItem(pkg),
        group: {
          kind: 'direct',
          anchor: { name: 'first', from: '1.0.0', to: '2.0.0' },
        },
      })),
    };

    const result = await analyzeBatches(
      { ...input, coverage },
      {
        analyzeBatch: async (batch: { packages: ReturnType<typeof dependency>[] }) => ({
          verdict: 'merge_with_followups',
          summary: 'Record the non-blocking configuration choice.',
          packageAssessments: batch.packages.map(
            (pkg) => completedAnalysis(pkg).packageAssessments[0]
          ),
          blockers: [],
          followups: [
            { description: 'Record the optional configuration choice.', blocking: false },
          ],
          remediationPrompt: null,
        }),
      }
    );

    expect(result).toMatchObject({
      verdict: 'merge_with_followups',
      followups: [{ description: 'Record the optional configuration choice.', blocking: false }],
    });
    expect(result.summary).toBe(
      'Reviewed 2 dependency updates across 1 model decision unit: 2 package assessments deterministically expanded from 1 validated decision-unit analysis.'
    );
  });

  it('keeps a direct coverage group intact when a package limit would split its members', async () => {
    const coverage = {
      items: input.packages.map((pkg: ReturnType<typeof dependency>) => ({
        ...coverageItem(pkg),
        group: {
          kind: 'direct',
          anchor: { name: 'first', from: '1.0.0', to: '2.0.0' },
        },
      })),
    };
    const analyzeBatch = vi.fn(async (batch: { packages: ReturnType<typeof dependency>[] }) => ({
      verdict: 'merge',
      summary: 'The direct group is ready.',
      packageAssessments: batch.packages.map(
        (pkg: ReturnType<typeof dependency>) => completedAnalysis(pkg).packageAssessments[0]
      ),
      blockers: [],
      remediationPrompt: null,
    }));

    await analyzeBatches({ ...input, coverage }, { analyzeBatch, maxPackagesPerBatch: 1 });

    expect(
      analyzeBatch.mock.calls.map(([batch]) =>
        batch.packages.map((pkg: ReturnType<typeof dependency>) => pkg.name)
      )
    ).toEqual([['first', 'second']]);
  });

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

  it('omits advisory provenance evidence from the model packet', () => {
    const provenance = {
      status: 'attention_required',
      invalid: 1,
      missing: 0,
      reason: 'npm reported missing or invalid package provenance.',
    };

    const projected = projectForModel({ ...input, provenance });

    expect(projected.provenance).toBeUndefined();
    expect(input).not.toHaveProperty('provenance');
  });

  it('treats incomplete nested review data as absent from a model batch', async () => {
    const analyzeBatch = vi.fn(async (batch) => completedAnalysis(batch.packages[0]));

    await expect(
      analyzeBatches(
        { ...input, coverage: {}, policy: {} },
        { analyzeBatch, maxPackagesPerBatch: 1 }
      )
    ).resolves.toMatchObject({ verdict: 'merge' });

    expect(analyzeBatch).toHaveBeenCalledTimes(2);
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
    expect(result.summary).toBe(
      'Reviewed 1 dependency update across 1 model decision unit: 0 package assessments deterministically expanded from 0 validated decision-unit analyses; 1 unit await decision evidence.'
    );
  });

  it('sends a large direct decision unit as one anchor assessment instead of dropping its members', async () => {
    const direct = dependency('direct');
    const groupedPackages = [
      direct,
      ...Array.from({ length: 54 }, (_, index) => dependency(`transitive-${index}`)),
    ];
    const coverage = {
      items: groupedPackages.map((pkg) => ({
        ...coverageItem(pkg),
        group: {
          kind: 'direct',
          anchor: { name: direct.name, from: direct.from, to: direct.to },
        },
      })),
    };
    const analyzeBatch = vi.fn(async (batch) => ({
      verdict: 'merge',
      summary: 'The direct decision is ready.',
      packageAssessments: batch.packages.map(
        (pkg: ReturnType<typeof dependency>) => completedAnalysis(pkg).packageAssessments[0]
      ),
      blockers: [],
      followups: [],
      remediationPrompt: null,
    }));

    const result = await analyzeBatches(
      { ...input, packages: groupedPackages, coverage },
      { analyzeBatch, maxBatchChars: 1_500 }
    );

    expect(analyzeBatch).toHaveBeenCalledTimes(1);
    expect(result).toMatchObject({ verdict: 'merge', decisionQueue: [] });
  });

  it('splits a truncated batch and preserves the completed package results', async () => {
    const analyzeBatch = vi.fn(async (batch) =>
      batch.packages.length > 1
        ? { verdict: 'analysis_unavailable', reason: 'analysis_truncated' }
        : completedAnalysis(batch.packages[0])
    );

    const result = await analyzeBatches(input, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch.mock.calls.map(([batch]) => batch.packages.length)).toEqual([2, 1, 1]);
    expect(result).toMatchObject({ verdict: 'merge' });
    expect(
      result.packageAssessments.map((assessment: { name: string }) => assessment.name)
    ).toEqual(['first', 'second']);
  });

  it('retries one schema-invalid batch without changing its decision unit', async () => {
    const analyzeBatch = vi
      .fn()
      .mockResolvedValueOnce({
        verdict: 'analysis_unavailable',
        reason: 'analysis_schema_contract',
      })
      .mockImplementation(async (batch) => ({
        verdict: 'merge',
        summary: 'Both updates are ready.',
        packageAssessments: batch.packages.map(
          (pkg: ReturnType<typeof dependency>) => completedAnalysis(pkg).packageAssessments[0]
        ),
        blockers: [],
        followups: [],
        remediationPrompt: null,
      }));

    const result = await analyzeBatches(input, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch).toHaveBeenCalledTimes(2);
    expect(analyzeBatch.mock.calls.map(([, options]) => options.retry)).toEqual([false, true]);
    expect(result).toMatchObject({ verdict: 'merge', decisionQueue: [] });
  });

  it('queues a repeatedly schema-invalid unit for the research brief', async () => {
    const analyzeBatch = vi
      .fn()
      .mockResolvedValue({ verdict: 'analysis_unavailable', reason: 'analysis_schema_contract' });

    const result = await analyzeBatches(input, { analyzeBatch, maxPackagesPerBatch: 2 });

    expect(analyzeBatch).toHaveBeenCalledTimes(2);
    expect(result).toMatchObject({ verdict: 'analysis_unavailable' });
    expect(result.decisionQueue).toHaveLength(2);
    expect(result.decisionQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: 'analysis_schema_contract',
          action: expect.stringContaining('copyable research brief'),
        }),
      ])
    );
  });

  it('does not spend beyond the model request budget on a schema retry', async () => {
    const analyzeBatch = vi
      .fn()
      .mockResolvedValue({ verdict: 'analysis_unavailable', reason: 'analysis_schema_contract' });

    const result = await analyzeBatches(input, {
      analyzeBatch,
      maxPackagesPerBatch: 2,
      maxRequests: 1,
    });

    expect(analyzeBatch).toHaveBeenCalledTimes(1);
    expect(result.decisionQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ reason: 'analysis_request_budget_exhausted' }),
      ])
    );
  });

  it('reports an exhausted model request budget without calling it unavailable', async () => {
    const analyzeBatch = vi.fn();

    const result = await analyzeBatches(input, {
      analyzeBatch,
      maxPackagesPerBatch: 1,
      maxRequests: 0,
    });

    expect(analyzeBatch).not.toHaveBeenCalled();
    expect(result.decisionQueue).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          reason: 'analysis_request_budget_exhausted',
          failureCategory: 'analysis_request_budget_exhausted',
        }),
      ])
    );
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
        ? { verdict: 'analysis_unavailable', reason: 'analysis_truncated' }
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
    expect(result.summary).toBe(
      'Reviewed 2 dependency updates across 2 model decision units: 0 package assessments deterministically expanded from 0 validated decision-unit analyses; 2 units await decision evidence.'
    );
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
    expect(result.summary).toBe(
      'Reviewed 2 dependency updates across 2 model decision units: 0 package assessments deterministically expanded from 0 validated decision-unit analyses; 2 units await decision evidence.'
    );
  });

  it('creates a precise queue entry for every unresolved decision unit', async () => {
    const result = await analyzeBatches(
      {
        ...input,
        packages: [
          dependency('first'),
          dependency('second'),
          dependency('third'),
          dependency('fourth'),
        ],
      },
      {
        analyzeBatch: async () => ({ verdict: 'analysis_unavailable' }),
        maxPackagesPerBatch: 1,
      }
    );

    expect(result.summary).toBe(
      'Reviewed 4 dependency updates across 4 model decision units: 0 package assessments deterministically expanded from 0 validated decision-unit analyses; 4 units await decision evidence.'
    );
    expect(result.decisionQueue.map((item) => item.members[0].name)).toEqual([
      'first',
      'second',
      'third',
      'fourth',
    ]);
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
    expect(result.summary).toBe(
      'Reviewed 2 dependency updates across 2 model decision units: 1 package assessment deterministically expanded from 1 validated decision-unit analysis; 1 unit await decision evidence.'
    );
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
