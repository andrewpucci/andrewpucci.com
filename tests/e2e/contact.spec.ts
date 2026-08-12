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

  test('marks every field as required in the DOM, stated once rather than per field', async ({
    page,
  }) => {
    await expect(page.getByLabel('Name')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Email')).toHaveAttribute('required', '');
    await expect(page.getByLabel('Message')).toHaveAttribute('required', '');
    // Every field is required, so a single up-front note replaces a "Required"
    // badge repeated on each one -- see the accessibility rationale in the
    // shape discussion: on-blur validation already surfaces per-field errors
    // before submit for the common sequential-fill flow, and this note covers
    // the skip-ahead-fill edge case where it wouldn't.
    await expect(page.getByText('Required', { exact: true })).toHaveCount(0);
    await expect(page.getByText('Every field below is required.')).toBeVisible();
  });

  test('uses custom email validation without submitting invalid data', async ({ page }) => {
    let submitCount = 0;
    await page.route('**/contact/', async (route) => {
      if (route.request().method() === 'POST') submitCount += 1;
      await route.continue();
    });

    await page.getByLabel('Name').fill('Jane Tester');
    await page.getByLabel('Email').fill('asdf');
    await page.getByLabel('Message').fill('Hello there');
    await page.getByRole('button', { name: 'Send message' }).click();

    expect(submitCount).toBe(0);
    const emailInput = page.getByLabel('Email');
    const validationMessage = await emailInput.evaluate(
      (node) => (node as HTMLInputElement).validationMessage
    );
    expect(validationMessage.length).toBeGreaterThan(0);
    expect(
      await emailInput.evaluate((node) => (node as HTMLInputElement).validity.typeMismatch)
    ).toBe(true);
    await expect(emailInput).toHaveAttribute('aria-invalid', 'true');
    await expect(emailInput).toHaveAccessibleDescription(
      /Use a format like name@example\.com\..*Enter a valid email address\./
    );
    await expect(page.getByText('Error: Enter a valid email address.')).toBeVisible();
    await expect(emailInput).toHaveValue('asdf');
    await expect(page.getByRole('button', { name: 'Send message' })).toContainText('Send message');
  });

  test('shows a positive field state after a valid email is committed', async ({ page }) => {
    const emailInput = page.getByLabel('Email');
    await emailInput.fill('jane@example.com');
    await emailInput.blur();

    await expect(emailInput).not.toHaveAttribute('aria-invalid', 'true');
    await expect(emailInput).toHaveAccessibleDescription(
      /Use a format like name@example\.com\..*Looks good\./
    );
    await expect(page.getByText('Looks good.')).toBeVisible();
  });

  test('shows an associated error after the message field is left empty', async ({ page }) => {
    await page.getByLabel('Name').fill('Jane Tester');
    await page.getByLabel('Email').fill('jane@example.com');
    const messageInput = page.getByLabel('Message');
    await messageInput.focus();
    await page.getByLabel('Email').focus();

    await expect(page.getByLabel('Name')).toHaveValue('Jane Tester');
    await expect(page.getByLabel('Email')).toHaveValue('jane@example.com');
    await expect(messageInput).toHaveValue('');

    await expect(messageInput).toHaveAttribute('aria-invalid', 'true');
    await expect(messageInput).toHaveAccessibleDescription(/Error: Enter a message\./);

    const describedBy = await messageInput.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    await expect(page.locator(`#${describedBy}`)).toContainText(/enter a message/i);
  });

  test('does not expose a direct email address', async ({ page }) => {
    // The contact form is the only contact surface -- no mailto fallback.
    await expect(page.locator('a[href^="mailto:"]')).toHaveCount(0);
  });
});
