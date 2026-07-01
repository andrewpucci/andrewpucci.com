// @ts-check
import { expect, test } from '@playwright/test';

test.describe('Contact page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/contact/');
    // Not 'networkidle': the Turnstile widget keeps making background
    // requests, so network never truly goes idle here.
    await page.waitForLoadState('load');
    await expect(page.getByLabel('Name')).toBeVisible();
  });

  test('has the correct title', async ({ page }) => {
    await expect(page).toHaveTitle('Contact | Andrew Pucci');
  });

  test('preserves submitted values and shows an associated error on failed validation', async ({
    page,
  }) => {
    await page.getByLabel('Name').fill('Jane Tester');
    // Email and message left empty on purpose to trigger validation.
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByLabel('Name')).toHaveValue('Jane Tester');

    const emailInput = page.getByLabel('Email');
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await emailInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText(/valid email/i);
  });

  test('offers a direct mailto fallback', async ({ page }) => {
    await expect(page.getByRole('link', { name: /andrew@andrewpucci\.com/ })).toHaveAttribute(
      'href',
      'mailto:[redacted]'
    );
  });
});
