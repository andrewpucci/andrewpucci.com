// @ts-check
import { expect, test } from '@playwright/test';

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
    await page.waitForLoadState('load');
  });

  test('has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Contact | Andrew Pucci');
  });

  test('shows an explicit fallback message when the form is unavailable', async ({ page }) => {
    await expect(page.getByRole('alert')).toContainText(/form is temporarily unavailable/i);
    await expect(page.getByRole('button', { name: 'Send message' })).toHaveCount(0);
  });

  test('offers a direct mailto fallback', async ({ page }) => {
    await expect(page.getByRole('link', { name: /andrew@andrewpucci\.com/ })).toHaveAttribute(
      'href',
      'mailto:andrew@andrewpucci.com'
    );
  });
});
