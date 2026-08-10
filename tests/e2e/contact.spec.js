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

  test('marks every field as required in the DOM', async ({ page }) => {
    await expect(page.getByLabel('Name')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Email')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Message')).toHaveAttribute('required', '');
  });

  test('uses native email validation before submission', async ({ page }) => {
    await page.getByLabel('Name').fill('Jane Tester');
    await page.getByLabel('Email').fill('asdf');
    await page.getByLabel('Message').fill('Hello there');
    await page.getByRole('button', { name: 'Send message' }).click();

    const emailInput = page.getByLabel('Email');
    const validationMessage = await emailInput.evaluate(
      (node) => /** @type {HTMLInputElement} */ (node).validationMessage
    );
    expect(validationMessage.length).toBeGreaterThan(0);
    expect(
      await emailInput.evaluate(
        (node) => /** @type {HTMLInputElement} */ (node).validity.typeMismatch
      )
    ).toBe(true);
    await expect(emailInput).toHaveValue('asdf');
    await expect(page.getByRole('button', { name: 'Send message' })).toContainText('Send message');
  });

  test('preserves submitted values and shows an associated error on failed server validation', async ({
    page,
  }) => {
    await page.getByLabel('Name').fill('Jane Tester');
    await page.getByLabel('Email').fill('jane@example.com');
    // Browser validation should pass so the request reaches the server.
    // Use an overlong message to exercise the server-side validation path.
    await page.getByLabel('Message').fill('x'.repeat(5001));
    await page.getByRole('button', { name: 'Send message' }).click();

    await expect(page.getByLabel('Name')).toHaveValue('Jane Tester');
    await expect(page.getByLabel('Email')).toHaveValue('jane@example.com');
    await expect(page.getByLabel('Message')).toHaveValue('x'.repeat(5001));

    const messageInput = page.getByLabel('Message');
    await expect(messageInput).toHaveAttribute('aria-invalid', 'true');

    const describedBy = await messageInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText(/message is too long/i);
  });

  test('does not expose a direct email address', async ({ page }) => {
    // The contact form is the only contact surface -- no mailto fallback.
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });
});
