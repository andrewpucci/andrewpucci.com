import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const workflow = await readFile(
  resolve(process.cwd(), '.github/workflows/dependabot-intelligent-review.yml'),
  'utf8'
);

describe('Dependabot intelligent review workflow', () => {
  it('uses the restricted GitHub App token only to write the review comment', () => {
    expect(workflow).toMatch(
      /uses: actions\/create-github-app-token@[a-f0-9]{40} # v\d+\.\d+\.\d+/
    );
    expect(workflow).toContain('app-id: ${{ secrets.DEPENDABOT_REVIEW_APP_ID }}');
    expect(workflow).toContain('private-key: ${{ secrets.DEPENDABOT_REVIEW_APP_PRIVATE_KEY }}');
    expect(workflow).toContain('permission-issues: write');
    expect(workflow).toContain('permission-pull-requests: write');
    expect(workflow).toContain('GITHUB_COMMENT_TOKEN: ${{ steps.app-token.outputs.token }}');
    expect(workflow).toContain(
      'GITHUB_COMMENT_AUTHOR: ${{ steps.app-token.outputs.app-slug }}[bot]'
    );
  });

  it('checks out only the trusted default branch before running the reviewer', () => {
    const checkout = workflow.match(
      /- uses: actions\/checkout@[\s\S]*?(?=\n {6}- name: Create review-comment app token)/
    )?.[0];

    expect(checkout).toContain('fetch-depth: 1');
    expect(checkout).not.toContain('ref:');
    expect(workflow).toContain('run: node .github/actions-scripts/dependabot-review/run.mjs');
  });

  it('pins the verifier runtime without enabling an action cache in the privileged job', () => {
    expect(workflow).toContain(
      'uses: actions/setup-node@820762786026740c76f36085b0efc47a31fe5020 # v7.0.0'
    );
    expect(workflow).toContain("node-version: '24'");
    expect(workflow).toContain('package-manager-cache: false');
    expect(workflow).toMatch(
      /- name: Install pinned npm verifier\n {8}run: npm install --global npm@12\.0\.2 --ignore-scripts/
    );
  });
});
