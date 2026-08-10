import { expect, test } from '@playwright/test';

test.describe('Resume page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/resume/');
  });

  test('has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Résumé | Andrew Pucci');
  });

  test('has all main sections', async ({ page }) => {
    for (const heading of [
      'Professional Experience',
      'Education',
      'Speaking Engagements',
      'Volunteer Experience',
      'Skills',
      'Tools',
    ]) {
      await expect(page.getByRole('heading', { name: heading })).toBeVisible();
    }
  });

  test('has professional experience entries using the h-event microformat', async ({ page }) => {
    const entries = page.locator('.h-event');
    expect(await entries.count()).toBeGreaterThan(0);
  });

  test('has a downloadable resume PDF', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'Download' })).toHaveAttribute(
      'href',
      '/files/andrew-pucci-resume.pdf'
    );
  });

  test('has contact information in the footer', async ({ page }) => {
    await expect(page.getByRole('link', { name: 'LinkedIn' })).toBeVisible();
  });
});
