import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { gunzipSync } from 'node:zlib';
import { describe, expect, it } from 'vite-plus/test';
import { renderComment } from './reporting.mjs';

const fixturePath = resolve(
  '.github/actions-scripts/dependabot-review/fixtures/pr-271-review-input.json.gz.base64'
);
const snapshotPath = resolve('.github/actions-scripts/dependabot-review/fixtures/pr-271-render.md');

type ReviewInputFixture = {
  pullRequest: { headSha: string };
  packages: { name: string; from: string; to: string }[];
  coverage?: { items: { status: 'complete' | 'pending' | 'unresolved' }[] };
  provenance?: {
    status: string;
    invalid: number;
    missing: number;
    reason: string | null;
  };
};

async function inputFixture() {
  const encoded = await readFile(fixturePath, 'utf8');
  return JSON.parse(
    gunzipSync(Buffer.from(encoded.trim(), 'base64')).toString('utf8')
  ) as ReviewInputFixture;
}

function incompleteAnalysis(input: ReviewInputFixture) {
  return {
    verdict: 'decision_incomplete',
    summary: 'Fixture regression render for the immutable pull-request input.',
    decisionQueue: input.packages.slice(0, 12).map((pkg) => ({
      group: { kind: 'standalone', anchor: null },
      members: [{ name: pkg.name, from: pkg.from, to: pkg.to }],
      count: 1,
      reason: 'analysis_unavailable',
      action: 'Resolve this immutable decision unit before requesting an advisory recommendation.',
      lifecycle: [],
    })),
    coverage: input.coverage
      ? {
          complete: input.coverage.items.filter((item) => item.status === 'complete').length,
          pending: input.coverage.items.filter((item) => item.status === 'pending').length,
          unresolved: input.coverage.items.filter((item) => item.status === 'unresolved').length,
        }
      : undefined,
    packageAssessments: [],
    blockers: [],
    followups: [],
    remediationPrompt: null,
  };
}

describe('renderComment with the captured PR 271 input', () => {
  it('matches the reviewed decision-queue layout without credentials or live APIs', async () => {
    const input = await inputFixture();
    const body = renderComment(incompleteAnalysis(input), {
      headSha: input.pullRequest.headSha,
      provenance: input.provenance,
    });

    await expect(readFile(snapshotPath, 'utf8')).resolves.toBe(`${body}\n`);
  });
});
