import { expect, test } from '@playwright/test';

test.describe('Employee onboarding case study media', () => {
  test('only applies zoom behavior to the detailed checklist image', async ({ page }) => {
    await page.goto('/portfolio/employee-onboarding-at-society-of-grownups/');
    await page.waitForLoadState('networkidle');

    await expect(
      page.getByRole('button', {
        name: 'Screenshot of a document outlining the new employee onboarding process',
      })
    ).toHaveCount(1);

    await expect(page.getByAltText('Multiple devices running iOS')).toHaveCount(1);
    await expect(page.getByAltText('Hanging advertisements on a wall')).toHaveCount(1);
    await expect(page.getByRole('button', { name: 'Multiple devices running iOS' })).toHaveCount(0);
    await expect(
      page.getByRole('button', { name: 'Hanging advertisements on a wall' })
    ).toHaveCount(0);
  });
});
