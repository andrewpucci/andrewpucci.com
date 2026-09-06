import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vite-plus/test';

const workflow = await readFile(
  resolve(process.cwd(), '.github/workflows/dependabot-intelligent-review.yml'),
  'utf8'
);

describe('Dependabot intelligent review workflow', () => {
  it('uses the restricted GitHub App token only to write the review comment', () => {
    expect(workflow).toContain(
      'uses: actions/create-github-app-token@fee1f7d63c2ff003460e3d139729b119787bc349'
    );
    expect(workflow).toContain('app-id: ${{ secrets.DEPENDABOT_REVIEW_APP_ID }}');
    expect(workflow).toContain('private-key: ${{ secrets.DEPENDABOT_REVIEW_APP_PRIVATE_KEY }}');
    expect(workflow).toContain('GITHUB_COMMENT_TOKEN: ${{ steps.app-token.outputs.token }}');
    expect(workflow).toContain(
      'GITHUB_COMMENT_AUTHOR: ${{ steps.app-token.outputs.app-slug }}[bot]'
    );
  });
});
